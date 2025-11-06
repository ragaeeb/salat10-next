import { useCallback, useEffect, useMemo, useState } from 'react';
import { type CalculationConfig, daily, formatTimeRemaining, getActiveEvent, getTimeUntilNext } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useCurrentData, usePrayerStore, useSettings } from '@/store/usePrayerStore';

/**
 * Hook to get formatted timings for the current date from the store
 */
export const useCurrentTimings = () => {
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
 * Hook to get the active event with efficient timeout-based updates
 * Only recalculates when an event boundary is crossed
 */
export const useActiveEvent = () => {
    const timings = useCurrentTimings();
    const [activeEvent, setActiveEvent] = useState<string | null>(null);

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

        // Set initial active event
        const currentTime = updateActiveEvent();

        // Find when the next event starts to schedule update
        const nextTiming = timings.find((t) => t.value.getTime() > currentTime);

        if (!nextTiming) {
            // No more events today, will be updated when timings change
            return;
        }

        const msUntilNext = nextTiming.value.getTime() - currentTime;

        // Schedule update at the next event time
        const timeoutId = setTimeout(() => {
            updateActiveEvent();
        }, msUntilNext);

        return () => clearTimeout(timeoutId);
    }, [timings]);

    return activeEvent;
};

/**
 * Hook to get countdown to next prayer with efficient updates
 * Uses metadata from daily calculation to minimize computation
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

        // Initial update
        const result = updateCountdown();

        if (!result) {
            return;
        }

        // Update every second only while there's a countdown
        // This is more efficient than checking every prayer time
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
 * Helper to check if two dates are the same day (ignoring time)
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
 * - Uses precomputed store data for current day
 * - Only calculates on-demand for prev/next days
 */
export const useDayNavigation = () => {
    const currentData = useCurrentData();
    const currentTimings = useCurrentTimings();

    // Track which date we're viewing (null = today/current)
    const [viewDate, setViewDate] = useState<Date | null>(null);

    // Calculate timings only when viewing a different day
    const previewResult = useTimingsForDate(viewDate ?? new Date());

    // Determine if we're viewing "today" based on store's current date
    const isViewingToday = useMemo(() => {
        if (!currentData || viewDate === null) {
            return true;
        }
        return isSameDay(viewDate, currentData.date);
    }, [viewDate, currentData]);

    // Use store timings for today, calculated timings for other days
    const timings = isViewingToday ? currentTimings : previewResult.timings;
    const dateLabel =
        isViewingToday && currentData
            ? currentData.date.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  weekday: 'long',
                  year: 'numeric',
              })
            : previewResult.date;

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
        // Reset to null to use store's precomputed data
        setViewDate(null);
    }, []);

    return { dateLabel, handleNextDay, handlePrevDay, handleToday, timings, viewDate: effectiveDate };
};

/**
 * Hook to build calculation config from store
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

/**
 * Initialize the prayer store on app mount
 */
export const useInitializePrayerStore = () => {
    useEffect(() => {
        const store = usePrayerStore.getState();

        return () => {
            store._clearScheduledUpdate();
        };
    }, []);
};
