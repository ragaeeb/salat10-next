import { type MotionValue, useSpring, useTransform } from 'motion/react';
import {
    fajrGradientOpacityAt,
    lightRaysOpacityAt,
    skyColorAt,
    starsOpacityAt,
    sunsetGradientOpacityAt,
} from '@/lib/colors';
import type { Timeline } from '@/types/timeline';

const OPACITY_SPRING_CONFIG = { damping: 28, mass: 0.25, stiffness: 220 };

/**
 * Hook to calculate sky background and overlay effects for timeline animation
 *
 * Manages the dynamic sky system including:
 * - Base sky color transitions (deep night blue → dawn → day → dusk → night)
 * - Stars visibility (fade in after Isha, peak at midnight)
 * - Fajr gradient overlay (warm horizon glow before sunrise)
 * - Sunset gradient overlay (orange/purple dusk colors)
 * - Light rays (subtle blue rays during sunrise)
 *
 * All values are spring-smoothed for natural, physics-based transitions.
 *
 * @param {MotionValue<number>} scrollProgress - Normalized scroll progress (0-1) within current day
 * @param {Timeline | null} timeline - Prayer time timeline for the current day, or null if not loaded
 * @returns Sky animation values
 * @property {MotionValue<string>} skyColor - Base sky background color (RGB string)
 * @property {MotionValue<number>} starsOpacity - Stars layer opacity (0-1)
 * @property {MotionValue<number>} fajrGradientOpacity - Fajr gradient overlay opacity (0-1)
 * @property {MotionValue<number>} sunsetGradientOpacity - Sunset gradient overlay opacity (0-1)
 * @property {MotionValue<number>} lightRaysOpacity - Light rays effect opacity (0-1)
 *
 * @example
 * ```tsx
 * const { scrollProgress } = useScrollProgress(scrollY);
 * const timeline = useTimeline(currentDay);
 * const {
 *   skyColor,
 *   starsOpacity,
 *   fajrGradientOpacity
 * } = useSky(scrollProgress, timeline);
 *
 * return (
 *   <>
 *     <motion.div style={{ backgroundColor: skyColor }} />
 *     <FajrGradient opacity={fajrGradientOpacity} />
 *     <StarsLayer opacity={starsOpacity} />
 *   </>
 * );
 * ```
 */
export function useSky(scrollProgress: MotionValue<number>, timeline: Timeline | null) {
    const skyColor = useTransform(scrollProgress, (p) => (timeline ? skyColorAt(p, timeline) : 'rgba(0,0,0,1)'));

    const starsOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? starsOpacityAt(p, timeline) : 0));
    const fajrGradientOpacityRaw = useTransform(scrollProgress, (p) =>
        timeline ? fajrGradientOpacityAt(p, timeline) : 0,
    );
    const sunsetGradientOpacityRaw = useTransform(scrollProgress, (p) =>
        timeline ? sunsetGradientOpacityAt(p, timeline) : 0,
    );
    const lightRaysOpacityRaw = useTransform(scrollProgress, (p) => (timeline ? lightRaysOpacityAt(p, timeline) : 0));

    const starsOpacity = useSpring(starsOpacityRaw, OPACITY_SPRING_CONFIG);
    const fajrGradientOpacity = useSpring(fajrGradientOpacityRaw, OPACITY_SPRING_CONFIG);
    const sunsetGradientOpacity = useSpring(sunsetGradientOpacityRaw, OPACITY_SPRING_CONFIG);
    const lightRaysOpacity = useSpring(lightRaysOpacityRaw, OPACITY_SPRING_CONFIG);

    return { fajrGradientOpacity, lightRaysOpacity, skyColor, starsOpacity, sunsetGradientOpacity };
}
