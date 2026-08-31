import { type MotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
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
 */

type SunAnimationValues = {
    sunColorB: MotionValue<number>;
    sunColorG: MotionValue<number>;
    sunColorR: MotionValue<number>;
    sunGlowIntensity: MotionValue<number>;
    sunMiddayIntensity: MotionValue<number>;
    sunOpacity: MotionValue<number>;
    sunRayRotation: MotionValue<number>;
    sunRayScale: MotionValue<number>;
    sunX: MotionValue<number>;
    sunY: MotionValue<number>;
};

export function useSun(scrollProgress: MotionValue<number>, timeline: Timeline | null): SunAnimationValues {
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

    // Glow intensity: maximum (1.0) at sunrise, progressively decreasing through Dhuhr down to 0.0 at sunset
    const sunGlowIntensityRaw = useTransform(scrollProgress, (p) => {
        if (!timeline || p <= timeline.sunrise || p >= timeline.maghrib) {
            return 0;
        }
        const t = invLerp(timeline.sunrise, timeline.maghrib, p);
        return Math.max(0, Math.min(1, 1 - t));
    });

    // Midday intensity factor (parabolic curve peaking at solar noon)
    const sunMiddayIntensityRaw = useTransform(scrollProgress, (p) => {
        if (!timeline || p <= timeline.sunrise || p >= timeline.maghrib) {
            return 0;
        }
        const t = invLerp(timeline.sunrise, timeline.maghrib, p);
        return Math.max(0, 1 - (2 * t - 1) ** 2);
    });

    // Sun ray scale (1.4 at sunrise, decreasing progressively to 0 at sunset)
    const sunRayScaleRaw = useTransform(scrollProgress, (p) => {
        if (!timeline || p <= timeline.sunrise || p >= timeline.maghrib) {
            return 0;
        }
        const t = invLerp(timeline.sunrise, timeline.maghrib, p);
        const glow = Math.max(0, Math.min(1, 1 - t));
        return lerp(0, 1.4, glow);
    });

    // Continuous dynamic ray rotation based on day progress
    const sunRayRotationRaw = useTransform(scrollProgress, (p) => p * 360);

    const springCfg = { damping: 28, mass: 0.25, stiffness: 220 };
    const sunX = useSpring(sunXRaw, springCfg);
    const sunY = useSpring(sunYRaw, springCfg);
    const sunOpacity = useSpring(sunOpacityRaw, { damping: 25, mass: 0.25, stiffness: 180 });
    const sunGlowIntensity = useSpring(sunGlowIntensityRaw, springCfg);
    const sunMiddayIntensity = useSpring(sunMiddayIntensityRaw, springCfg);
    const sunRayScale = useSpring(sunRayScaleRaw, springCfg);
    const sunRayRotation = useSpring(sunRayRotationRaw, { damping: 30, mass: 0.2, stiffness: 120 });

    useEffect(() => {
        if (timeline) {
            sunX.jump(sunXRaw.get());
            sunY.jump(sunYRaw.get());
            sunOpacity.jump(sunOpacityRaw.get());
            sunGlowIntensity.jump(sunGlowIntensityRaw.get());
            sunMiddayIntensity.jump(sunMiddayIntensityRaw.get());
            sunRayScale.jump(sunRayScaleRaw.get());
            sunRayRotation.jump(sunRayRotationRaw.get());
        }
    }, [
        timeline,
        sunX,
        sunY,
        sunOpacity,
        sunGlowIntensity,
        sunMiddayIntensity,
        sunRayScale,
        sunRayRotation,
        sunXRaw,
        sunYRaw,
        sunOpacityRaw,
        sunGlowIntensityRaw,
        sunMiddayIntensityRaw,
        sunRayScaleRaw,
        sunRayRotationRaw,
    ]);

    return {
        sunColorB,
        sunColorG,
        sunColorR,
        sunGlowIntensity,
        sunMiddayIntensity,
        sunOpacity,
        sunRayRotation,
        sunRayScale,
        sunX,
        sunY,
    };
}
