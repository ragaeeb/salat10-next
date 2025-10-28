'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Settings2Icon } from 'lucide-react';
import { AnimatePresence, type MotionValue, motion, useScroll, useSpring, useTransform } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ShinyText } from '@/components/magicui/shiny-text';
import { Moon } from '@/components/moon';
import { Sun } from '@/components/sun';
import { Button } from '@/components/ui/button';
import { daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useSettings } from '@/lib/settings';
import {
    FajrGradient,
    LightRays,
    RadialGradientOverlay,
    SkyBackground,
    StarsLayer,
    SunsetGradient,
} from './components';

/* ================================
   Data-driven layout (no brittle constants)
================================= */

const DAY_HEIGHT_PX = 10000;
const MAX_BUFFERED_DAYS = 5;

/** Screen-space positions */
const POS = { EAST_X: 85, LOW_Y: 80, MOON_Y: 76, SUN_PEAK_Y_DELTA: 40, WEST_X: 15 } as const;

/** Seam band for inter-day crossfades (expressed as fraction of the day height) */
const SEAM_FRAC = 0.015;

/** Transition fractions are relative to the *intervals* they act on */
const FRAC = {
    FAJR_GLOW_TAIL_OF_SUNRISE: 0.25, // tail after sunrise (% of [fajr->sunrise] interval)
    MOON_PRE_MAGHRIB_APPEAR: 0.2, // start moon this % before maghrib (within [asr->maghrib])
    SUN_FADE_PRE_MAGHRIB: 0.25, // last % of [asr->maghrib] to fade the sun
    SUNSET_FADE_BEFORE_ISHA: 0.25, // fade sunset gradient in last % of [maghrib->isha]
    SUNSET_HOLD_AFTER_MAGHRIB: 0.25, // hold max dusk gradient for this % before fading to isha
} as const;

/* ================================
   Utilities & Timeline
================================= */

