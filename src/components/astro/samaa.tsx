import type { MotionValue } from 'motion';
import { useEffect, useState } from 'react';
import { FajrGradient } from '@/components/astro/fajr-sky';
import { LightRays } from '@/components/astro/light-rays';
import { RadialGradientOverlay } from '@/components/astro/radial-gradient';
import { SkyBackground } from '@/components/astro/sky';
import { StarsLayer } from '@/components/astro/stars';
import { SunsetGradient } from '@/components/astro/sunset-sky';
import { useSky } from '@/hooks/use-sky';
import { crossFade } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

type SamaaProps = {
    scrollProgress: MotionValue<number>;
    timeline: Timeline | null;
    pNow: number;
    totalDays: number;
    currentDayIndex: number;
};

export const Samaa = ({ scrollProgress, timeline, pNow, totalDays, currentDayIndex }: SamaaProps) => {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsMobile(window.matchMedia('(pointer:coarse)').matches);
    }, []);

    const { skyColor, starsOpacity, fajrGradientOpacity, sunsetGradientOpacity, lightRaysOpacity } = useSky(
        scrollProgress,
        timeline,
    );

    const { hasPrev, hasNext, topSeamStarsOpacity, bottomSeamFajrOpacity } = crossFade(
        pNow,
        currentDayIndex,
        totalDays,
    );

    // Stars/comets controls:
    // - Stars fade in from Isha to Midnight, fully on after (checklist #8, #9, #10)
    // - Comets only during Last 1/3 (checklist #11)
    const cometsEnabled = !!timeline && pNow >= timeline.lastThird;

    const STAR_DENSITY = isMobile ? 0.00005 : 0.0002;
    const SHOOT_MIN_DELAY = isMobile ? 2000 : 1200;
    const SHOOT_MAX_DELAY = isMobile ? 6000 : 4200;

    return (
        <>
            <SkyBackground skyColor={skyColor} />
            {/* Fajr & Sunset gradients */}
            <FajrGradient opacity={fajrGradientOpacity} />
            <SunsetGradient opacity={sunsetGradientOpacity} />

            {/* Star field (no comets until Last 1/3) */}
            {mounted && (
                <StarsLayer
                    opacity={starsOpacity}
                    shooting={cometsEnabled}
                    density={STAR_DENSITY}
                    minDelay={SHOOT_MIN_DELAY}
                    maxDelay={SHOOT_MAX_DELAY}
                />
            )}

            {/* Gentle rays near sunrise */}
            <LightRays opacity={lightRaysOpacity} />

            {/* Radial enhancement */}
            <RadialGradientOverlay />

            {/* Seam crossfades */}
            {hasPrev && mounted && (
                <StarsLayer
                    opacity={topSeamStarsOpacity}
                    shooting
                    density={STAR_DENSITY}
                    minDelay={SHOOT_MIN_DELAY}
                    maxDelay={SHOOT_MAX_DELAY}
                />
            )}
            {hasNext && <FajrGradient opacity={bottomSeamFajrOpacity * 0.8} />}
        </>
    );
};
