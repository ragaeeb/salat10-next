import type { MotionValue } from 'motion/react';
import { Moon } from '@/components/astro/moon';
import { useMoon } from '@/hooks/use-moon';
import { calculateLunarPhase } from '@/lib/lunar';
import type { Timeline } from '@/types/timeline';

type QamarProps = {
    /** Optional lunar cycle fraction (0=new, 0.5=full) */
    lunarCycle?: number | undefined;
    scrollProgress: MotionValue<number>;
    timeline: Timeline | null;
};

const MOON_COLOR = { b: 255, g: 255, r: 255 };

/**
 * Animated Moon component with dynamic lunar phase
 *
 * @param props - Qamar props
 * @returns Moon element
 */
export const Qamar = ({ scrollProgress, timeline, lunarCycle }: QamarProps) => {
    const { moonX, moonY, moonOpacity } = useMoon(scrollProgress, timeline);
    const activeLunarCycle = lunarCycle ?? calculateLunarPhase(new Date()).cycleFraction;

    return <Moon color={MOON_COLOR} lunarCycle={activeLunarCycle} opacity={moonOpacity} x={moonX} y={moonY} />;
};