type Timing = { event: string; value: Date; label: string };
type DayData = {
    date: Date;
    timings: Timing[];
    nextFajr: Date | null; // for normalization of [0..1] timeline
    dayIndex: number;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : clamp01((v - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const pick = (timings: DayData['timings'], key: string) => timings.find((t) => t.event === key)?.value;
const fmt = (d: Date | undefined, timeZone: string) =>
    d
        ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: true, minute: '2-digit', timeZone }).format(d)
        : '';

type Timeline = {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
    midNight: number;
    lastThird: number;
    end: number; // 1.0
};

/** Build a normalized [0..1] timeline from actual times: 0 = today's Fajr, 1 = next day's Fajr */
function buildTimeline(day: DayData): Timeline {
    const tFajr = pick(day.timings, 'fajr');
    const tSunrise = pick(day.timings, 'sunrise');
    const tDhuhr = pick(day.timings, 'dhuhr');
    const tAsr = pick(day.timings, 'asr');
    const tMaghrib = pick(day.timings, 'maghrib');
    const tIsha = pick(day.timings, 'isha');
    const tMid = pick(day.timings, 'middleOfTheNight');
    const tLast = pick(day.timings, 'lastThirdOfTheNight');
    const tNextFajr = day.nextFajr;

    if (!tFajr || !tSunrise || !tDhuhr || !tAsr || !tMaghrib || !tIsha || !tMid || !tLast || !tNextFajr) {
        // Fallback to fixed fractions if anything is missing (should be rare)
        return {
            asr: 0.65,
            // Dhuhr at true midday between sunrise and maghrib
            dhuhr: (0.1 + 0.8) / 2,
            end: 1,
            fajr: 0,
            isha: 0.87,
            lastThird: 0.95,
            maghrib: 0.8,
            midNight: 0.93,
            sunrise: 0.1,
        };
    }

    const start = tFajr.getTime();
    const end = tNextFajr.getTime();
    const span = Math.max(1, end - start);

    const toP = (d: Date) => clamp01((d.getTime() - start) / span);

    const pSunrise = toP(tSunrise);
    const pMaghrib = toP(tMaghrib);
    // Place Dhuhr at the *meridian* (midpoint between sunrise & maghrib) visually,
    // regardless of slight equation-of-time offsets in the computed 'dhuhr' label.
    const pDhuhr = (pSunrise + pMaghrib) / 2;

    return {
        asr: toP(tAsr),
        dhuhr: pDhuhr,
        end: 1,
        fajr: 0,
        isha: toP(tIsha),
        lastThird: toP(tLast),
        maghrib: pMaghrib,
        midNight: toP(tMid),
        sunrise: pSunrise,
    };
}

/** Where should the initial scroll be for the current time? */
const timeToScroll = (nowMs: number, day: DayData) => {
    const fajr = pick(day.timings, 'fajr')?.getTime();
    const nextFajr = day.nextFajr?.getTime();
    if (!fajr || !nextFajr) {
        return 0;
    }

    if (nowMs <= fajr) {
        return 0; // before fajr: start at top
    }
    if (nowMs >= nextFajr) {
        return 0.999; // after next fajr: clamp near bottom
    }

    return clamp01((nowMs - fajr) / (nextFajr - fajr));
};

function phaseLabelAndTime(p: number, tl: Timeline, timings: DayData['timings'], tz: string) {
    if (p < tl.sunrise) {
        return { label: 'Fajr', time: fmt(pick(timings, 'fajr'), tz) };
    }
    if (p < tl.dhuhr) {
        return { label: 'Sunrise', time: fmt(pick(timings, 'sunrise'), tz) };
    }
    if (p < tl.asr) {
        return { label: 'Dhuhr', time: fmt(pick(timings, 'dhuhr'), tz) };
    }
    if (p < tl.maghrib) {
        return { label: 'Asr', time: fmt(pick(timings, 'asr'), tz) };
    }
    if (p < tl.isha) {
        return { label: 'Maghrib', time: fmt(pick(timings, 'maghrib'), tz) };
    }
    if (p < tl.midNight) {
        return { label: 'Isha', time: fmt(pick(timings, 'isha'), tz) };
    }
    if (p < tl.lastThird) {
        return { label: 'Half the Night', time: fmt(pick(timings, 'middleOfTheNight'), tz) };
    }
    return { label: 'Last 1/3 of the night', time: fmt(pick(timings, 'lastThirdOfTheNight'), tz) };
}

/* Visual curves driven by the timeline */
const skyColorAt = (p: number, tl: Timeline): string => {
    if (p < tl.sunrise) {
        // Night pre-dawn base (Fajr gradient will sit on top)
        return 'rgba(26, 26, 46, 0.35)';
    }
    if (p < tl.dhuhr) {
        return 'rgba(135, 206, 235, 0.30)';
    }
    if (p < tl.asr) {
        return 'rgba(150, 215, 245, 0.32)';
    }
    if (p < tl.maghrib) {
        return 'rgba(160, 220, 255, 0.35)';
    }
    if (p < tl.isha) {
        const t = invLerp(tl.maghrib, tl.isha, p);
        return `rgba(${lerp(160, 40, t)}, ${lerp(220, 40, t)}, ${lerp(255, 60, t)}, ${lerp(0.35, 0.6, t)})`;
    }
    if (p < tl.midNight) {
        return 'rgba(10, 12, 28, 0.90)';
    }
    if (p < tl.lastThird) {
        return 'rgba(6, 8, 20, 0.95)';
    }
    return 'rgba(5, 7, 16, 0.98)';
};

const starsOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.isha) {
        return 0;
    }
    if (p < tl.midNight) {
        return invLerp(tl.isha, tl.midNight, p);
    }
    return 1;
};

const fajrGradientOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.fajr) {
        return 0;
    }
    if (p < tl.sunrise) {
        const t = invLerp(tl.fajr, tl.sunrise, p);
        return 0.7 + 0.3 * t; // visible immediately at Fajr (checklist #1)
    }
    const tail = lerp(0, tl.sunrise - tl.fajr, FRAC.FAJR_GLOW_TAIL_OF_SUNRISE);
    if (p < tl.sunrise + tail) {
        return 1 - invLerp(tl.sunrise, tl.sunrise + tail, p);
    }
    return 0;
};

const sunsetGradientOpacityAt = (p: number, tl: Timeline): number => {
    // Start orange exactly halfway between Asr & Maghrib (checklist #5)
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    if (p < orangeStart) {
        return 0;
    }

    const holdEnd = lerp(tl.maghrib, tl.isha, FRAC.SUNSET_HOLD_AFTER_MAGHRIB);
    const fadeStart = lerp(tl.maghrib, tl.isha, 1 - FRAC.SUNSET_FADE_BEFORE_ISHA);

    if (p < holdEnd) {
        return invLerp(orangeStart, holdEnd, p);
    }
    if (p < fadeStart) {
        return 1;
    }
    if (p < tl.isha) {
        return 1 - invLerp(fadeStart, tl.isha, p);
    }
    return 0;
};

