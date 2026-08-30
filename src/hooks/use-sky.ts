import { type MotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
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

    useEffect(() => {
        if (timeline) {
            starsOpacity.jump(starsOpacityRaw.get());
            fajrGradientOpacity.jump(fajrGradientOpacityRaw.get());
            sunsetGradientOpacity.jump(sunsetGradientOpacityRaw.get());
            lightRaysOpacity.jump(lightRaysOpacityRaw.get());
        }
    }, [
        timeline,
        starsOpacity,
        fajrGradientOpacity,
        sunsetGradientOpacity,
        lightRaysOpacity,
        starsOpacityRaw,
        fajrGradientOpacityRaw,
        sunsetGradientOpacityRaw,
        lightRaysOpacityRaw,
    ]);

    return { fajrGradientOpacity, lightRaysOpacity, skyColor, starsOpacity, sunsetGradientOpacity };
}
