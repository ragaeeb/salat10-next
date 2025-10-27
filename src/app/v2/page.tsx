'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Settings2Icon } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ShinyText } from '@/components/magicui/shiny-text';
import { Button } from '@/components/ui/button';
import { daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useSettings } from '@/lib/settings';

import {
    FajrGradient,
    LightRays,
    Moon as MoonNode,
    RadialGradientOverlay,
    SkyBackground,
    StarsLayer,
    Sun as SunNode,
    SunsetGradient,
} from './components';

/* ================================
   Constants (no magic numbers)
================================= */

const DAY_HEIGHT_PX = 20000;
const MAX_BUFFERED_DAYS = 5;

const POS = {
    EAST_X: 85, // visual right
    LOW_Y: 80,
    MOON_PEAK_Y_DELTA: 30,
    SUN_PEAK_Y_DELTA: 40,
    WEST_X: 15, // visual left
} as const;

const PHASE = {
    ASR: 0.65,
    DHUHR: 0.5,
    END: 1.0,
    FAJR: 0.0,
    ISHA: 0.87,
    LAST_THIRD: 0.97,
    MAGHRIB: 0.8,
    MID_NIGHT: 0.93,
    SUNRISE: 0.1,
} as const;

const TRANSITIONS = {
    FAJR_GLOW_AFTER_SUNRISE: 0.05, // how long fajr glow lingers after sunrise
    MOON_PRE_MAGHRIB_APPEAR: 0.02, // moon begins just before Maghrib
    SUN_ORANGE_LEAD: 0.04, // starts orange a bit before Maghrib
    SUNSET_FADE_BEFORE_ISHA: 0.02, // fade out sunset gradient just before Isha
    SUNSET_HOLD: 0.03, // how long sunset gradient ramps in after Maghrib
} as const;

/* ================================
   Utilities
================================= */

type DayData = { date: Date; timings: Array<{ event: string; value: Date; label: string }> };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const invLerp = (a: number, b: number, v: number) => clamp01((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const formatTime = (d: Date | undefined, timeZone: string) => {
    if (!d) {
        return '';
    }
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: true, minute: '2-digit', timeZone }).format(d);
};

const pick = (timings: DayData['timings'], key: string) => timings.find((t) => t.event === key)?.value;

/* Map wall clock to initial scroll 0..1 */
const timeToScroll = (now: number, timings: Array<{ event: string; value: Date }>) => {
    const t = {
        asr: timings.find((x) => x.event === 'asr')?.value.getTime(),
        dhuhr: timings.find((x) => x.event === 'dhuhr')?.value.getTime(),
        fajr: timings.find((x) => x.event === 'fajr')?.value.getTime(),
        isha: timings.find((x) => x.event === 'isha')?.value.getTime(),
        last: timings.find((x) => x.event === 'lastThirdOfTheNight')?.value.getTime(),
        maghrib: timings.find((x) => x.event === 'maghrib')?.value.getTime(),
        mid: timings.find((x) => x.event === 'middleOfTheNight')?.value.getTime(),
        sunrise: timings.find((x) => x.event === 'sunrise')?.value.getTime(),
    };

    if (!t.fajr || !t.sunrise || !t.dhuhr) {
        return 0.05;
    }

    if (t.isha && t.mid && now >= t.isha && now < t.mid) {
        return lerp(PHASE.ISHA, PHASE.MID_NIGHT, (now - t.isha) / (t.mid - t.isha));
    }
    if (t.mid && t.last && now >= t.mid && now < t.last) {
        return lerp(PHASE.MID_NIGHT, PHASE.LAST_THIRD, (now - t.mid) / (t.last - t.mid));
    }
    if (t.last && now >= t.last && now < t.fajr) {
        return lerp(PHASE.LAST_THIRD, PHASE.END, (now - t.last) / (t.fajr - t.last));
    }
    if (now < t.fajr) {
        return PHASE.FAJR;
    }
    if (now < t.sunrise) {
        return lerp(PHASE.FAJR, PHASE.SUNRISE, (now - t.fajr) / (t.sunrise - t.fajr));
    }
    if (now < t.dhuhr) {
        return lerp(PHASE.SUNRISE, PHASE.DHUHR, (now - t.sunrise) / (t.dhuhr - t.sunrise));
    }
    if (t.asr && now < t.asr) {
        return lerp(PHASE.DHUHR, PHASE.ASR, (now - t.dhuhr) / (t.asr - t.dhuhr));
    }
    if (t.maghrib && now < t.maghrib) {
        return lerp(PHASE.ASR, PHASE.MAGHRIB, (now - (t.asr ?? now)) / (t.maghrib - (t.asr ?? now)));
    }
    if (t.isha && now < t.isha) {
        return lerp(PHASE.MAGHRIB, PHASE.ISHA, (now - (t.maghrib ?? now)) / (t.isha - (t.maghrib ?? now)));
    }
    return PHASE.ISHA;
};