const sunColorChannelAt = (p: number, tl: Timeline, ch: 'r' | 'g' | 'b'): number => {
    const day = { b: 102, g: 223, r: 255 };
    const dusk = { b: 0, g: 140, r: 255 };
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    if (p <= orangeStart) {
        return day[ch];
    }
    const t = invLerp(orangeStart, tl.maghrib, p);
    return Math.round(lerp(day[ch], dusk[ch], t));
};

const sunOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.sunrise) {
        return 0;
    }
    // fade shortly before Maghrib (checklist #6)
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    const fadeStart = lerp(orangeStart, tl.maghrib, 1 - FRAC.SUN_FADE_PRE_MAGHRIB);
    if (p < fadeStart) {
        return 1;
    }
    if (p < tl.maghrib) {
        return 1 - invLerp(fadeStart, tl.maghrib, p);
    }
    return 0; // at Maghrib the sun is fully gone (checklist #7)
};

const moonOpacityAt = (p: number, tl: Timeline): number => {
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    const appearStart = lerp(orangeStart, tl.maghrib, 1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
    if (p < appearStart) {
        return 0;
    }
    if (p < tl.maghrib) {
        return invLerp(appearStart, tl.maghrib, p);
    }
    return 1; // moon fully visible at/after Maghrib (checklist #7)
};

const lightRaysOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.fajr) {
        return 0;
    }
    if (p < tl.sunrise) {
        return invLerp(tl.fajr, tl.sunrise, p) * 0.4;
    }
    // gentle tail after sunrise
    const tail = lerp(0, tl.sunrise - tl.fajr, 0.15);
    if (p < tl.sunrise + tail) {
        return (1 - invLerp(tl.sunrise, tl.sunrise + tail, p)) * 0.4;
    }
    return 0;
};

/* ================================
   Hooks
================================= */

const useDevicePrefs = () => {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsMobile(window.matchMedia('(pointer:coarse)').matches);
        setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, []);

    return { isMobile, mounted, reducedMotion };
};

const useDaysData = (calculationArgs: Parameters<typeof daily>[1]) => {
    const [days, setDays] = useState<DayData[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);
    const lastScrollY = useRef(0);
    const dayIndexCounter = useRef(0);

    const loadDay = useCallback(
        (date: Date): DayData => {
            const todayRes = daily(salatLabels, calculationArgs, date);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextRes = daily(salatLabels, calculationArgs, nextDate);
            const nextFajr = nextRes.timings.find((t: Timing) => t.event === 'fajr')?.value ?? null;
            return { date, dayIndex: dayIndexCounter.current++, nextFajr, timings: todayRes.timings };
        },
        [calculationArgs],
    );

    useEffect(() => {
        const today = new Date();
        dayIndexCounter.current = 0;
        setDays([loadDay(today)]);
    }, [loadDay]);

    return { days, hasInitialized, lastScrollY, loadDay, setDays, setHasInitialized };
};

const useScrollBookkeeping = (
    scrollY: ReturnType<typeof useScroll>['scrollY'],
    deps: {
        daysLen: number;
        hasInitialized: boolean;
        totalHeight: number;
        currentDayIndex: number;
        setCurrentDayIndex: (n: number) => void;
        setShowLoadPrev: (fn: (p: boolean) => boolean | boolean) => void;
        setShowLoadNext: (fn: (p: boolean) => boolean | boolean) => void;
        lastScrollY: React.MutableRefObject<number>;
    },
) => {
    useEffect(() => {
        if (!deps.hasInitialized || deps.daysLen === 0) {
            return;
        }

        const unsub = scrollY.on('change', (latest) => {
            deps.lastScrollY.current = latest;
            const dayIndex = Math.floor(latest / DAY_HEIGHT_PX);
            if (dayIndex !== deps.currentDayIndex) {
                deps.setCurrentDayIndex(dayIndex);
            }

            const distanceFromTop = latest;
            const distanceFromBottom = deps.totalHeight - latest - window.innerHeight;

            const nextPrev = distanceFromTop < 2000;
            const nextNext = distanceFromBottom < 2000;

            deps.setShowLoadPrev((prev: boolean) => (prev !== nextPrev ? nextPrev : prev));
            deps.setShowLoadNext((prev: boolean) => (prev !== nextNext ? nextNext : prev));
        });
        return () => unsub();
    }, [scrollY, deps]);
};

