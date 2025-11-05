import { type MotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { DAY_HEIGHT_PX } from '@/lib/constants';

export function useScrollProgress(scrollY: MotionValue<number>) {
    // Progress within current day, clamped to prevent wrapping to next day's Fajr at the very end
    const scrollProgress = useTransform(scrollY, (latest) => {
        const withinDay = latest % DAY_HEIGHT_PX;
        const p = withinDay / DAY_HEIGHT_PX;
        return Math.min(p, 0.999);
    });

    // keep a plain number for branching & seam work
    const [pNow, setPNow] = useState(0);
    useEffect(() => {
        const unsub = scrollProgress.on('change', (p) => setPNow(p));
        return () => unsub();
    }, [scrollProgress]);

    return { pNow, scrollProgress };
}
