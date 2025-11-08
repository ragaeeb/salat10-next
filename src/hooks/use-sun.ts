import { type MotionValue, useSpring, useTransform } from 'motion/react';
import { sunColorChannelAt, sunOpacityAt } from '@/lib/colors';
import { POS } from '@/lib/constants';
import { invLerp, lerp } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

/**
 * Hook to calculate sun position, color, and opacity for timeline animation
 *
 * Manages realistic sun motion from sunrise to sunset:
 * - Horizontal: East (right) → West (left) linear motion
 * - Vertical: Parabolic arc peaking at solar noon
 * - Color: Warm orange at horizon → bright white at peak → warm orange at sunset
 * - Opacity: Fade in at sunrise, fade out at Maghrib
 *
 * Sun only appears between sunrise and Maghrib. All values use spring physics
 * for smooth, natural transitions.
 *
 * @param {MotionValue<number>} scrollProgress - Normalized scroll progress (0-1) within current day
 * @param {Timeline | null} timeline - Prayer time timeline for the current day, or null if not loaded
 * @returns Sun animation values
 * @property {MotionValue<number>} sunX - Horizontal position percentage (spring-smoothed)
 * @property {MotionValue<number>} sunY - Vertical position percentage (spring-smoothed, parabolic arc)
 * @property {MotionValue<number>} sunOpacity - Opacity value (0-1, spring-smoothed)
 * @property {MotionValue<number>} sunColorR - Red color channel (0-255)
 * @property {MotionValue<number>} sunColorG - Green color channel (0-255)
 * @property {MotionValue<number>} sunColorB - Blue color channel (0-255)
 *
 * @example
 * ```tsx
 * const { scrollProgress } = useScrollProgress(scrollY);
 * const timeline = useTimeline(currentDay);
 * const {
 *   sunX,
 *   sunY,
 *   sunOpacity,
 *   sunColorR,
 *   sunColorG,
 *   sunColorB
 * } = useSun(scrollProgress, timeline);
 *
 * return (
 *   <Sun
 *     x={sunX}
 *     y={sunY}
 *     opacity={sunOpacity}
 *     color={{ r: sunColorR, g: sunColorG, b: sunColorB }}
 *   />
 * );
 * ```
 */
export function useSun(scrollProgress: MotionValue<number>, timeline: Timeline | null) {
    // Sun motion: RIGHT -> LEFT (east->west), arcing only during daylight
    const sunXRaw = useTransform(scrollProgress, (p) => {
        if (!timeline) {
            return POS.EAST_X;
        }
        if (p <= timeline.sunrise) {
            return POS.EAST_X;
        }
        if (p >= timeline.maghrib) {
            return POS.WEST_X;
        }
        return lerp(POS.EAST_X, POS.WEST_X, invLerp(timeline.sunrise, timeline.maghrib, p));
    });

    const sunYRaw = useTransform(scrollProgress, (p) => {
        if (!timeline) {
            return POS.LOW_Y;
        }
        if (p <= timeline.sunrise || p >= timeline.maghrib) {
            return POS.LOW_Y;
        }
        const t = invLerp(timeline.sunrise, timeline.maghrib, p);
        return POS.LOW_Y - POS.SUN_PEAK_Y_DELTA * (1 - (2 * t - 1) ** 2);
    });

    const sunOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? sunOpacityAt(p, timeline) : 0));

    const sunColorR = useTransform(scrollProgress, (p) => (timeline ? sunColorChannelAt(p, timeline, 'r') : 255));
    const sunColorG = useTransform(scrollProgress, (p) => (timeline ? sunColorChannelAt(p, timeline, 'g') : 223));
    const sunColorB = useTransform(scrollProgress, (p) => (timeline ? sunColorChannelAt(p, timeline, 'b') : 102));

    const springCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const sunX = useSpring(sunXRaw, springCfg);
    const sunY = useSpring(sunYRaw, springCfg);
    const sunOpacity = useSpring(sunOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });

    return { sunColorB, sunColorG, sunColorR, sunOpacity, sunX, sunY };
}
