// components.tsx

import { type MotionValue, motion, useMotionTemplate, useTransform } from 'framer-motion';
import { memo, useId } from 'react';

type SunProps = {
    x: number | MotionValue<number>;
    y: number | MotionValue<number>;
    opacity: number | MotionValue<number>;
    color: { r: MotionValue<number>; g: MotionValue<number>; b: MotionValue<number> };

    /** Optional sizing */
    size?: number; // sets both width & height
    width?: number; // overrides size for width
    height?: number; // overrides size for height
    className?: string; // optional extra classes
};

export const Sun = memo<SunProps>(({ x, y, opacity, color, size = 80, width, height, className }) => {
    const leftPct = useTransform(x as MotionValue<number>, (v) => `${v}%`);
    const topPct = useTransform(y as MotionValue<number>, (v) => `${v}%`);
    const fill = useMotionTemplate`rgb(${color.r}, ${color.g}, ${color.b})`;
    const uid = useId();
    const glowId = `sunGlow-${uid}`;
    const haloId = `sunHalo-${uid}`;

    const w = width ?? size;
    const h = height ?? size;

    return (
        <motion.svg
            className={`pointer-events-none absolute z-30 ${className ?? ''}`}
            width={w}
            height={h}
            viewBox="0 0 80 80"
            preserveAspectRatio="xMidYMid meet"
            style={{
                color: fill, // children use currentColor
                left: leftPct,
                mixBlendMode: 'screen',
                opacity,
                top: topPct,
                transform: 'translate(-50%, -50%) translate3d(0,0,0)',
                willChange: 'transform, opacity',
            }}
            aria-hidden
            focusable="false"
        >
            <title>Sun</title>
            <defs>
                <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
                    <stop offset="60%" stopColor="currentColor" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
            </defs>

            <motion.circle cx="40" cy="40" r="18" fill="currentColor" filter={`url(#${glowId})`} />
            <motion.circle cx="40" cy="40" r="28" fill="currentColor" />
            <circle cx="40" cy="40" r="32" fill={`url(#${haloId})`} />
        </motion.svg>
    );
});

Sun.displayName = 'Sun';
