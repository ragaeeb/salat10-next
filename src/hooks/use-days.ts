import { useEffect, useRef, useState } from 'react';
import { type CalculationConfig, daily } from '@/lib/calculator';
import { MAX_BUFFERED_DAYS, salatLabels } from '@/lib/constants';
import type { DayData, Timing } from '@/types/timeline';

const buildDayData = (date: Date, config: CalculationConfig, dayIndex: number): DayData => {
    // Ensure we're working with a clean date at noon to avoid DST/timezone issues
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const safeDate = new Date(year, month, day, 12, 0, 0, 0);

    // Calculate next day's date
    const nextDate = new Date(year, month, day + 1, 12, 0, 0, 0);
    const nextRes = daily(salatLabels, config, nextDate);
    const nextFajr = nextRes.timings.find((t: Timing) => t.event === 'fajr')?.value ?? null;
    const todayRes = daily(salatLabels, config, safeDate);

    return { date: safeDate, dayIndex, nextFajr, timings: todayRes.timings };
};

/**
 * Hook to manage a sliding window buffer of prayer time days
 *
 * Maintains a buffer of calculated prayer times for multiple days to enable
 * efficient scrolling through the timeline. Automatically initializes with
 * the correct Islamic day based on Fajr time and provides functions to
 * load adjacent days on demand.
 *
 * Islamic day boundaries are determined by Fajr - if current time is before
 * today's Fajr, we're still in yesterday's Islamic day.
 *
 * @param {CalculationConfig} config - Prayer calculation configuration (lat, lon, method, etc.)
 * @returns Day buffer state and control functions
 * @property {DayData[]} days - Array of loaded days with prayer timings
 * @property {() => void} addPreviousDay - Load one day before the current buffer start
 * @property {() => void} addNextDay - Load one day after the current buffer end
 *
 * @example
 * ```tsx
 * const config = { latitude: '40.7128', longitude: '-74.0060', method: 'isna' };
 * const { days, addPreviousDay, addNextDay } = useDayBuffer(config);
 *
 * // days[0] contains today's Islamic day prayer times
 * // Call addNextDay when user scrolls near bottom
 * // Call addPreviousDay when user scrolls near top
 * ```
 */
export const useDayBuffer = (config: CalculationConfig) => {
    const [days, setDays] = useState<DayData[]>([]);
    const dayIndexCounter = useRef(0);
    const { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone } = config;

    /**
     * Load prayer times for a specific date
     *
     * @param {Date} date - Date to calculate prayer times for
     * @returns {DayData} Day data including timings and next Fajr
     */
    const loadDay = (date: Date): DayData => {
        const dayData = buildDayData(
            date,
            { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone },
            dayIndexCounter.current,
        );
        dayIndexCounter.current += 1;
        return dayData;
    };

    // Initialize with the correct day for current prayer time
    useEffect(() => {
        // Don't initialize if coordinates are invalid
        const lat = Number.parseFloat(latitude);
        const lon = Number.parseFloat(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setDays([]);
            return;
        }

        const now = new Date();
        // Create today's date at midnight in local time
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check today's Fajr time
        const todayData = buildDayData(
            today,
            { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone },
            dayIndexCounter.current,
        );
        const todayFajr = todayData.timings.find((t) => t.event === 'fajr')?.value;

        let initialDay = today;

        // If current time is before today's Fajr, we're still in yesterday's Islamic day
        if (todayFajr && now < todayFajr) {
            initialDay = new Date(today);
            initialDay.setDate(initialDay.getDate() - 1);
        }

        dayIndexCounter.current = 0;
        const initialDayData = buildDayData(
            initialDay,
            { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone },
            dayIndexCounter.current,
        );
        dayIndexCounter.current += 1;
        setDays([initialDayData]);
    }, [fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone]);

    /**
     * Add one day before the current buffer (user scrolling backward in time)
     * Maintains maximum buffer size by trimming from the end
     */
    const addPreviousDay = () => {
        setDays((prev) => {
            const firstDate = prev[0]?.date;
            if (!firstDate) {
                return prev;
            }

            const newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() - 1);
            const newDay = loadDay(newDate);
            return [newDay, ...prev].slice(0, MAX_BUFFERED_DAYS);
        });
    };

    /**
     * Add one day after the current buffer (user scrolling forward in time)
     * Maintains maximum buffer size by trimming from the start
     */
    const addNextDay = () => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1]?.date;
            if (!lastDate) {
                return prev;
            }

            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + 1);
            const newDay = loadDay(newDate);
            const next = [...prev, newDay];
            return next.length > MAX_BUFFERED_DAYS ? next.slice(next.length - MAX_BUFFERED_DAYS) : next;
        });
    };

    return { addNextDay, addPreviousDay, days };
};
