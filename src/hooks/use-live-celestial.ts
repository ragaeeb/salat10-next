import { type MotionValue, useMotionValue } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { type CalculationConfig, daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/constants';
import { useCalculationConfig } from '@/lib/prayer-utils';
import { buildTimeline, timeToScroll } from '@/lib/timeline';
import type { DayData, Timeline, Timing } from '@/types/timeline';

/**
 * Builds DayData for a given date and calculation config.
 *
 * @param date - Date to calculate prayer times for
 * @param config - Calculation configuration
 * @returns Day data with timings and next Fajr
 */
export function buildLiveDayData(date: Date, config: CalculationConfig): DayData {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const safeDate = new Date(year, month, day, 12, 0, 0, 0);

    const nextDate = new Date(year, month, day + 1, 12, 0, 0, 0);
    const nextRes = daily(salatLabels, config, nextDate);
    const nextFajr = nextRes.timings.find((t: Timing) => t.event === 'fajr')?.value ?? null;
    const todayRes = daily(salatLabels, config, safeDate);

    return { date: safeDate, dayIndex: 0, nextFajr, timings: todayRes.timings };
}

/**
 * Determines the active prayer cycle date given current time.
 * Handles the pre-Fajr overnight boundary where the active Islamic day cycle
 * began at yesterday's Fajr and ends at today's Fajr.
 *
 * @param now - Current timestamp / date
 * @param config - Calculation configuration
 * @returns Active day data and whether it corresponds to yesterday's cycle start
 */
export function getActivePrayerDate(now: Date, config: CalculationConfig): { dayData: DayData; isYesterday: boolean } {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayData = buildLiveDayData(today, config);
    const todayFajr = todayData.timings.find((t) => t.event === 'fajr')?.value;

    if (todayFajr && now.getTime() < todayFajr.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { dayData: buildLiveDayData(yesterday, config), isYesterday: true };
    }

    return { dayData: todayData, isYesterday: false };
}

/**
 * Hook to compute real-time celestial trajectory progress and timeline.
 *
 * Coordinates live astronomical position calculation:
 * - Accurately maps current time to normalized progress (0.0 to 1.0)
 * - Automatically accounts for day boundaries (pre-Fajr early morning)
 * - Updates periodically (every 15 seconds) so the celestial sky continuously animates
 * - Provides a MotionValue for smooth framer-motion/motion/react interpolation
 *
 * @param customConfig - Optional prayer calculation config override
 * @returns Live celestial state with MotionValue, plain number progress, dayData, and timeline
 */
export function useLiveCelestial(customConfig?: CalculationConfig): {
    dayData: DayData | null;
    pNow: number;
    progressMv: MotionValue<number>;
    timeline: Timeline | null;
} {
    const defaultConfig = useCalculationConfig();
    const config = customConfig ?? defaultConfig;

    const lat = Number.parseFloat(config.latitude);
    const lon = Number.parseFloat(config.longitude);
    const isValid = Number.isFinite(lat) && Number.isFinite(lon);

    const [tick, setTick] = useState(0);

    const currentCelestial = useMemo(() => {
        if (!isValid) {
            return { dayData: null, pNow: 0, timeline: null };
        }
        // Incorporate tick to force periodic recalculation as time advances
        const _ = tick;
        const now = new Date();
        const { dayData } = getActivePrayerDate(now, config);
        const timeline = buildTimeline(dayData);
        const p = timeToScroll(now.getTime(), dayData);
        return { dayData, pNow: p, timeline };
    }, [config, isValid, tick]);

    const progressMv = useMotionValue(currentCelestial.pNow);

    useEffect(() => {
        progressMv.set(currentCelestial.pNow);
    }, [currentCelestial.pNow, progressMv]);

    useEffect(() => {
        if (!isValid) {
            return;
        }

        const intervalId = setInterval(() => {
            setTick((t) => t + 1);
        }, 15_000);
        return () => clearInterval(intervalId);
    }, [isValid]);

    return {
        dayData: currentCelestial.dayData,
        pNow: currentCelestial.pNow,
        progressMv,
        timeline: currentCelestial.timeline,
    };
}
