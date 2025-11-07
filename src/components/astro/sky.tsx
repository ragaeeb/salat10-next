import { type MotionValue, motion } from 'motion/react';
import { memo } from 'react';

type SkyBackgroundProps = { skyColor: string | MotionValue<string> };
export const SkyBackground = memo<SkyBackgroundProps>(({ skyColor }) => (
    <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: skyColor }} />
));
SkyBackground.displayName = 'SkyBackground';
