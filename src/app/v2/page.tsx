'use client';

import { useScroll } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { daily } from '@/lib/calculator';
import { DAY_HEIGHT_PX, DISTANCE_FROM_TOP_BOTTOM, MAX_BUFFERED_DAYS } from '@/lib/constants';
import { salatLabels } from '@/lib/salat-labels';
import { buildTimeline, timeToScroll } from '@/lib/timeline';
import type { DayData, Timing } from '@/types/timeline';
import { Controls } from './controls';
import { CurrentPhase } from './current-phase';
import { Qamar } from './qamar';
import { Samaa } from './samaa';
import { Shams } from './shams';

export default function ParallaxPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const calculationConfig = useCalculationConfig();

    const [days, setDays] = useState<DayData[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);
    const lastScrollY = useRef(0);
    const dayIndexCounter = useRef(0);

    const loadDay = useCallback(
        (date: Date): DayData => {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextRes = daily(salatLabels, calculationConfig.config, nextDate);
            const nextFajr = nextRes.timings.find((t: Timing) => t.event === 'fajr')?.value ?? null;
            return {
                date,
                dayIndex: dayIndexCounter.current++,
                nextFajr,
                timings: daily(salatLabels, calculationConfig.config, date).timings,
            };
        },
        [calculationConfig.config],
    );

    useEffect(() => {
        const today = new Date();
        dayIndexCounter.current = 0;
        setDays([loadDay(today)]);
    }, [loadDay]);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    const totalHeight = days.length * DAY_HEIGHT_PX;
    const totalHeightStyle = useMemo(() => ({ height: totalHeight }), [totalHeight]);

    const currentDay = days[currentDayIndex];
    const timeline = useMemo(() => (currentDay ? buildTimeline(currentDay) : null), [currentDay]);

    useEffect(() => {
        if (hasInitialized || days.length === 0) {
            return;
        }
        const today = days[0]!;
        const initialP = timeToScroll(Date.now(), today);
        const scrollTop = initialP * DAY_HEIGHT_PX;
        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'auto', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        setHasInitialized(true);
        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [hasInitialized, days]);

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
    }, [loadDay]);

    const handleLoadNext = useCallback(() => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1]!.date;
            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + 1);
            const newDay = loadDay(newDate);
            const next = [...prev, newDay];
            return next.length > MAX_BUFFERED_DAYS ? next.slice(next.length - MAX_BUFFERED_DAYS) : next;
        });
    }, [loadDay]);

    const { scrollProgress, pNow } = useScrollProgress(scrollY);
    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);

    useEffect(() => {
        if (!hasInitialized || days.length === 0) {
            return;
        }

        const unsub = scrollY.on('change', (distanceFromTop) => {
            lastScrollY.current = distanceFromTop;
            const dayIndex = Math.floor(distanceFromTop / DAY_HEIGHT_PX);
            if (dayIndex !== currentDayIndex) {
                setCurrentDayIndex(dayIndex);
            }

            const distanceFromBottom = totalHeight - distanceFromTop - window.innerHeight;
            const nextPrev = distanceFromTop < DISTANCE_FROM_TOP_BOTTOM;
            const nextNext = distanceFromBottom < DISTANCE_FROM_TOP_BOTTOM;

            setShowLoadPrev((prev: boolean) => (prev !== nextPrev ? nextPrev : prev));
            setShowLoadNext((prev: boolean) => (prev !== nextNext ? nextNext : prev));
        });
        return () => unsub();
    }, [scrollY, currentDayIndex, days, hasInitialized, totalHeight]);

    return (
        <>
            <div ref={containerRef} style={totalHeightStyle} />

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
                    timeZone={calculationConfig.settings.timeZone}
                    scrollProgress={scrollProgress}
                    currentDay={currentDay}
                    timeline={timeline}
                />

                <Controls
                    showLoadNext={showLoadNext}
                    showLoadPrev={showLoadPrev}
                    handleLoadNext={handleLoadNext}
                    handleLoadPrev={handleLoadPrev}
                />
            </div>
        </>
    );
}
