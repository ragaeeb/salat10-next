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
