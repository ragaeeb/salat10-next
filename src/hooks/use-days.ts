import { useCallback, useEffect, useRef, useState } from 'react';
import { type CalculationConfig, daily } from '@/lib/calculator';
import { MAX_BUFFERED_DAYS } from '@/lib/constants';
import { salatLabels } from '@/lib/salat-labels';
import type { DayData, Timing } from '@/types/timeline';

export function useDayBuffer(config: CalculationConfig) {
    const [days, setDays] = useState<DayData[]>([]);
    const dayIndexCounter = useRef(0);

    const loadDay = useCallback(
        (date: Date): DayData => {
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

            return { date: safeDate, dayIndex: dayIndexCounter.current++, nextFajr, timings: todayRes.timings };
        },
        [config],
    );

    // Initialize with the correct day for current prayer time
    useEffect(() => {
        // Don't initialize if coordinates are invalid
        const lat = Number.parseFloat(config.latitude);
        const lon = Number.parseFloat(config.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setDays([]);
            return;
        }

        const now = new Date();
        // Create today's date at midnight in local time
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Check today's Fajr time
        const todayData = loadDay(today);
        const todayFajr = todayData.timings.find((t) => t.event === 'fajr')?.value;

        let initialDay = today;

        // If current time is before today's Fajr, we're still in yesterday's Islamic day
        if (todayFajr && now < todayFajr) {
            initialDay = new Date(today);
            initialDay.setDate(initialDay.getDate() - 1);
        }

        dayIndexCounter.current = 0;
        const initialDayData = loadDay(initialDay);
        setDays([initialDayData]);
    }, [loadDay, config.latitude, config.longitude]);

    const addPreviousDay = useCallback(() => {
        setDays((prev) => {
            const firstDate = prev[0]!.date;
            const newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() - 1);
            const newDay = loadDay(newDate);
            return [newDay, ...prev].slice(0, MAX_BUFFERED_DAYS);
        });
    }, [loadDay]);

    const addNextDay = useCallback(() => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1]!.date;
            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + 1);
            const newDay = loadDay(newDate);
            const next = [...prev, newDay];
            return next.length > MAX_BUFFERED_DAYS ? next.slice(next.length - MAX_BUFFERED_DAYS) : next;
        });
    }, [loadDay]);

    return { addNextDay, addPreviousDay, days };
}
