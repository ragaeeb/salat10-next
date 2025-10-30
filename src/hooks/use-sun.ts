import { type MotionValue, useSpring, useTransform } from 'motion/react';
import { sunColorChannelAt, sunOpacityAt } from '@/lib/colors';
import { POS } from '@/lib/constants';
import { invLerp, lerp } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

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
