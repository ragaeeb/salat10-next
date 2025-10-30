'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Settings2Icon } from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
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
import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { useCrossFade } from '@/hooks/use-crossfade';
import { useDayLoading } from '@/hooks/use-day-loading';
import { useDaysData } from '@/hooks/use-days-data';
import { useDevicePrefs } from '@/hooks/use-device';
import { useInitialScroll } from '@/hooks/use-initial-scroll';
import { useMoon } from '@/hooks/use-moon';
import { usePhaseInfo } from '@/hooks/use-phase-info';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { useSettings } from '@/hooks/use-settings';
import { useSky } from '@/hooks/use-sky';
import { useSun } from '@/hooks/use-sun';
import { useTimeline } from '@/hooks/use-timeline';
import { DAY_HEIGHT_PX } from '@/lib/constants';
import { buildTimeline } from '@/lib/timeline';

export default function ParallaxPage() {
    const { hydrated } = useSettings();
    if (!hydrated) {
        return null;
    }
    return <ParallaxInner />;
}

function ParallaxInner() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const calculationConfig = useCalculationConfig();

    const { mounted, isMobile } = useDevicePrefs();
    const { days, setDays, hasInitialized, setHasInitialized, lastScrollY, loadDay } = useDaysData(
        calculationConfig.config,
    );

    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    const totalHeight = days.length * DAY_HEIGHT_PX;
    const totalHeightStyle = useMemo(() => ({ height: totalHeight }), [totalHeight]);

    const currentDay = days[currentDayIndex];
    const timeline = useMemo(() => (currentDay ? buildTimeline(currentDay) : null), [currentDay]);

    // Custom hooks for cleaner component logic
    useInitialScroll(hasInitialized, days, lastScrollY, setHasInitialized);

    const { scrollProgress, pNow } = useScrollProgress(scrollY);

    const { skyColor, starsOpacity, fajrGradientOpacity, sunsetGradientOpacity, lightRaysOpacity } = useSky(
        scrollProgress,
        timeline,
    );

    const { sunX, sunY, sunOpacity, sunColorR, sunColorG, sunColorB } = useSun(scrollProgress, timeline);

    const { moonX, moonY, moonOpacity } = useMoon(scrollProgress, timeline);

    const phaseInfo = usePhaseInfo(scrollProgress, timeline, currentDay, calculationConfig.settings.timeZone);

    const { handleLoadPrev, handleLoadNext } = useDayLoading(loadDay, setDays, lastScrollY);

    const { hasPrev, hasNext, topSeamStarsOpacity, bottomSeamFajrOpacity } = useCrossFade(
        pNow,
        currentDayIndex,
        days.length,
    );

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

    // Stars/comets controls:
    // - Stars fade in from Isha to Midnight, fully on after (checklist #8, #9, #10)
    // - Comets only during Last 1/3 (checklist #11)
    const cometsEnabled = !!timeline && pNow >= timeline.lastThird;

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
