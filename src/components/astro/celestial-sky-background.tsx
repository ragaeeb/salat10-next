'use client';

import { type MotionValue, useTransform } from 'motion/react';
import { memo } from 'react';
import { Samaa } from '@/components/astro/samaa';
import { SkyBackground } from '@/components/astro/sky';
import { Qamar } from '@/components/qamar';
import { Shams } from '@/components/shams';
import { cn } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

type CelestialSkyBackgroundProps = {
    /** Additional CSS class names for outer container */
    className?: string | undefined;
    /** Lunar cycle fraction (0=new, 0.5=full) */
    lunarCycle: number;
    pNow: number;
    progress: MotionValue<number>;
    timeline: Timeline | null;
};

/**
 * Living Celestial Sky Background Component
 *
 * Renders the full animated celestial sky dome (matching salat10-ios Times tab):
 * - Dynamic sky gradient (night navy → Fajr dawn → bright blue daytime → Maghrib dusk)
 * - Animated Sun (`Shams`) tracking parabolic trajectory across daytime hours
 * - Animated Moon (`Qamar`) with craters and realistic lunar phases
 * - Star field (`StarsLayer`) with twinkling stars and shooting comets (Tahajjud time)
 * - Dawn horizon glow (`FajrGradient`) and sunrise light rays (`LightRays`)
 * - Sunset twilight gradient (`SunsetGradient`)
 * - Ambient vignette overlay (`RadialGradientOverlay`)
 *
 * Fixed in the background with `pointer-events-none` so foreground UI cards and controls
 * sit seamlessly above it.
 *
 * @param props - Component props
 * @returns Full-screen fixed living sky background
 */
export const CelestialSkyBackground = memo<CelestialSkyBackgroundProps>(function CelestialSkyBackground({
    className,
    lunarCycle,
    pNow,
    progress,
    timeline,
}) {
    const dayProgress = useTransform(progress, (value) => ((value % 1) + 1) % 1);
    const dayPNow = ((pNow % 1) + 1) % 1;

    if (!timeline) {
        return (
            <div className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}>
                <SkyBackground skyColor="rgba(5, 7, 16, 0.98)" />
            </div>
        );
    }

    return (
        <div aria-hidden="true" className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}>
            <Samaa currentDayIndex={0} pNow={dayPNow} scrollProgress={dayProgress} timeline={timeline} totalDays={1} />
            <Shams scrollProgress={dayProgress} timeline={timeline} />
            <Qamar lunarCycle={lunarCycle} scrollProgress={dayProgress} timeline={timeline} />
        </div>
    );
});

CelestialSkyBackground.displayName = 'CelestialSkyBackground';
