import { type MotionValue, motion } from 'motion/react';
import { memo } from 'react';

type FajrGradientProps = { opacity: number | MotionValue<number> };
export const FajrGradient = memo<FajrGradientProps>(({ opacity }) => (
    <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
            /* Warmer, more immediate horizon glow */
            background:
                'linear-gradient(to top, rgba(255, 210, 95, 0.95) 0%, rgba(255, 195, 95, 0.88) 12%, rgba(255, 175, 110, 0.78) 22%, rgba(242, 165, 120, 0.62) 32%, rgba(185, 155, 140, 0.48) 45%, rgba(128, 135, 160, 0.34) 60%, transparent 78%)',
            opacity,
        }}
    />
));
FajrGradient.displayName = 'FajrGradient';