/* Scroll -> label/time (ensures ISHA appears explicitly) */
const getPhaseInfo = (p: number, timings: DayData['timings'], timeZone: string) => {
    if (p < PHASE.SUNRISE) {
        return { label: 'Fajr', time: formatTime(pick(timings, 'fajr'), timeZone) };
    }
    if (p < PHASE.DHUHR) {
        return { label: 'Sunrise', time: formatTime(pick(timings, 'sunrise'), timeZone) };
    }
    if (p < PHASE.ASR) {
        return { label: 'Dhuhr', time: formatTime(pick(timings, 'dhuhr'), timeZone) };
    }
    if (p < PHASE.MAGHRIB) {
        return { label: 'Asr', time: formatTime(pick(timings, 'asr'), timeZone) };
    }
    if (p < PHASE.ISHA) {
        return { label: 'Maghrib', time: formatTime(pick(timings, 'maghrib'), timeZone) };
    }
    if (p < PHASE.MID_NIGHT) {
        return { label: 'Isha', time: formatTime(pick(timings, 'isha'), timeZone) };
    }
    if (p < PHASE.LAST_THIRD) {
        return { label: 'Half the Night', time: formatTime(pick(timings, 'middleOfTheNight'), timeZone) };
    }
    return { label: 'Last Third of the Night', time: formatTime(pick(timings, 'lastThirdOfTheNight'), timeZone) };
};

/* Visual curves */
const getSkyColor = (p: number): string => {
    if (p < PHASE.SUNRISE) {
        return 'rgba(26, 26, 46, 0.35)'; // pre-sunrise deep night with Fajr glow on top layer
    }
    if (p < PHASE.DHUHR) {
        return 'rgba(135, 206, 235, 0.30)';
    }
    if (p < PHASE.ASR) {
        return 'rgba(150, 215, 245, 0.32)';
    }
    if (p < PHASE.MAGHRIB) {
        return 'rgba(160, 220, 255, 0.35)';
    }
    if (p < PHASE.ISHA) {
        const t = invLerp(PHASE.MAGHRIB, PHASE.ISHA, p);
        return `rgba(${lerp(160, 40, t)}, ${lerp(220, 40, t)}, ${lerp(255, 60, t)}, ${lerp(0.35, 0.6, t)})`;
    }
    if (p < PHASE.MID_NIGHT) {
        return 'rgba(10, 12, 28, 0.90)';
    }
    if (p < PHASE.LAST_THIRD) {
        return 'rgba(6, 8, 20, 0.95)';
    }
    return 'rgba(5, 7, 16, 0.98)';
};

const getStarsOpacity = (p: number): number => {
    if (p < PHASE.ISHA) {
        return 0;
    }
    if (p < PHASE.MID_NIGHT) {
        return invLerp(PHASE.ISHA, PHASE.MID_NIGHT, p);
    }
    return 1;
};

