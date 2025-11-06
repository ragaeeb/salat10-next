'use client';

import { useCallback, useMemo } from 'react';

import { useDayBuffer } from '@/hooks/use-days';
import { useScrollTracking } from '@/hooks/use-scroll-tracking';
import { useCalculationConfig } from '@/lib/prayer-utils';
import { buildTimeline } from '@/lib/timeline';
import { useSettings } from '@/store/usePrayerStore';
import { Controls } from './controls';
import { CurrentPhase } from './current-phase';
import { Qamar } from './qamar';
import { Samaa } from './samaa';
import { Shams } from './shams';

export default function ParallaxPage() {
    const config = useCalculationConfig();
    const settings = useSettings();

    // Day buffer management
    const { days, addPreviousDay, addNextDay } = useDayBuffer(config);
    const { pNow, scrollProgress, onAddPrevDay, totalHeight, currentDayIndex, showLoadNext, showLoadPrev } =
        useScrollTracking(days);

    // Handle loading previous day with scroll adjustment
    const handleLoadPrev = useCallback(() => {
        addPreviousDay();
        onAddPrevDay();
    }, [addPreviousDay, onAddPrevDay]);

    const currentDay = days[currentDayIndex];
    const timeline = useMemo(() => (currentDay ? buildTimeline(currentDay) : null), [currentDay]);

    return (
        <>
            <div style={{ height: totalHeight }} />

            <div className="fixed inset-0">
                <Samaa
                    pNow={pNow}
                    timeline={timeline}
                    scrollProgress={scrollProgress}
                    totalDays={days.length}
                    currentDayIndex={currentDayIndex}
                />
                <Shams timeline={timeline} scrollProgress={scrollProgress} />
                <Qamar timeline={timeline} scrollProgress={scrollProgress} />
                <CurrentPhase
                    timeZone={settings.timeZone}
                    scrollProgress={scrollProgress}
                    currentDay={currentDay}
                    timeline={timeline}
                />

                <Controls
                    showLoadNext={showLoadNext}
                    showLoadPrev={showLoadPrev}
                    handleLoadNext={addNextDay}
                    handleLoadPrev={handleLoadPrev}
                />
            </div>
        </>
    );
}
