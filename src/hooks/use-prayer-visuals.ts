import { type MotionValue, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PrayerTiming } from '@/components/prayer/prayer-times-card';
import {
    calculateRealTimeVisuals,
    calculateScrollBasedVisuals,
    getPrayerInfoFromScroll,
    type PrayerInfo,
    type PrayerTimings,
} from '@/lib/prayer-visuals';

export type UsePrayerVisualsParams = {
    currentDate: Date;
    shouldUseScrollMode: boolean;
    scrollYProgress: MotionValue<number>;
    timings: PrayerTiming[];
};

export function usePrayerVisuals({
    currentDate,
    scrollYProgress,
    shouldUseScrollMode,
    timings,
}: UsePrayerVisualsParams) {
    const [useRealTime, setUseRealTime] = useState(true);
    const [currentPrayerInfo, setCurrentPrayerInfo] = useState<PrayerInfo>(() =>
        getPrayerInfoFromScroll(scrollYProgress.get()),
    );
    const hasScrolledRef = useRef(false);
    const useRealTimeRef = useRef(true);
    const shouldUseScrollModeRef = useRef(shouldUseScrollMode);

    useEffect(() => {
        shouldUseScrollModeRef.current = shouldUseScrollMode;
    }, [shouldUseScrollMode]);

    useEffect(() => {
        useRealTimeRef.current = useRealTime;
    }, [useRealTime]);

    // Log useRealTime state changes
    useEffect(() => {
        console.log('[Prayer Visuals] useRealTime state changed to:', useRealTime);
    }, [useRealTime]);

    const sunXTarget = useMotionValue(50);
    const sunYTarget = useMotionValue(80);
    const sunOpacityTarget = useMotionValue(1);
    const moonXTarget = useMotionValue(20);
    const moonYTarget = useMotionValue(25);
    const moonOpacityTarget = useMotionValue(0);

    const springConfig = useMemo(() => ({ damping: 26, mass: 0.8, stiffness: 150 }), []);

    const sunX = useSpring(sunXTarget, springConfig);
    const sunY = useSpring(sunYTarget, springConfig);
    const sunOpacity = useSpring(sunOpacityTarget, { damping: 24, mass: 0.7, stiffness: 160 });
    const moonX = useSpring(moonXTarget, springConfig);
    const moonY = useSpring(moonYTarget, springConfig);
    const moonOpacity = useSpring(moonOpacityTarget, { damping: 24, mass: 0.7, stiffness: 160 });

    // Motion values for sun color
    const sunColorR = useMotionValue(255);
    const sunColorG = useMotionValue(215);
    const sunColorB = useMotionValue(0);

    const lastScrollProgressRef = useRef(0);

    // Handle scroll-based updates
    const progressSpring = useSpring(scrollYProgress, { damping: 24, mass: 0.9, stiffness: 140 });

    useEffect(() => {
        const initialProgress = scrollYProgress.get();
        lastScrollProgressRef.current = initialProgress;
        setCurrentPrayerInfo(getPrayerInfoFromScroll(initialProgress));
        console.log('[Prayer Visuals] Initial scroll progress:', initialProgress);

        const unsubscribe = progressSpring.on('change', (rawLatest) => {
            const latest = Math.min(1, Math.max(0, rawLatest));
            lastScrollProgressRef.current = latest;

            const nextInfo = getPrayerInfoFromScroll(latest);
            setCurrentPrayerInfo(nextInfo);

            if (!shouldUseScrollModeRef.current) {
                return;
            }

            const visuals = calculateScrollBasedVisuals(latest);
            sunXTarget.set(visuals.sunX);
            sunYTarget.set(visuals.sunY);
            sunOpacityTarget.set(visuals.sunOpacity);
            moonOpacityTarget.set(visuals.moonOpacity);
            moonXTarget.set(visuals.moonX);
            moonYTarget.set(visuals.moonY);
            sunColorR.set(visuals.sunColor.r);
            sunColorG.set(visuals.sunColor.g);
            sunColorB.set(visuals.sunColor.b);
        });

        return () => unsubscribe();
    }, [
        moonOpacityTarget,
        moonXTarget,
        moonYTarget,
        progressSpring,
        scrollYProgress,
        sunColorB,
        sunColorG,
        sunColorR,
        sunOpacityTarget,
        sunXTarget,
        sunYTarget,
    ]);

    useEffect(() => {
        const latest = Math.min(1, Math.max(0, progressSpring.get()));

        if (shouldUseScrollMode && useRealTimeRef.current) {
            console.log('[Prayer Visuals] Triggering scroll mode from sentinel');
            setUseRealTime(false);
            useRealTimeRef.current = false;
            hasScrolledRef.current = true;

            const visuals = calculateScrollBasedVisuals(latest);
            sunXTarget.set(visuals.sunX);
            sunYTarget.set(visuals.sunY);
            sunOpacityTarget.set(visuals.sunOpacity);
            moonOpacityTarget.set(visuals.moonOpacity);
            moonXTarget.set(visuals.moonX);
            moonYTarget.set(visuals.moonY);
            sunColorR.set(visuals.sunColor.r);
            sunColorG.set(visuals.sunColor.g);
            sunColorB.set(visuals.sunColor.b);
            return;
        }

        if (!shouldUseScrollMode && !useRealTimeRef.current) {
            console.log('[Prayer Visuals] Returning to real-time mode from sentinel');
            setUseRealTime(true);
            useRealTimeRef.current = true;
            hasScrolledRef.current = false;
        }
    }, [
        moonOpacityTarget,
        moonXTarget,
        moonYTarget,
        progressSpring,
        shouldUseScrollMode,
        sunColorB,
        sunColorG,
        sunColorR,
        sunOpacityTarget,
        sunXTarget,
        sunYTarget,
    ]);

    // Handle real-time updates based on actual prayer times
    useEffect(() => {
        console.log('[Prayer Visuals] Real-time effect triggered:', {
            currentDate: currentDate.toISOString(),
            timingsLength: timings.length,
            useRealTime,
        });

        if (!timings.length || !useRealTime) {
            console.log('[Prayer Visuals] Skipping real-time update (no timings or not in real-time mode)');
            return;
        }

        const prayerTimings: PrayerTimings = {
            asr: timings.find((t) => t.event === 'asr')!.value.getTime(),
            dhuhr: timings.find((t) => t.event === 'dhuhr')!.value.getTime(),
            fajr: timings.find((t) => t.event === 'fajr')!.value.getTime(),
            isha: timings.find((t) => t.event === 'isha')!.value.getTime(),
            maghrib: timings.find((t) => t.event === 'maghrib')!.value.getTime(),
            sunrise: timings.find((t) => t.event === 'sunrise')!.value.getTime(),
        };

        const now = currentDate.getTime();
        const visuals = calculateRealTimeVisuals(now, prayerTimings);

        console.log('[Prayer Visuals] Setting real-time visuals:', {
            moonOpacity: visuals.moonOpacity,
            moonX: visuals.moonX,
            moonY: visuals.moonY,
            sunOpacity: visuals.sunOpacity,
            sunX: visuals.sunX,
            sunY: visuals.sunY,
        });

        sunXTarget.set(visuals.sunX);
        sunYTarget.set(visuals.sunY);
        sunOpacityTarget.set(visuals.sunOpacity);
        moonOpacityTarget.set(visuals.moonOpacity);
        moonXTarget.set(visuals.moonX);
        moonYTarget.set(visuals.moonY);
        sunColorR.set(visuals.sunColor.r);
        sunColorG.set(visuals.sunColor.g);
        sunColorB.set(visuals.sunColor.b);
    }, [
        currentDate,
        moonOpacityTarget,
        moonXTarget,
        moonYTarget,
        sunColorB,
        sunColorG,
        sunColorR,
        sunOpacityTarget,
        sunXTarget,
        sunYTarget,
        timings,
        useRealTime,
    ]);

    // Reset to real-time mode on mount/visibility change
    useEffect(() => {
        console.log('[Prayer Visuals] Mount effect - initializing');

        if (typeof window !== 'undefined') {
            const currentScrollY = window.scrollY;
            console.log('[Prayer Visuals] Current scroll position:', currentScrollY);

            window.history.scrollRestoration = 'manual';
            window.scrollTo({ behavior: 'instant', left: 0, top: 0 });
            console.log('[Prayer Visuals] Scrolled to top on mount');
        }
        setUseRealTime(true);

        const handleVisibilityChange = () => {
            console.log('[Prayer Visuals] Visibility changed:', {
                currentScrollY: window.scrollY,
                hasScrolled: hasScrolledRef.current,
                scrollYProgress: scrollYProgress.get(),
                visibilityState: document.visibilityState,
            });

            if (document.visibilityState === 'visible') {
                // Only reset to real-time mode if user hasn't scrolled
                if (!hasScrolledRef.current) {
                    console.log(
                        '[Prayer Visuals] Tab became visible - switching to real-time mode (no scroll detected)',
                    );
                    setUseRealTime(true);
                } else {
                    console.log('[Prayer Visuals] Tab became visible - staying in scroll mode (user has scrolled)');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            console.log('[Prayer Visuals] Cleanup - removing listeners');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (typeof window !== 'undefined') {
                window.history.scrollRestoration = 'auto';
            }
        };
    }, [scrollYProgress]);

    return {
        currentPrayerInfo,
        moonOpacity,
        moonX,
        moonY,
        sunColorB,
        sunColorG,
        sunColorR,
        sunOpacity,
        sunX,
        sunY,
        useRealTime,
    };
}
