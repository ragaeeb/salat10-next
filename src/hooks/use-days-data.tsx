import { useCallback, useEffect, useRef, useState } from 'react';
import { daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import type { DayData, Timing } from '@/types/timeline';

export const useDaysData = (calculationArgs: Parameters<typeof daily>[1]) => {
    const [days, setDays] = useState<DayData[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);
    const lastScrollY = useRef(0);
    const dayIndexCounter = useRef(0);

    const loadDay = useCallback(
        (date: Date): DayData => {
            const todayRes = daily(salatLabels, calculationArgs, date);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextRes = daily(salatLabels, calculationArgs, nextDate);
            const nextFajr = nextRes.timings.find((t: Timing) => t.event === 'fajr')?.value ?? null;
            return { date, dayIndex: dayIndexCounter.current++, nextFajr, timings: todayRes.timings };
        },
        [calculationArgs],
    );

    useEffect(() => {
        const today = new Date();
        dayIndexCounter.current = 0;
        setDays([loadDay(today)]);
    }, [loadDay]);

    return { days, hasInitialized, lastScrollY, loadDay, setDays, setHasInitialized };
};
