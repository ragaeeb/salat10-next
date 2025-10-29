import type { useScroll } from 'motion/react';
import { useEffect } from 'react';
import { DAY_HEIGHT_PX } from '@/lib/constants';

export const useTimeline = (
    scrollY: ReturnType<typeof useScroll>['scrollY'],
    deps: {
        daysLen: number;
        hasInitialized: boolean;
        totalHeight: number;
        currentDayIndex: number;
        setCurrentDayIndex: (n: number) => void;
        setShowLoadPrev: (fn: (p: boolean) => boolean | boolean) => void;
        setShowLoadNext: (fn: (p: boolean) => boolean | boolean) => void;
        lastScrollY: React.MutableRefObject<number>;
    },
) => {
    useEffect(() => {
        if (!deps.hasInitialized || deps.daysLen === 0) {
            return;
        }

        const unsub = scrollY.on('change', (latest) => {
            deps.lastScrollY.current = latest;
            const dayIndex = Math.floor(latest / DAY_HEIGHT_PX);
            if (dayIndex !== deps.currentDayIndex) {
                deps.setCurrentDayIndex(dayIndex);
            }

            const distanceFromTop = latest;
            const distanceFromBottom = deps.totalHeight - latest - window.innerHeight;

            const nextPrev = distanceFromTop < 2000;
            const nextNext = distanceFromBottom < 2000;

            deps.setShowLoadPrev((prev: boolean) => (prev !== nextPrev ? nextPrev : prev));
            deps.setShowLoadNext((prev: boolean) => (prev !== nextNext ? nextNext : prev));
        });
        return () => unsub();
    }, [scrollY, deps]);
};
