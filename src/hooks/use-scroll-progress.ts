import { type MotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { DAY_HEIGHT_PX } from '@/lib/constants';

/**
 * Hook to calculate normalized scroll progress within the current day
 *
 * Converts raw scroll position into a 0-1 progress value representing position
 * within the current Islamic day. Used to drive timeline animations (sun, moon,
 * sky color, etc.) that correspond to prayer times.
 *
 * Progress is clamped to 0.999 at the end to prevent wrapping to next day's
 * Fajr during the transition.
 *
 * @param {MotionValue<number>} scrollY - Raw scroll Y position in pixels
 * @returns Scroll progress state
 * @property {MotionValue<number>} scrollProgress - Normalized progress (0-0.999) within current day
 * @property {number} pNow - Plain number copy of current progress for conditional logic
 *
 * @example
 * ```tsx
 * const { scrollY } = useScroll();
 * const { scrollProgress, pNow } = useScrollProgress(scrollY);
 *
 * // Use scrollProgress for animations
 * const sunX = useTransform(scrollProgress, [0, 1], [0, 100]);
 *
 * // Use pNow for conditional rendering
 * if (pNow > 0.5) {
 *   return <NightMode />;
 * }
 * ```
 */
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
