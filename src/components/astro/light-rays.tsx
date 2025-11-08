import { type MotionValue, motion } from 'motion/react';
import { memo } from 'react';

type LightRaysProps = { opacity: number | MotionValue<number> };

/**
 * Light rays effect component
 *
 * Renders subtle blue radial rays emanating from the horizon during sunrise.
 * Creates an atmospheric effect of light breaking through the atmosphere.
 * Multiple overlapping radial gradients provide depth and realism.
 *
 * @param {LightRaysProps} props - Component props
 * @param {number | MotionValue<number>} props.opacity - Opacity control (0-1)
 *
 * @example
 * ```tsx
 * const { lightRaysOpacity } = useSky(scrollProgress, timeline);
 * return <LightRays opacity={lightRaysOpacity} />;
 * ```
 */
export const LightRays = memo<LightRaysProps>(({ opacity }) => (
    <motion.div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" style={{ opacity }}>
        <div
            className="absolute inset-0"
            style={{
                background:
                    'radial-gradient(ellipse 120% 40% at 50% 100%, rgba(100, 140, 255, 0.25) 0%, rgba(80, 120, 200, 0.15) 25%, rgba(60, 90, 150, 0.08) 45%, transparent 70%)',
            }}
        />
        <div
            className="absolute inset-0"
            style={{
                background:
                    'radial-gradient(circle at 30% 95%, rgba(140, 180, 255, 0.06) 0%, transparent 25%), radial-gradient(circle at 70% 95%, rgba(120, 160, 240, 0.05) 0%, transparent 25%)',
            }}
        />
    </motion.div>
));
LightRays.displayName = 'LightRays';
