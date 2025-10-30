import { type MotionValue, useSpring, useTransform } from 'motion/react';
import { moonOpacityAt } from '@/lib/colors';
import { FRAC, POS } from '@/lib/constants';
import { invLerp, lerp } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

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
