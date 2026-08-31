import type { MotionValue } from 'motion/react';
import { Sun } from '@/components/astro/sun';
import { useSun } from '@/hooks/use-sun';
import type { Timeline } from '@/types/timeline';

type ShamsProps = { scrollProgress: MotionValue<number>; timeline: Timeline | null };

export const Shams = ({ scrollProgress, timeline }: ShamsProps) => {
    const { sunX, sunY, sunOpacity, sunColorR, sunColorG, sunColorB } = useSun(scrollProgress, timeline);

    const sunColor = { b: sunColorB, g: sunColorG, r: sunColorR };

    return <Sun color={sunColor} opacity={sunOpacity} size={120} x={sunX} y={sunY} />;
};
