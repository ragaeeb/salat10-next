import { useCallback, useEffect, useMemo, useState } from 'react';
import { type CalculationConfig, daily, formatTimeRemaining, getActiveEvent, getTimeUntilNext } from '@/lib/calculator';
import { useCurrentData, useSettings } from '@/store/usePrayerStore';
import { type SalatEvent, salatLabels } from './constants';
import { formatDate } from './formatting';

/**
 * Hook to get formatted timings for the current date from the store
 * Recalculates when store data or settings change
 *
 * @returns Array of formatted timing entries
 */
const useCurrentTimings = () => {
    const currentData = useCurrentData();
    const settings = useSettings();

    return useMemo(() => {
        if (!currentData) {
            return [];
        }

        const config: CalculationConfig = {
            fajrAngle: Number.parseFloat(settings.fajrAngle),
            ishaAngle: Number.parseFloat(settings.ishaAngle),
            ishaInterval: Number.parseFloat(settings.ishaInterval),
            latitude: settings.latitude,
            longitude: settings.longitude,
            method: settings.method,
            timeZone: settings.timeZone,
        };

        const result = daily(salatLabels, config, currentData.date);
        return result.timings;
    }, [currentData, settings]);
};

/**
 * Hook to get formatted timings for a specific date (for preview/navigation)
 * Useful when viewing non-current dates in card view navigation
 *
 * @param date - Target date for calculation
 * @returns Daily result with timings and metadata
 */
export const useTimingsForDate = (date: Date) => {
    const settings = useSettings();

    return useMemo(() => {
        const config: CalculationConfig = {
            fajrAngle: Number.parseFloat(settings.fajrAngle),
            ishaAngle: Number.parseFloat(settings.ishaAngle),
            ishaInterval: Number.parseFloat(settings.ishaInterval),
            latitude: settings.latitude,
            longitude: settings.longitude,
            method: settings.method,
            timeZone: settings.timeZone,
        };

        return daily(salatLabels, config, date);
    }, [date, settings]);
};

/**
 * Hook to get the currently active prayer event
 * Uses efficient timeout-based updates - only recalculates when crossing event boundaries
 * Avoids constant polling by scheduling updates at exact event times
 *
 * @returns Current active event name, or null if none
 */
export const useActiveEvent = () => {
    const timings = useCurrentTimings();
    const [activeEvent, setActiveEvent] = useState<SalatEvent | null>(null);

    useEffect(() => {
        if (timings.length === 0) {
            setActiveEvent(null);
            return;
        }

        const updateActiveEvent = () => {
            const now = Date.now();
            const event = getActiveEvent(timings, now);
            setActiveEvent(event);
            return now;
        };

        const currentTime = updateActiveEvent();
        const nextTiming = timings.find((t) => t.value.getTime() > currentTime);

        if (!nextTiming) {
            return;
        }

        const msUntilNext = nextTiming.value.getTime() - currentTime;
        const timeoutId = setTimeout(() => {
            updateActiveEvent();
        }, msUntilNext);

        return () => clearTimeout(timeoutId);
    }, [timings]);

    return activeEvent;
};

/**
 * Hook to get countdown to next prayer with efficient updates
 * Updates every second only while there's an active countdown
 * Uses metadata from daily calculation to minimize computation
 *
 * @returns Formatted countdown string like "2h 15m 30s until Dhuhr", or empty if none
 */
export const useCountdownToNext = () => {
    const timings = useCurrentTimings();
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        if (timings.length === 0) {
            setCountdown('');
            return;
        }

        const updateCountdown = () => {
            const now = Date.now();
            const timeUntil = getTimeUntilNext(timings, now);

            if (!timeUntil || timeUntil <= 0) {
                setCountdown('');
                return null;
            }

            const nextTiming = timings.find((t) => t.value.getTime() > now);
            if (!nextTiming) {
                setCountdown('');
                return null;
            }

            const formatted = formatTimeRemaining(timeUntil);
            setCountdown(`${formatted} until ${nextTiming.label}`);

            return { nextTiming, timeUntil };
        };

        const result = updateCountdown();

        if (!result) {
            return;
        }

        const intervalId = setInterval(() => {
            const result = updateCountdown();
            if (!result) {
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timings]);

    return countdown;
};

/**
 * Helper to check if two dates are the same calendar day
 * Ignores time component
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same year, month, and day
 */
const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

/**
 * Hook for day navigation (prev/next/today)
 * Optimized to use precomputed store data for current day
 * Only calculates on-demand for prev/next days
 *
 * Features:
 * - Uses store's precomputed data when viewing today
 * - Calculates fresh data only when viewing other days
 * - Provides navigation handlers for prev/next/today
 *
 * @returns Object with timings, date label, handlers, and current view date
 */
export const useDayNavigation = () => {
    const currentData = useCurrentData();
    const currentTimings = useCurrentTimings();

    const [viewDate, setViewDate] = useState<Date | null>(null);

    const previewResult = useTimingsForDate(viewDate ?? new Date());

    const isViewingToday = useMemo(() => {
        if (!currentData || viewDate === null) {
            return true;
        }
        return isSameDay(viewDate, currentData.date);
    }, [viewDate, currentData]);

    const timings = isViewingToday ? currentTimings : previewResult.timings;
    const dateLabel = isViewingToday && currentData ? formatDate(currentData.date) : previewResult.date;
    const effectiveDate = viewDate ?? (currentData?.date || new Date());

    const handlePrevDay = useCallback(() => {
        setViewDate((prev) => {
            const base = prev ?? new Date();
            const next = new Date(base);
            next.setDate(base.getDate() - 1);
            return next;
        });
    }, []);

    const handleNextDay = useCallback(() => {
        setViewDate((prev) => {
            const base = prev ?? new Date();
            const next = new Date(base);
            next.setDate(base.getDate() + 1);
            return next;
        });
    }, []);

    const handleToday = useCallback(() => {
        setViewDate(null);
    }, []);

    return { dateLabel, handleNextDay, handlePrevDay, handleToday, timings, viewDate: effectiveDate };
};

/**
 * Hook to build calculation config from store settings
 * Memoized to avoid recreating config object on every render
 *
 * @returns Calculation config ready for prayer time functions
 */
export const useCalculationConfig = (): CalculationConfig => {
    const settings = useSettings();

    return useMemo(
        () => ({
            fajrAngle: Number.parseFloat(settings.fajrAngle),
            ishaAngle: Number.parseFloat(settings.ishaAngle),
            ishaInterval: Number.parseFloat(settings.ishaInterval),
            latitude: settings.latitude,
            longitude: settings.longitude,
            method: settings.method,
            timeZone: settings.timeZone,
        }),
        [settings],
    );
};
