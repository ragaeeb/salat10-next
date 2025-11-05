import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalculationConfig } from '@/hooks/use-calculation-config';
import { daily } from '@/lib/calculator';
import { MAX_BUFFERED_DAYS } from '@/lib/constants';
import { salatLabels } from '@/lib/salat-labels';
import type { DayData, Timing } from '@/types/timeline';

export function useDayBuffer(config: CalculationConfig) {
    const dayIndexCounter = useRef(0);

    const loadDay = useCallback(
        (date: Date): DayData => {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextRes = daily(salatLabels, config, nextDate);
            const nextFajr = nextRes.timings.find((t: Timing) => t.event === 'fajr')?.value ?? null;
            return {
                date,
                dayIndex: dayIndexCounter.current++,
                nextFajr,
                timings: daily(salatLabels, config, date).timings,
            };
        },
        [config],
    );

    const [days, setDays] = useState<DayData[]>([loadDay(new Date())]);

    // Initialize with today
    useEffect(() => {
        const today = new Date();
        dayIndexCounter.current = 0;
        setDays([loadDay(today)]);
    }, [loadDay]);

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
