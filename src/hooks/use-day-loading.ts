import { type RefObject, useCallback } from 'react';
import { DAY_HEIGHT_PX, MAX_BUFFERED_DAYS } from '@/lib/constants';
import type { DayData } from '@/types/timeline';

export function useDayLoading(
    loadDay: (date: Date) => DayData,
    setDays: React.Dispatch<React.SetStateAction<DayData[]>>,
    lastScrollY: RefObject<number>,
) {
    const handleLoadPrev = useCallback(() => {
        setDays((prev) => {
            const firstDate = prev[0]!.date;
            const newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() - 1);
            const newDay = loadDay(newDate);
            const next = [newDay, ...prev].slice(0, MAX_BUFFERED_DAYS);
            return next;
        });
        requestAnimationFrame(() => {
            // keep visual position after prepending
            window.scrollTo({ behavior: 'auto', left: 0, top: lastScrollY.current + DAY_HEIGHT_PX });
        });
    }, [loadDay, setDays, lastScrollY]);

    const handleLoadNext = useCallback(() => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1]!.date;
            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + 1);
            const newDay = loadDay(newDate);
            const next = [...prev, newDay];
            return next.length > MAX_BUFFERED_DAYS ? next.slice(next.length - MAX_BUFFERED_DAYS) : next;
        });
    }, [loadDay, setDays]);

    return { handleLoadNext, handleLoadPrev };
}
