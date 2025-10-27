'use client';

import { motion } from 'motion/react';
import { memo } from 'react';
import { ShootingStars } from '@/components/aceternity/shooting-stars';
import { StarsBackground } from '@/components/aceternity/stars-background';

type SkyBackgroundProps = { skyColor: string };

export const SkyBackground = memo<SkyBackgroundProps>(({ skyColor }) => (
    <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundColor: skyColor }} />
));

SkyBackground.displayName = 'SkyBackground';

type StarsLayerProps = { opacity: number };

export const StarsLayer = memo<StarsLayerProps>(({ opacity }) => (
    <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ opacity }}>
        <ShootingStars
            starColor="#9E00FF"
            trailColor="#2EB9DF"
            minSpeed={10}
            maxSpeed={30}
            minDelay={1200}
            maxDelay={4200}
            starWidth={20}
            starHeight={2}
        />
        <StarsBackground
            starDensity={0.0002}
            allStarsTwinkle={true}
            twinkleProbability={0.7}
            minTwinkleSpeed={0.5}
            maxTwinkleSpeed={1}
        />
    </motion.div>
));

StarsLayer.displayName = 'StarsLayer';

type LightRaysProps = { opacity: number };

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

type FajrGradientProps = { opacity: number };

export const FajrGradient = memo<FajrGradientProps>(({ opacity }) => (
    <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
            background:
                'linear-gradient(to top, rgba(255, 200, 80, 0.95) 0%, rgba(255, 180, 90, 0.85) 12%, rgba(255, 160, 100, 0.75) 22%, rgba(240, 160, 120, 0.6) 32%, rgba(180, 150, 140, 0.45) 45%, rgba(120, 130, 160, 0.3) 60%, transparent 78%)',
            opacity,
        }}
    />
));

FajrGradient.displayName = 'FajrGradient';

type SunProps = { x: number; y: number; opacity: number; color: { r: number; g: number; b: number } };

export const Sun = memo<SunProps>(({ x, y, opacity, color }) => (
    <div
        className="pointer-events-none absolute z-30 h-20 w-20 rounded-full"
        style={{
            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
            boxShadow: `0 0 60px 20px rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`,
            left: `${x}%`,
            opacity,
            top: `${y}%`,
            transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
            willChange: 'transform, opacity',
        }}
    />
));

Sun.displayName = 'Sun';

type MoonProps = { x: number; y: number; opacity: number };

export const Moon = memo<MoonProps>(({ x, y, opacity }) => (
    <div
        className="pointer-events-none absolute z-30 h-16 w-16 rounded-full bg-gray-200"
        style={{
            boxShadow: '0 0 40px 15px rgba(200, 200, 220, 0.3)',
            left: `${x}%`,
            opacity,
            top: `${y}%`,
            transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
            willChange: 'transform, opacity',
        }}
    />
));

Moon.displayName = 'Moon';

export const RadialGradientOverlay = memo(() => (
    <div className="absolute inset-0 z-15 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)]" />
));

RadialGradientOverlay.displayName = 'RadialGradientOverlay';
