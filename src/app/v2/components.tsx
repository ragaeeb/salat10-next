'use client';

import { type MotionValue, motion, useTransform } from 'motion/react';
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

type SkyBackgroundProps = { skyColor: string | MotionValue<string> };
export const SkyBackground = memo<SkyBackgroundProps>(({ skyColor }) => (
    <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: skyColor }} />
));
SkyBackground.displayName = 'SkyBackground';

type StarsLayerProps = {
    opacity: number | MotionValue<number>;
    density?: number;
    minDelay?: number;
    maxDelay?: number;
    disabled?: boolean;
};

export const StarsLayer = memo<StarsLayerProps>(
    ({ opacity, density = 0.0002, minDelay = 1200, maxDelay = 4200, disabled }) => {
        if (disabled) {
            return null;
        }

        return (
            <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ opacity }}>
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

type LightRaysProps = { opacity: number | MotionValue<number> };
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

type FajrGradientProps = { opacity: number | MotionValue<number> };
export const FajrGradient = memo<FajrGradientProps>(({ opacity }) => (
    <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
            background:
                'linear-gradient(to top, rgba(255, 205, 90, 0.95) 0%, rgba(255, 185, 95, 0.85) 12%, rgba(255, 165, 110, 0.75) 22%, rgba(240, 160, 120, 0.6) 32%, rgba(180, 150, 140, 0.45) 45%, rgba(120, 130, 160, 0.3) 60%, transparent 78%)',
            opacity,
        }}
    />
));
FajrGradient.displayName = 'FajrGradient';

/** Sunset gradient (similar to Fajr, reversed for dusk) */
type SunsetGradientProps = { opacity: number | MotionValue<number> };
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

type SunProps = {
    x: number | MotionValue<number>;
    y: number | MotionValue<number>;
    opacity: number | MotionValue<number>;
    color: { r: number | MotionValue<number>; g: number | MotionValue<number>; b: number | MotionValue<number> };
};
export const Sun = memo<SunProps>(({ x, y, opacity, color }) => (
    <motion.div
        className="pointer-events-none absolute z-30 h-20 w-20 rounded-full"
        style={{
            backgroundColor: useTransform(
                [color.r as MotionValue<number>, color.g as MotionValue<number>, color.b as MotionValue<number>],
                ([r, g, b]) => `rgb(${r}, ${g}, ${b})`,
            ),
            boxShadow: useTransform(
                [color.r as MotionValue<number>, color.g as MotionValue<number>, color.b as MotionValue<number>],
                ([r, g, b]) => `0 0 60px 20px rgba(${r}, ${g}, ${b}, 0.4)`,
            ),
            left: useTransform(x as MotionValue<number>, (vx) => `${vx}%`),
            opacity,
            top: useTransform(y as MotionValue<number>, (vy) => `${vy}%`),
            transform: 'translate(-50%, -50%) translate3d(0,0,0)',
            willChange: 'transform, opacity',
        }}
    />
));
Sun.displayName = 'Sun';

type MoonProps = {
    x: number | MotionValue<number>;
    y: number | MotionValue<number>;
    opacity: number | MotionValue<number>;
};
export const Moon = memo<MoonProps>(({ x, y, opacity }) => (
    <motion.div
        className="pointer-events-none absolute z-30 h-16 w-16 rounded-full bg-gray-200"
        style={{
            boxShadow: '0 0 40px 15px rgba(200, 200, 220, 0.3)',
            left: useTransform(x as MotionValue<number>, (vx) => `${vx}%`),
            opacity,
            top: useTransform(y as MotionValue<number>, (vy) => `${vy}%`),
            transform: 'translate(-50%, -50%) translate3d(0,0,0)',
            willChange: 'transform, opacity',
        }}
    />
));
Moon.displayName = 'Moon';

export const RadialGradientOverlay = memo(() => (
    <div className="absolute inset-0 z-15 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)]" />
));
RadialGradientOverlay.displayName = 'RadialGradientOverlay';
