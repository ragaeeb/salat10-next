import { type MotionValue, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
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
    scrollYProgress: MotionValue<number>;
    timings: PrayerTiming[];
};

export function usePrayerVisuals({ currentDate, scrollYProgress, timings }: UsePrayerVisualsParams) {
    const [useRealTime, setUseRealTime] = useState(true);
    const [currentPrayerInfo, setCurrentPrayerInfo] = useState<PrayerInfo>(() =>
        getPrayerInfoFromScroll(scrollYProgress.get()),
    );
    const hasScrolledRef = useRef(false);
    const useRealTimeRef = useRef(true);

    useEffect(() => {
        useRealTimeRef.current = useRealTime;
    }, [useRealTime]);

    // Log useRealTime state changes
    useEffect(() => {
        console.log('[Prayer Visuals] useRealTime state changed to:', useRealTime);
    }, [useRealTime]);

    // Visual state
    const [sunX, setSunX] = useState(50);
    const [sunY, setSunY] = useState(80);
    const [sunOpacity, setSunOpacity] = useState(1);
    const [moonOpacity, setMoonOpacity] = useState(0);
    const [moonX, setMoonX] = useState(20);
    const [moonY, setMoonY] = useState(25);

    // Motion values for sun color
    const sunColorR = useMotionValue(255);
    const sunColorG = useMotionValue(215);
    const sunColorB = useMotionValue(0);

    const lastScrollProgressRef = useRef(0);

    // Handle scroll-based updates
    const progressSpring = useSpring(scrollYProgress, { damping: 24, mass: 0.9, stiffness: 140 });

    useEffect(() => {
        const initialInfo = getPrayerInfoFromScroll(scrollYProgress.get());
        setCurrentPrayerInfo(initialInfo);
        lastScrollProgressRef.current = scrollYProgress.get();
        console.log('[Prayer Visuals] Initial scroll progress:', scrollYProgress.get());

        const unsubscribe = progressSpring.on('change', (rawLatest) => {
            const latest = Math.min(1, Math.max(0, rawLatest));
            const previous = lastScrollProgressRef.current;
            lastScrollProgressRef.current = latest;
            const delta = Math.abs(latest - previous);

            const nextInfo = getPrayerInfoFromScroll(latest);
            setCurrentPrayerInfo(nextInfo);

            // Only switch to scroll mode if user is deliberately scrolling
            const SCROLL_ACTIVATION_THRESHOLD = 0.32;
            const SCROLL_RETURN_THRESHOLD = 0.18;
            const MIN_SCROLL_DELTA = 0.006;

            const passesActivation = latest >= SCROLL_ACTIVATION_THRESHOLD;
            const shouldReturnToRealTime = latest <= SCROLL_RETURN_THRESHOLD;
            const deltaIsMeaningful = delta > MIN_SCROLL_DELTA;

            const isDeliberateScroll = previous < SCROLL_ACTIVATION_THRESHOLD && passesActivation && deltaIsMeaningful;
            const isContinuedScroll = hasScrolledRef.current && passesActivation && deltaIsMeaningful;

            console.log('[Prayer Visuals] Scroll change:', {
                isContinuedScroll,
                isDeliberateScroll,
                latest,
                previous,
                willSwitchToScrollMode: isDeliberateScroll || isContinuedScroll,
            });

            if (!useRealTimeRef.current && shouldReturnToRealTime && deltaIsMeaningful) {
                console.log('[Prayer Visuals] Returning to real-time mode');
                setUseRealTime(true);
                useRealTimeRef.current = true;
                hasScrolledRef.current = false;
                return;
            }

            if ((isDeliberateScroll || isContinuedScroll) && useRealTimeRef.current) {
                console.log('[Prayer Visuals] Switching to scroll mode');
                setUseRealTime(false);
                useRealTimeRef.current = false;
                hasScrolledRef.current = true;

                const visuals = calculateScrollBasedVisuals(latest);
                setSunX(visuals.sunX);
                setSunY(visuals.sunY);
                setSunOpacity(visuals.sunOpacity);
                setMoonOpacity(visuals.moonOpacity);
                setMoonX(visuals.moonX);
                setMoonY(visuals.moonY);
                sunColorR.set(visuals.sunColor.r);
                sunColorG.set(visuals.sunColor.g);
                sunColorB.set(visuals.sunColor.b);
                return;
            }

            if (!useRealTimeRef.current && deltaIsMeaningful) {
                const visuals = calculateScrollBasedVisuals(latest);
                setSunX(visuals.sunX);
                setSunY(visuals.sunY);
                setSunOpacity(visuals.sunOpacity);
                setMoonOpacity(visuals.moonOpacity);
                setMoonX(visuals.moonX);
                setMoonY(visuals.moonY);
                sunColorR.set(visuals.sunColor.r);
                sunColorG.set(visuals.sunColor.g);
                sunColorB.set(visuals.sunColor.b);
            }
        });

        return () => unsubscribe();
    }, [progressSpring, scrollYProgress, sunColorR, sunColorG, sunColorB]);

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

        setSunX(visuals.sunX);
        setSunY(visuals.sunY);
        setSunOpacity(visuals.sunOpacity);
        setMoonOpacity(visuals.moonOpacity);
        setMoonX(visuals.moonX);
        setMoonY(visuals.moonY);
        sunColorR.set(visuals.sunColor.r);
        sunColorG.set(visuals.sunColor.g);
        sunColorB.set(visuals.sunColor.b);
    }, [currentDate, timings, useRealTime, sunColorR, sunColorG, sunColorB]);

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
