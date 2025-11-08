import { type MotionValue, motion } from 'motion/react';
import { memo } from 'react';

type SunsetGradientProps = { opacity: number | MotionValue<number> };

/**
 * Sunset gradient overlay component
 *
 * Renders warm dusk colors that appear during Asr to Maghrib transition.
 * Gradient progresses from warm orange/red at top through purple mid-tones
 * to transparent at bottom, creating realistic sunset atmosphere.
 *
 * Colors simulate atmospheric scattering during the golden hour before sunset.
 *
 * @param {SunsetGradientProps} props - Component props
 * @param {number | MotionValue<number>} props.opacity - Opacity control (0-1)
 *
 * @example
 * ```tsx
 * const { sunsetGradientOpacity } = useSky(scrollProgress, timeline);
 * return <SunsetGradient opacity={sunsetGradientOpacity} />;

 * ```
 */
export const SunsetGradient = memo<SunsetGradientProps>(({ opacity }) => (
    <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
            background:
                'linear-gradient(to bottom, rgba(255, 180, 90, 0.85) 0%, rgba(255, 160, 100, 0.75) 18%, rgba(240, 140, 110, 0.55) 32%, rgba(150, 120, 150, 0.35) 50%, rgba(60, 70, 110, 0.25) 70%, transparent 88%)',
            opacity,
        }}
    />
));
SunsetGradient.displayName = 'SunsetGradient';
