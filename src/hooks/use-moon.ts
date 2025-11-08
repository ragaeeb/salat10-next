import { type MotionValue, useSpring, useTransform } from 'motion/react';
import { moonOpacityAt } from '@/lib/colors';
import { FRAC, POS } from '@/lib/constants';
import { invLerp, lerp } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

/**
 * Hook to calculate moon position and opacity for timeline animation
 *
 * Manages moon motion from west to east (right to left) starting shortly before
 * Maghrib. Uses spring physics for smooth, natural transitions. Moon appears
 * progressively brighter as night deepens.
 *
 * Motion is linear (no arc) to differentiate from sun's daytime arc.
 *
 * @param {MotionValue<number>} scrollProgress - Normalized scroll progress (0-1) within current day
 * @param {Timeline | null} timeline - Prayer time timeline for the current day, or null if not loaded
 * @returns Moon animation values
 * @property {MotionValue<number>} moonX - Horizontal position (spring-smoothed)
 * @property {MotionValue<number>} moonY - Vertical position (constant, spring-smoothed for consistency)
 * @property {MotionValue<number>} moonOpacity - Opacity value (0-1, spring-smoothed)
 *
 * @example
 * ```tsx
 * const { scrollProgress } = useScrollProgress(scrollY);
 * const timeline = useTimeline(currentDay);
 * const { moonX, moonY, moonOpacity } = useMoon(scrollProgress, timeline);
 *
 * return (
 *   <motion.div
 *     style={{ x: moonX, y: moonY, opacity: moonOpacity }}
 *     className="moon"
 *   />
 * );
 * ```
 */
export function useMoon(scrollProgress: MotionValue<number>, timeline: Timeline | null) {
    // Moon motion: LEFT <- RIGHT in a straight line
    const moonXRaw = useTransform(scrollProgress, (p) => {
        if (!timeline) {
            return POS.EAST_X;
        }
        const orangeStart = (timeline.asr + timeline.maghrib) / 2;
        const appearStart = lerp(orangeStart, timeline.maghrib, 1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
        if (p < timeline.sunrise) {
            return POS.EAST_X; // keep offscreen path consistent
        }
        if (p <= appearStart) {
            return POS.WEST_X;
        }
        return lerp(POS.WEST_X, POS.EAST_X, invLerp(appearStart, 1.0, p));
    });

    const moonOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? moonOpacityAt(p, timeline) : 0));

    const springCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const moonX = useSpring(moonXRaw, springCfg);
    const moonY = useSpring(POS.MOON_Y, springCfg);
    const moonOpacity = useSpring(moonOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    return { moonOpacity, moonX, moonY };
}
