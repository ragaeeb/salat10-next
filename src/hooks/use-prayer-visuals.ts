import { type MotionValue, useMotionValue } from 'motion/react';
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
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const sunColorG = useMotionValue(255);
    const sunColorB = useMotionValue(0);

    const lastScrollProgressRef = useRef(0);
    const scrollVelocityRef = useRef(0);

    // Handle scroll-based updates
    useEffect(() => {
        const initialInfo = getPrayerInfoFromScroll(Math.max(0, scrollYProgress.get()));
        setCurrentPrayerInfo(initialInfo);
        lastScrollProgressRef.current = Math.max(0, scrollYProgress.get());
        console.log('[Prayer Visuals] Initial scroll progress:', scrollYProgress.get());

        const unsubscribe = scrollYProgress.on('change', (latest) => {
            // Clamp to valid range and ignore negative values (iOS Safari quirk)
            const clampedLatest = Math.max(0, Math.min(1, latest));
            const previous = lastScrollProgressRef.current;

            // Calculate velocity
            const velocity = Math.abs(clampedLatest - previous);
            scrollVelocityRef.current = velocity;

            lastScrollProgressRef.current = clampedLatest;

            const nextInfo = getPrayerInfoFromScroll(clampedLatest);
            setCurrentPrayerInfo(nextInfo);

            // Clear any existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // More robust scroll detection:
            // 1. Must have meaningful progress (> 0.15 to account for Safari UI changes)
            // 2. Must have meaningful velocity (> 0.02 to filter out UI adjustments)
            // 3. Must not be at the very end (< 0.98 to allow reaching bottom)
            const isDeliberateScroll = clampedLatest > 0.15 && velocity > 0.02 && clampedLatest < 0.98;

            console.log('[Prayer Visuals] Scroll change:', {
                clampedLatest,
                isDeliberateScroll,
                latest,
                previous,
                velocity,
            });

            if (isDeliberateScroll) {
                console.log('[Prayer Visuals] Switching to scroll mode');
                setUseRealTime(false);
                hasScrolledRef.current = true;

                const visuals = calculateScrollBasedVisuals(clampedLatest);
                setSunX(visuals.sunX);
                setSunY(visuals.sunY);
                setSunOpacity(visuals.sunOpacity);
                setMoonOpacity(visuals.moonOpacity);
                setMoonX(visuals.moonX);
                setMoonY(visuals.moonY);
                sunColorR.set(visuals.sunColor.r);
                sunColorG.set(visuals.sunColor.g);
                sunColorB.set(visuals.sunColor.b);
            } else if (clampedLatest <= 0.05) {
                // User scrolled back to top - switch back to real-time
                scrollTimeoutRef.current = setTimeout(() => {
                    console.log('[Prayer Visuals] Scrolled to top - switching back to real-time mode');
                    setUseRealTime(true);
                    hasScrolledRef.current = false;
                }, 300); // Small delay to avoid flickering
            }
        });

        return () => {
            unsubscribe();
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [scrollYProgress, sunColorR, sunColorG, sunColorB]);

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

            // Use a small delay to ensure DOM is ready (especially on iOS)
            setTimeout(() => {
                window.scrollTo({ behavior: 'instant', left: 0, top: 0 });
                console.log('[Prayer Visuals] Scrolled to top on mount');
            }, 0);
        }
        setUseRealTime(true);
        hasScrolledRef.current = false;

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
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
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
