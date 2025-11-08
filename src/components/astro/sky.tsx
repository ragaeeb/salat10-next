import { type MotionValue, motion } from 'motion/react';
import { memo } from 'react';

type SkyBackgroundProps = { skyColor: string | MotionValue<string> };

/**
 * Sky background component
 *
 * Renders the base sky background color that transitions throughout the day:
 * - Deep night blue during Isha/night
 * - Gradual brightening before Fajr
 * - Bright blue during day
 * - Orange/purple tones at dusk
 * - Back to deep blue after Isha
 *
 * This is the foundation layer - all other sky elements overlay on top.
 *
 * @param {SkyBackgroundProps} props - Component props
 * @param {string | MotionValue<string>} props.skyColor - RGB color string or MotionValue
 *
 * @example
 * ```tsx
 * const { skyColor } = useSky(scrollProgress, timeline);
 * return <SkyBackground skyColor={skyColor} />;
 * ```
 */
export const SkyBackground = memo<SkyBackgroundProps>(({ skyColor }) => (
    <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: skyColor }} />
));

SkyBackground.displayName = 'SkyBackground';
