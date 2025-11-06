import type { MotionValue } from 'motion';
import { Moon } from '@/components/astro/moon';
import { useMoon } from '@/hooks/use-moon';
import type { Timeline } from '@/types/timeline';

type QamarProps = { scrollProgress: MotionValue<number>; timeline: Timeline | null };

const MOON_COLOR = { b: 255, g: 255, r: 255 };

export const Qamar = ({ scrollProgress, timeline }: QamarProps) => {
    const { moonX, moonY, moonOpacity } = useMoon(scrollProgress, timeline);
    return <Moon x={moonX} y={moonY} opacity={moonOpacity} color={MOON_COLOR} />;
};
