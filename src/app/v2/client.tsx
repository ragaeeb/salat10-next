'use client';

import { Samaa } from '@/components/astro/samaa';
import { Controls } from '@/components/controls';
import { CurrentPhase } from '@/components/current-phase';
import { HijriDateBadge } from '@/components/hijri-date-badge';
import { Qamar } from '@/components/qamar';
import { Shams } from '@/components/shams';
import { useDayBuffer } from '@/hooks/use-days';
import { useScrollTracking } from '@/hooks/use-scroll-tracking';
import { useCalculationConfig } from '@/lib/prayer-utils';
import { buildTimeline } from '@/lib/timeline';
import { useSettings } from '@/store/usePrayerStore';

export function ParallaxClient() {
    const config = useCalculationConfig();
    const settings = useSettings();

    // Day buffer management
    const { days, addPreviousDay, addNextDay } = useDayBuffer(config);
    const { pNow, scrollProgress, onAddPrevDay, totalHeight, currentDayIndex, showLoadNext, showLoadPrev } =
        useScrollTracking(days);

    // Handle loading previous day with scroll adjustment
    const handleLoadPrev = () => {
        addPreviousDay();
        onAddPrevDay();
    };

    const currentDay = days[currentDayIndex];
    const timeline = currentDay ? buildTimeline(currentDay) : null;

    return (
        <>
            <div style={{ height: totalHeight }} />

            {currentDay && <HijriDateBadge date={currentDay.date} />}

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