const getFajrGradientOpacity = (p: number): number => {
    // 1) Must start at Fajr (yellowish)  2) Linger briefly after sunrise
    if (p < PHASE.FAJR) {
        return 0;
    }
    if (p < PHASE.SUNRISE) {
        return invLerp(PHASE.FAJR, PHASE.SUNRISE, p) * 1.0;
    }
    if (p < PHASE.SUNRISE + TRANSITIONS.FAJR_GLOW_AFTER_SUNRISE) {
        return 1 - invLerp(PHASE.SUNRISE, PHASE.SUNRISE + TRANSITIONS.FAJR_GLOW_AFTER_SUNRISE, p);
    }
    return 0;
};

const getSunsetGradientOpacity = (p: number): number => {
    // Show only from Maghrib -> Isha
    if (p < PHASE.MAGHRIB) {
        return 0;
    }
    if (p < PHASE.MAGHRIB + TRANSITIONS.SUNSET_HOLD) {
        return invLerp(PHASE.MAGHRIB, PHASE.MAGHRIB + TRANSITIONS.SUNSET_HOLD, p);
    }
    if (p < PHASE.ISHA - TRANSITIONS.SUNSET_FADE_BEFORE_ISHA) {
        return 1;
    }
    if (p < PHASE.ISHA) {
        return 1 - invLerp(PHASE.ISHA - TRANSITIONS.SUNSET_FADE_BEFORE_ISHA, PHASE.ISHA, p);
    }
    return 0;
};

const getLightRaysOpacity = (p: number): number => {
    // Gentle bloom only around sunrise (not at Asr/Maghrib)
    if (p < PHASE.FAJR) {
        return 0;
    }
    if (p < PHASE.SUNRISE) {
        return invLerp(PHASE.FAJR, PHASE.SUNRISE, p) * 0.4;
    }
    if (p < PHASE.SUNRISE + 0.05) {
        return (1 - invLerp(PHASE.SUNRISE, PHASE.SUNRISE + 0.05, p)) * 0.4;
    }
    return 0;
};

/* Sun colour transitions: start turning orange a bit BEFORE Maghrib */
const getSunColorChannel = (p: number, ch: 'r' | 'g' | 'b'): number => {
    const day = { b: 102, g: 223, r: 255 }; // warm daylight
    const dusk = { b: 0, g: 140, r: 255 }; // orange
    const start = Math.max(PHASE.MAGHRIB - TRANSITIONS.SUN_ORANGE_LEAD, PHASE.SUNRISE);
    if (p <= start) {
        return day[ch];
    }
    const t = invLerp(start, PHASE.MAGHRIB, p);
    return Math.round(lerp(day[ch], dusk[ch], t));
};

const getSunOpacity = (p: number): number => {
    if (p < PHASE.SUNRISE) {
        return 0;
    }
    if (p < PHASE.MAGHRIB) {
        return 1;
    }
    if (p < PHASE.ISHA) {
        return 1 - invLerp(PHASE.MAGHRIB, PHASE.ISHA, p);
    }
    return 0;
};

/* Moon opacity must be continuous across END->FAJR */
const getMoonOpacity = (p: number): number => {
    // Appear slightly before Maghrib, strong at night, then fade from Last Third -> Fajr -> Sunrise
    const appearStart = PHASE.MAGHRIB - TRANSITIONS.MOON_PRE_MAGHRIB_APPEAR;
    if (p < appearStart) {
        return 0;
    }
    if (p < PHASE.MAGHRIB) {
        return lerp(0, 0.7, invLerp(appearStart, PHASE.MAGHRIB, p));
    }
    if (p < PHASE.MID_NIGHT) {
        return lerp(0.7, 0.9, invLerp(PHASE.MAGHRIB, PHASE.MID_NIGHT, p));
    }
    if (p < PHASE.LAST_THIRD) {
        return lerp(0.9, 1.0, invLerp(PHASE.MID_NIGHT, PHASE.LAST_THIRD, p));
    }
    if (p < PHASE.END) {
        return lerp(1.0, 0.2, invLerp(PHASE.LAST_THIRD, PHASE.END, p)); // begin disappearing
    }
    // Continuity into the next day (FAJR..SUNRISE)
    if (p < PHASE.SUNRISE) {
        return lerp(0.2, 0.0, invLerp(PHASE.FAJR, PHASE.SUNRISE, p)); // finish fading out
    }
    return 0;
};

