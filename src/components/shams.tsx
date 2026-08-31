import type { MotionValue } from 'motion/react';
import { Sun } from '@/components/astro/sun';
import { useSun } from '@/hooks/use-sun';
import type { Timeline } from '@/types/timeline';

type ShamsProps = { scrollProgress: MotionValue<number>; timeline: Timeline | null };

export const Shams = ({ scrollProgress, timeline }: ShamsProps) => {
    const {
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
    } = useSun(scrollProgress, timeline);

    const sunColor = { b: sunColorB, g: sunColorG, r: sunColorR };

    return (
        <Sun
            color={sunColor}
            glowIntensity={sunGlowIntensity}
            middayIntensity={sunMiddayIntensity}
            opacity={sunOpacity}
            rayRotation={sunRayRotation}
            rayScale={sunRayScale}
            size={240}
            x={sunX}
            y={sunY}
        />
    );
};
