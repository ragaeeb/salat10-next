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