/* ================================
   Component
================================= */

export default function ParallaxPage() {
    const { settings, hydrated, numeric } = useSettings();
    if (!hydrated) {
        return null;
    }
    return <ParallaxInner settings={settings} numeric={numeric} />;
}

type SettingsT = ReturnType<typeof useSettings>['settings'];
type NumericT = ReturnType<typeof useSettings>['numeric'];

function ParallaxInner({ settings, numeric }: { settings: SettingsT; numeric: NumericT }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    const timeZone = (settings.timeZone?.trim() || 'UTC') as string;
    const calculationArgs = useMemo(
        () => ({
            fajrAngle: Number.isFinite(numeric.fajrAngle) ? numeric.fajrAngle : 0,
            ishaAngle: Number.isFinite(numeric.ishaAngle) ? numeric.ishaAngle : 0,
            ishaInterval: Number.isFinite(numeric.ishaInterval) ? numeric.ishaInterval : 0,
            latitude: settings.latitude || '0',
            longitude: settings.longitude || '0',
            method: settings.method,
            timeZone,
        }),
        [
            numeric.fajrAngle,
            numeric.ishaAngle,
            numeric.ishaInterval,
            settings.latitude,
            settings.longitude,
            settings.method,
            timeZone,
        ],
    );

    const { mounted, isMobile, reducedMotion } = useDevicePrefs();
    const { days, setDays, hasInitialized, setHasInitialized, lastScrollY, loadDay } = useDaysData(calculationArgs);

    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    const totalHeight = days.length * DAY_HEIGHT_PX;
    const totalHeightStyle = useMemo(() => ({ height: totalHeight }), [totalHeight]);

    const currentDay = days[currentDayIndex];
    const timeline = useMemo(() => (currentDay ? buildTimeline(currentDay) : null), [currentDay]);

    // Initial scroll to the correct phase (checklist #17)
    useEffect(() => {
        if (hasInitialized || days.length === 0) {
            return;
        }
        const today = days[0]!;
        const initialP = timeToScroll(Date.now(), today);
        const scrollTop = initialP * DAY_HEIGHT_PX;
        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'auto', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        setHasInitialized(true);
        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [hasInitialized, days, lastScrollY, setHasInitialized]);

    // Progress within current day, clamped to prevent wrapping to next day's Fajr at the very end
    const scrollProgress = useTransform(scrollY, (latest) => {
        const withinDay = latest % DAY_HEIGHT_PX;
        const p = withinDay / DAY_HEIGHT_PX;
        return Math.min(p, 0.999);
    });

    // keep a plain number for branching & seam work
    const [pNow, setPNow] = useState(0);
    useEffect(() => {
        const unsub = scrollProgress.on('change', (p) => setPNow(p));
        return () => unsub();
    }, [scrollProgress]);

    /* Visual transforms (all driven by timeline) */
    const skyColor = useTransform(scrollProgress, (p) => (timeline ? skyColorAt(p, timeline) : 'rgba(0,0,0,1)'));
    const starsOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? starsOpacityAt(p, timeline) : 0));
    const fajrGradientOpacityRaw = useTransform(scrollProgress, (p) =>
        timeline ? fajrGradientOpacityAt(p, timeline) : 0,
    );
    const sunsetGradientOpacityRaw = useTransform(scrollProgress, (p) =>
        timeline ? sunsetGradientOpacityAt(p, timeline) : 0,
    );
    const lightRaysOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? lightRaysOpacityAt(p, timeline) : 0));

    const opacitySpringCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const starsOpacity = useSpring(starsOpacityRaw, opacitySpringCfg);
    const fajrGradientOpacity = useSpring(fajrGradientOpacityRaw, opacitySpringCfg);
    const sunsetGradientOpacity = useSpring(sunsetGradientOpacityRaw, opacitySpringCfg);
    const lightRaysOpacity = useSpring(lightRaysOpacityRaw, opacitySpringCfg);

    // Sun motion: RIGHT -> LEFT (east->west), arcing only during daylight (checklist #15)
    const sunXRaw = useTransform(scrollProgress, (p) => {
        if (!timeline) {
            return POS.EAST_X;
        }
        if (p <= timeline.sunrise) {
            return POS.EAST_X;
        }
        if (p >= timeline.maghrib) {
            return POS.WEST_X;
        }
        return lerp(POS.EAST_X, POS.WEST_X, invLerp(timeline.sunrise, timeline.maghrib, p));
    });
    const sunYRaw = useTransform(scrollProgress, (p) => {
        if (!timeline) {
            return POS.LOW_Y;
        }
        if (p <= timeline.sunrise || p >= timeline.maghrib) {
            return POS.LOW_Y;
        }
        const t = invLerp(timeline.sunrise, timeline.maghrib, p);
        return POS.LOW_Y - POS.SUN_PEAK_Y_DELTA * (1 - (2 * t - 1) ** 2);
    });
    const sunOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? sunOpacityAt(p, timeline) : 0));
    const sunColorR = useTransform(scrollProgress, (p) => (timeline ? sunColorChannelAt(p, timeline, 'r') : 255));
    const sunColorG = useTransform(scrollProgress, (p) => (timeline ? sunColorChannelAt(p, timeline, 'g') : 223));
    const sunColorB = useTransform(scrollProgress, (p) => (timeline ? sunColorChannelAt(p, timeline, 'b') : 102));

    // Moon motion: LEFT <- RIGHT in a straight line (checklist #16)
    const moonXRaw = useTransform(scrollProgress, (p) => {
        if (!timeline) {
            return POS.EAST_X;
        }
        const orangeStart = (timeline.asr + timeline.maghrib) / 2;
        const appearStart = lerp(orangeStart, timeline.maghrib, 1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
        if (p < timeline.sunrise) {
            return POS.EAST_X; // keep offscreen path consistent
        }
        if (p <= appearStart) {
            return POS.WEST_X;
        }
        return lerp(POS.WEST_X, POS.EAST_X, invLerp(appearStart, 1.0, p));
    });
    const moonYRaw = useTransform(scrollProgress, () => POS.MOON_Y);
    const moonOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? moonOpacityAt(p, timeline) : 0));

    const springCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const sunX = useSpring(sunXRaw, springCfg);
    const sunY = useSpring(sunYRaw, springCfg);
    const sunOpacity = useSpring(sunOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    const moonX = useSpring(moonXRaw, springCfg);
    const moonY = useSpring(moonYRaw, springCfg);
    const moonOpacity = useSpring(moonOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    // Phase info label + time
    const [phaseInfo, setPhaseInfo] = useState<{ label: string; time: string }>({ label: '', time: '' });
    useEffect(() => {
        if (!timeline || !currentDay) {
            return;
        }
        const unsub = scrollProgress.on('change', (p) => {
            const info = phaseLabelAndTime(p, timeline, currentDay.timings, timeZone);
            setPhaseInfo((prev) => (prev.label === info.label && prev.time === info.time ? prev : info));
        });
        return () => unsub();
    }, [scrollProgress, timeline, currentDay, timeZone]);

    useScrollBookkeeping(scrollY, {
        currentDayIndex,
        daysLen: days.length,
        hasInitialized,
        lastScrollY,
        setCurrentDayIndex,
        setShowLoadNext,
        setShowLoadPrev,
        totalHeight,
    });

    // Load day handlers (checklist #12 & #13)
    const handleLoadPrev = useCallback(() => {
        setDays((prev) => {
            const firstDate = prev[0].date;
            const newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() - 1);
            const newDay = loadDay(newDate);
            const next = [newDay, ...prev].slice(0, MAX_BUFFERED_DAYS);
            return next;
        });
        requestAnimationFrame(() => {
            // keep visual position after prepending
            window.scrollTo({ behavior: 'auto', left: 0, top: lastScrollY.current + DAY_HEIGHT_PX });
        });
    }, [loadDay, setDays, lastScrollY]);

    const handleLoadNext = useCallback(() => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1].date;
            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + 1);
            const newDay = loadDay(newDate);
            const next = [...prev, newDay];
            return next.length > MAX_BUFFERED_DAYS ? next.slice(next.length - MAX_BUFFERED_DAYS) : next;
        });
    }, [loadDay, setDays]);

    // Stars/comets controls:
    // - Stars fade in from Isha to Midnight, fully on after (checklist #8, #9, #10)
    // - Comets only during Last 1/3 (checklist #11)
    const cometsEnabled = !!timeline && pNow >= timeline.lastThird;

    // Seam crossfades for smooth transitions between days (checklist #14)
    const hasPrev = currentDayIndex > 0;
    const hasNext = currentDayIndex < days.length - 1;
    const seamBand = SEAM_FRAC;
    const topSeamStarsOpacity = hasPrev ? 1 - invLerp(0, seamBand, pNow) : 0; // fade in stars as we approach the very top
    const bottomSeamFajrOpacity = hasNext ? invLerp(1 - seamBand, 1, pNow) : 0; // preview Fajr glow as we approach bottom

    const STAR_DENSITY = isMobile ? 0.00005 : 0.0002;
    const SHOOT_MIN_DELAY = isMobile ? 2000 : 1200;
    const SHOOT_MAX_DELAY = isMobile ? 6000 : 4200;

    return (
        <>
            <div ref={containerRef} style={totalHeightStyle} />

            <div className="fixed inset-0">
                <SkyBackground skyColor={skyColor} />
                {/* Fajr & Sunset gradients */}
                <FajrGradient opacity={fajrGradientOpacity} />
                <SunsetGradient opacity={sunsetGradientOpacity} />

                {/* Star field (no comets until Last 1/3) */}
                {mounted && (
                    <StarsLayer
                        opacity={starsOpacity}
                        shooting={cometsEnabled}
                        density={STAR_DENSITY}
                        minDelay={SHOOT_MIN_DELAY}
                        maxDelay={SHOOT_MAX_DELAY}
                        disabled={reducedMotion}
                    />
                )}

                {/* Gentle rays near sunrise */}
                <LightRays opacity={lightRaysOpacity} />

                {/* Radial enhancement */}
                <RadialGradientOverlay />

                {/* Seam crossfades */}
                {hasPrev && mounted && (
                    <StarsLayer
                        opacity={topSeamStarsOpacity}
                        shooting
                        density={STAR_DENSITY}
                        minDelay={SHOOT_MIN_DELAY}
                        maxDelay={SHOOT_MAX_DELAY}
                        disabled={reducedMotion}
                    />
                )}
                {hasNext && <FajrGradient opacity={bottomSeamFajrOpacity * 0.8} />}

                {/* Sun (RIGHT -> LEFT arc) */}
                <Sun
                    size={120}
                    x={sunX}
                    y={sunY}
                    opacity={sunOpacity}
                    color={{ b: sunColorB, g: sunColorG, r: sunColorR }}
                />

                {/* Moon (LEFT -> RIGHT, straight line) */}
                <Moon x={moonX} y={moonY} opacity={moonOpacity} color={{ b: 255, g: 255, r: 255 }} />

                {/* Center title + time */}
                <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-25">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phaseInfo.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                        >
                            <ShinyText className="block text-balance text-center font-extrabold text-[clamp(2rem,8vw,4.5rem)] text-foreground/60 leading-tight drop-shadow-sm">
                                {phaseInfo.label}
                            </ShinyText>
                        </motion.div>
                    </AnimatePresence>
                    {!!phaseInfo.time && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={phaseInfo.time}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="mt-4 text-center font-semibold text-[clamp(1.5rem,4vw,2.5rem)] text-foreground/50"
                            >
                                {phaseInfo.time}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Load controls */}
                {showLoadPrev && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="-translate-x-1/2 absolute top-20 left-1/2 z-60"
                    >
                        <Button
                            onClick={handleLoadPrev}
                            size="lg"
                            className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        >
                            <ChevronUp className="mr-2 h-5 w-5" />
                            Load Previous Day
                        </Button>
                    </motion.div>
                )}

                {showLoadNext && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="-translate-x-1/2 absolute bottom-20 left-1/2 z-60"
                    >
                        <Button
                            onClick={handleLoadNext}
                            size="lg"
                            className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        >
                            Load Next Day
                            <ChevronDown className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                )}

                {/* Nav buttons */}
                <div className="absolute top-4 right-4 z-60 flex items-center gap-2 sm:top-6 sm:right-6">
                    <Button
                        asChild
                        className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        size="sm"
                        variant="default"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Card View
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        size="icon"
                    >
                        <Link aria-label="Open settings" href="/settings">
                            <Settings2Icon className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}