/* ================================
   Hooks (smaller, maintainable)
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

    const loadDay = useCallback(
        (date: Date): DayData => {
            const result = daily(salatLabels, calculationArgs, date);
            return { date, timings: result.timings };
        },
        [calculationArgs],
    );

    useEffect(() => {
        const today = new Date();
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

            const nextPrev = distanceFromTop < 3000;
            const nextNext = distanceFromBottom < 3000;

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
        return null; // keep hook order stable, avoid hydration drift
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

    // initial scroll set based on today's timings
    useEffect(() => {
        if (hasInitialized || days.length === 0) {
            return;
        }
        const today = days[0];
        const scrollTop = timeToScroll(Date.now(), today.timings) * DAY_HEIGHT_PX;
        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'auto', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        setHasInitialized(true);
        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [hasInitialized, days, lastScrollY, setHasInitialized]);

    // % progress within current day
    const scrollProgress = useTransform(scrollY, (latest) => (latest % DAY_HEIGHT_PX) / DAY_HEIGHT_PX);

    // Visual opacities/colours
    const skyColor = useTransform(scrollProgress, getSkyColor);
    const starsOpacity = useTransform(scrollProgress, getStarsOpacity);
    const fajrGradientOpacity = useTransform(scrollProgress, getFajrGradientOpacity);
    const sunsetGradientOpacity = useTransform(scrollProgress, getSunsetGradientOpacity);
    const lightRaysOpacity = useTransform(scrollProgress, getLightRaysOpacity);

    // Sun motion (east -> west as you scroll forward through the day)
    const sunXRaw = useTransform(scrollProgress, (p) => {
        if (p <= PHASE.SUNRISE) {
            return POS.EAST_X;
        }
        if (p >= PHASE.MAGHRIB) {
            return POS.WEST_X;
        }
        return lerp(POS.EAST_X, POS.WEST_X, invLerp(PHASE.SUNRISE, PHASE.MAGHRIB, p));
    });
    const sunYRaw = useTransform(scrollProgress, (p) => {
        if (p <= PHASE.SUNRISE || p >= PHASE.MAGHRIB) {
            return POS.LOW_Y;
        }
        const t = invLerp(PHASE.SUNRISE, PHASE.MAGHRIB, p);
        // Parabolic arch: low at ends, high near middle (Dhuhr)
        return POS.LOW_Y - POS.SUN_PEAK_Y_DELTA * (1 - (2 * t - 1) ** 2);
    });
    const sunOpacityRaw = useTransform(scrollProgress, getSunOpacity);
    const sunColorR = useTransform(scrollProgress, (p) => getSunColorChannel(p, 'r'));
    const sunColorG = useTransform(scrollProgress, (p) => getSunColorChannel(p, 'g'));
    const sunColorB = useTransform(scrollProgress, (p) => getSunColorChannel(p, 'b'));

    // Moon motion (appears just before Maghrib, crosses night, fades into morning)
    const moonXRaw = useTransform(scrollProgress, (p) => {
        // Night path opposite the sun: west -> east across the night
        if (p <= PHASE.MAGHRIB - TRANSITIONS.MOON_PRE_MAGHRIB_APPEAR) {
            return POS.WEST_X;
        }
        if (p >= PHASE.END) {
            return POS.EAST_X;
        }
        return lerp(POS.WEST_X, POS.EAST_X, invLerp(PHASE.MAGHRIB - TRANSITIONS.MOON_PRE_MAGHRIB_APPEAR, PHASE.END, p));
    });
    const moonYRaw = useTransform(scrollProgress, (p) => {
        if (p <= PHASE.MAGHRIB - TRANSITIONS.MOON_PRE_MAGHRIB_APPEAR) {
            return POS.LOW_Y;
        }
        const t = invLerp(PHASE.MAGHRIB - TRANSITIONS.MOON_PRE_MAGHRIB_APPEAR, PHASE.END, p);
        return POS.LOW_Y - POS.MOON_PEAK_Y_DELTA * (1 - (2 * t - 1) ** 2);
    });
    const moonOpacityRaw = useTransform(scrollProgress, getMoonOpacity);

    // springs for smoothness
    const springCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const sunX = useSpring(sunXRaw, springCfg);
    const sunY = useSpring(sunYRaw, springCfg);
    const sunOpacity = useSpring(sunOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    const moonX = useSpring(moonXRaw, springCfg);
    const moonY = useSpring(moonYRaw, springCfg);
    const moonOpacity = useSpring(moonOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    // phase info text (ensures "Isha" shows)
    const [phaseInfo, setPhaseInfo] = useState<{ label: string; time: string }>({ label: '', time: '' });
    useEffect(() => {
        const unsub = scrollProgress.on('change', (p) => {
            const info = getPhaseInfo(p, days[currentDayIndex]?.timings || [], timeZone);
            setPhaseInfo((prev) => (prev.label === info.label && prev.time === info.time ? prev : info));
        });
        return () => unsub();
    }, [scrollProgress, currentDayIndex, days, timeZone]);

    // scrolling helpers (single listener)
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

    // load day handlers
    const handleLoadPrev = useCallback(() => {
        setDays((prev) => {
            const firstDate = prev[0].date;
            const newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() - 1);
            const newDay = ((): DayData => loadDay(newDate))();
            const next = [newDay, ...prev].slice(0, MAX_BUFFERED_DAYS);
            return next;
        });
        requestAnimationFrame(() => {
            window.scrollTo({ behavior: 'auto', left: 0, top: lastScrollY.current + DAY_HEIGHT_PX });
        });
    }, [loadDay, setDays]);

    const handleLoadNext = useCallback(() => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1].date;
            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + 1);
            const newDay = ((): DayData => loadDay(newDate))();
            const next = [...prev, newDay];
            return next.length > MAX_BUFFERED_DAYS ? next.slice(next.length - MAX_BUFFERED_DAYS) : next;
        });
    }, [loadDay, setDays]);

    // mobile/reduced-motion tuning
    const STAR_DENSITY = isMobile ? 0.00005 : 0.0002;
    const SHOOT_MIN_DELAY = isMobile ? 2000 : 1200;
    const SHOOT_MAX_DELAY = isMobile ? 6000 : 4200;

    const totalHeightStyle = useMemo(() => ({ height: totalHeight }), [totalHeight]);

    return (
        <>
            <div ref={containerRef} style={totalHeightStyle} />

            <div className="fixed inset-0">
                {/* Backgrounds */}
                <SkyBackground skyColor={skyColor} />
                {/* Fajr dawn starts at FAJR */}
                <FajrGradient opacity={fajrGradientOpacity} />
                {/* Sunset from Maghrib -> Isha */}
                <SunsetGradient opacity={sunsetGradientOpacity} />
                {/* Stars/comets ONLY after Isha */}
                {mounted && (
                    <StarsLayer
                        opacity={starsOpacity}
                        density={STAR_DENSITY}
                        minDelay={SHOOT_MIN_DELAY}
                        maxDelay={SHOOT_MAX_DELAY}
                        disabled={reducedMotion}
                    />
                )}
                {/* Soft light bloom near sunrise only */}
                <LightRays opacity={lightRaysOpacity} />
                <RadialGradientOverlay />

                {/* Sun / Moon */}
                <SunNode x={sunX} y={sunY} opacity={sunOpacity} color={{ b: sunColorB, g: sunColorG, r: sunColorR }} />
                <MoonNode x={moonX} y={moonY} opacity={moonOpacity} />

                {/* Center label */}
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

                {/* Prev/Next loaders */}
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

                {/* Top-right controls */}
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
