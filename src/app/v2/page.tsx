'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Settings2Icon } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FajrGradient } from '@/components/fajr-sky';
import { LightRays } from '@/components/light-rays';
import { ShinyText } from '@/components/magicui/shiny-text';
import { Moon } from '@/components/moon';
import { RadialGradientOverlay } from '@/components/radial-gradient';
import { SkyBackground } from '@/components/sky';
import { StarsLayer } from '@/components/stars';
import { Sun } from '@/components/sun';
import { SunsetGradient } from '@/components/sunset-sky';
import { Button } from '@/components/ui/button';
import { useDaysData } from '@/hooks/use-days-data';
import { useDevicePrefs } from '@/hooks/use-device';
import { useSettings } from '@/hooks/use-settings';
import { useTimeline } from '@/hooks/use-timeline';
import {
    fajrGradientOpacityAt,
    lightRaysOpacityAt,
    moonOpacityAt,
    skyColorAt,
    starsOpacityAt,
    sunColorChannelAt,
    sunOpacityAt,
    sunsetGradientOpacityAt,
} from '@/lib/colors';
import { DAY_HEIGHT_PX, FRAC, MAX_BUFFERED_DAYS, POS, SEAM_FRAC } from '@/lib/constants';
import { phaseLabelAndTime } from '@/lib/formatting';
import { buildTimeline, timeToScroll } from '@/lib/timeline';
import { invLerp, lerp } from '@/lib/utils';

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

    const { mounted, isMobile } = useDevicePrefs();
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
    const moonOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? moonOpacityAt(p, timeline) : 0));

    const springCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const sunX = useSpring(sunXRaw, springCfg);
    const sunY = useSpring(sunYRaw, springCfg);
    const sunOpacity = useSpring(sunOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    const moonX = useSpring(moonXRaw, springCfg);
    const moonY = useSpring(POS.MOON_Y, springCfg);
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

    useTimeline(scrollY, {
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
            const firstDate = prev[0]!.date;
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
            const lastDate = prev[prev.length - 1]!.date;
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
