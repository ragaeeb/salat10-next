import { type MotionValue, motion } from 'motion/react';
import { memo } from 'react';

/**
 * Fajr gradient overlay - adds warm horizon glow on top of the dark base sky.
 * Fades to transparent so the base sky color (single source of truth) shows through at the top.
 */
type FajrGradientProps = { opacity: number | MotionValue<number> };

/**
 * Fajr gradient overlay component
 *
 * Renders a warm horizon glow that appears during pre-dawn Fajr time.
 * Gradient fades from warm orange/yellow at bottom to transparent at top,
 * allowing the dark base sky color to show through naturally.
 *
 * Colors simulate the first light of dawn appearing on the eastern horizon.
 *
 * @param {FajrGradientProps} props - Component props
 * @param {number | MotionValue<number>} props.opacity - Opacity control (0-1)
 *
 * @example
 * ```tsx
 * const { fajrGradientOpacity } = useSky(scrollProgress, timeline);
 * return <FajrGradient opacity={fajrGradientOpacity} />;
 * ```
 */
export const FajrGradient = memo<FajrGradientProps>(({ opacity }) => (
    <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
            /* Warm horizon glow that fades to transparent, letting the dark base sky show through */
            background:
                'linear-gradient(to top, rgba(255, 210, 95, 0.95) 0%, rgba(255, 195, 95, 0.88) 12%, rgba(255, 175, 110, 0.78) 22%, rgba(242, 165, 120, 0.62) 32%, rgba(185, 155, 140, 0.48) 45%, rgba(128, 135, 160, 0.34) 60%, rgba(40, 50, 80, 0.15) 75%, transparent 88%)',
            opacity,
        }}
    />
));
FajrGradient.displayName = 'FajrGradient';
