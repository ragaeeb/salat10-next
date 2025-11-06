import { useCallback, useEffect, useMemo, useState } from 'react';
import { type CalculationConfig, daily, type FormattedTiming, getActiveEvent } from '@/lib/calculator';
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
 * Hook to get the active event (updates every second)
 */
export const useActiveEvent = () => {
    const timings = useCurrentTimings();
    const [activeEvent, setActiveEvent] = useState<string | null>(null);

    useEffect(() => {
        const updateActive = () => {
            const now = Date.now();
            const event = getActiveEvent(timings, now);
            setActiveEvent(event);
        };

        updateActive();
        const interval = setInterval(updateActive, 1000);

        return () => clearInterval(interval);
    }, [timings]);

    return activeEvent;
};

/**
 * Hook to get countdown to next prayer
 */
export const useCountdownToNext = () => {
    const timings = useCurrentTimings();
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        const updateCountdown = () => {
            const now = Date.now();
            const nextTiming = timings.find((t) => t.value.getTime() > now);

            if (!nextTiming) {
                setCountdown('');
                return;
            }

            const diff = nextTiming.value.getTime() - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${hours}h ${minutes}m ${seconds}s until ${nextTiming.label}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [timings]);

    return countdown;
};

/**
 * Hook for day navigation (prev/next/today) - returns local state and handlers
 */
export const useDayNavigation = () => {
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const result = useTimingsForDate(viewDate);

    const handlePrevDay = useCallback(() => {
        setViewDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 1);
            return next;
        });
    }, []);

    const handleNextDay = useCallback(() => {
        setViewDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 1);
            return next;
        });
    }, []);

    const handleToday = useCallback(() => {
        setViewDate(new Date());
    }, []);

    return { dateLabel: result.date, handleNextDay, handlePrevDay, handleToday, timings: result.timings, viewDate };
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
        store.initialize();

        return () => {
            store._clearScheduledUpdate();
        };
    }, []);
};
