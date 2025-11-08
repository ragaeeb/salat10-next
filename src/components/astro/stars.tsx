import { type MotionValue, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { memo } from 'react';

/** Client-only star layers (avoid SSR/CSR mismatch) */
const ShootingStars = dynamic(() => import('@/components/aceternity/shooting-stars').then((m) => m.ShootingStars), {
    ssr: false,
});
const StarsBackground = dynamic(
    () => import('@/components/aceternity/stars-background').then((m) => m.StarsBackground),
    { ssr: false },
);

type StarsLayerProps = {
    opacity: number | MotionValue<number>;
    /** If true, show shooting/comet streaks. If false, only static stars. */
    shooting?: boolean;
    density?: number;
    minDelay?: number;
    maxDelay?: number;
    /** If true, disable the entire layer (respects reduced motion). */
    disabled?: boolean;
};

/**
 * Stars layer component with optional shooting stars (comets)
 *
 * Renders two sublayers:
 * 1. Static stars with twinkling effect (always present when opacity > 0)
 * 2. Shooting stars/comets (optional, enabled during Last Third of night)
 *
 * Dynamically loaded to avoid SSR/CSR mismatches with random star positions.
 * Respects reduced motion preferences when disabled.
 *
 * @param {StarsLayerProps} props - Component props
 * @param {number | MotionValue<number>} props.opacity - Layer opacity (0-1)
 * @param {boolean} [props.shooting=true] - Enable shooting star streaks
 * @param {number} [props.density=0.0002] - Star density (stars per pixel)
 * @param {number} [props.minDelay=1200] - Minimum delay between comets (ms)
 * @param {number} [props.maxDelay=4200] - Maximum delay between comets (ms)
 * @param {boolean} [props.disabled] - Disable entire layer (for accessibility)
 *
 * @example
 * ```tsx
 * const { starsOpacity } = useSky(scrollProgress, timeline);
 * const cometsEnabled = pNow >= timeline.lastThird;
 *
 * return (
 *   <StarsLayer
 *     opacity={starsOpacity}
 *     shooting={cometsEnabled}
 *     density={0.0002}
 *   />
 * );
 * ```
 */
export const StarsLayer = memo<StarsLayerProps>(
    ({ opacity, shooting = true, density = 0.0002, minDelay = 1200, maxDelay = 4200, disabled }) => {
        if (disabled) {
            return null;
        }

        return (
            <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ opacity }}>
                {shooting && (
                    <ShootingStars
                        starColor="#9E00FF"
                        trailColor="#2EB9DF"
                        minSpeed={10}
                        maxSpeed={30}
                        minDelay={minDelay}
                        maxDelay={maxDelay}
                        starWidth={20}
                        starHeight={2}
                    />
                )}
                <StarsBackground
                    starDensity={density}
                    allStarsTwinkle
                    twinkleProbability={0.7}
                    minTwinkleSpeed={0.5}
                    maxTwinkleSpeed={1}
                />
            </motion.div>
        );
    },
);
StarsLayer.displayName = 'StarsLayer';
