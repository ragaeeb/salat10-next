import type { MotionValue } from 'motion/react';
import { useEffect, useState } from 'react';
import { phaseLabelAndTime } from '@/lib/formatting';
import type { DayData, Timeline } from '@/types/timeline';

export function usePhaseInfo(
    scrollProgress: MotionValue<number>,
    timeline: Timeline | null,
    currentDay: DayData | undefined,
    timeZone: string,
) {
    const [phaseInfo, setPhaseInfo] = useState<{ label: string; time: string }>({ label: '', time: '' });

    useEffect(() => {
        if (!timeline || !currentDay) {
            return;
        }
        const unsub = scrollProgress.on('change', (p) => {
            const info = phaseLabelAndTime(p, timeline, currentDay.timings, timeZone);
            setPhaseInfo((prev) => (prev.label === info.label && prev.time === info.time ? prev : info));
        });
        return () => unsub();
    }, [scrollProgress, timeline, currentDay, timeZone]);

    return phaseInfo;
}
