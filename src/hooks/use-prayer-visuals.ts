import { useMotionValue } from 'motion/react';
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
    scrollYProgress: { get: () => number; on: (event: string, callback: (v: number) => void) => () => void };
    timings: PrayerTiming[];
};

export function usePrayerVisuals({ currentDate, scrollYProgress, timings }: UsePrayerVisualsParams) {
    const [useRealTime, setUseRealTime] = useState(true);
    const [currentPrayerInfo, setCurrentPrayerInfo] = useState<PrayerInfo>(() =>
        getPrayerInfoFromScroll(scrollYProgress.get()),
    );

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
    useEffect(() => {
        const initialInfo = getPrayerInfoFromScroll(scrollYProgress.get());
        setCurrentPrayerInfo(initialInfo);
        lastScrollProgressRef.current = scrollYProgress.get();

        const unsubscribe = scrollYProgress.on('change', (latest) => {
            const previous = lastScrollProgressRef.current;
            lastScrollProgressRef.current = latest;

            const nextInfo = getPrayerInfoFromScroll(latest);
            setCurrentPrayerInfo(nextInfo);

            // Only switch to scroll mode if user is deliberately scrolling
            const isDeliberateScroll = previous < 0.1 && latest > 0.05 && latest < 0.5;
            const isContinuedScroll = previous > 0.05 && latest > 0.05;

            if (isDeliberateScroll || isContinuedScroll) {
                setUseRealTime(false);

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
    }, [scrollYProgress, sunColorR, sunColorG, sunColorB]);

    // Handle real-time updates based on actual prayer times
    useEffect(() => {
        if (!timings.length || !useRealTime) {
            return;
        }

        const prayerTimings: PrayerTimings = {
            asr: timings.find((t) => t.event === 'asr')?.value.getTime(),
            dhuhr: timings.find((t) => t.event === 'dhuhr')?.value.getTime(),
            fajr: timings.find((t) => t.event === 'fajr')?.value.getTime(),
            isha: timings.find((t) => t.event === 'isha')?.value.getTime(),
            maghrib: timings.find((t) => t.event === 'maghrib')?.value.getTime(),
            sunrise: timings.find((t) => t.event === 'sunrise')?.value.getTime(),
        };

        const now = currentDate.getTime();
        const visuals = calculateRealTimeVisuals(now, prayerTimings);

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
        if (typeof window !== 'undefined') {
            window.history.scrollRestoration = 'manual';
            window.scrollTo({ behavior: 'instant', left: 0, top: 0 });
        }
        setUseRealTime(true);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setUseRealTime(true);
                window.scrollTo({ behavior: 'instant', left: 0, top: 0 });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (typeof window !== 'undefined') {
                window.history.scrollRestoration = 'auto';
            }
        };
    }, []);

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
