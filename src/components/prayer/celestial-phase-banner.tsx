'use client';

import { motion } from 'motion/react';
import { AuroraText } from '@/components/magicui/aurora-text';
import { type CelestialPhaseInfo, getCelestialPhase } from '@/lib/celestial-phases';
import { getLunarPhaseForCycle } from '@/lib/lunar';
import { cn } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

type CelestialPhaseBannerProps = {
    className?: string;
    lunarCycle: number;
    progress: number;
    timeline: Timeline | null;
};

/**
 * Eye-candy Astronomical Phase Banner
 *
 * Displays live celestial status with shimmering text and glow effects:
 * - Active solar phase (e.g. Dawn, Morning, Zenith, Afternoon, Sunset Shift, Dusk, Night, Tahajjud)
 * - Detailed astronomical description (e.g., "Zawāl — Sun has crossed the zenith meridian")
 * - Lunar phase badge with illumination percentage
 */
export function CelestialPhaseBanner({ className, lunarCycle, progress, timeline }: CelestialPhaseBannerProps) {
    if (!timeline) {
        return null;
    }

    const phase: CelestialPhaseInfo = getCelestialPhase(progress, timeline);
    const lunar = getLunarPhaseForCycle(lunarCycle);

    return (
        <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-white shadow-xl backdrop-blur-xl transition',
                phase.isTahajjud && 'border-purple-500/30 bg-purple-950/40',
                phase.isDay && 'border-amber-400/20 bg-black/30',
                className,
            )}
            initial={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        'relative flex h-3 w-3 items-center justify-center rounded-full',
                        phase.isTahajjud ? 'bg-purple-400' : phase.isDay ? 'bg-amber-400' : 'bg-cyan-400',
                    )}
                >
                    <span
                        className={cn(
                            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                            phase.isTahajjud ? 'bg-purple-400' : phase.isDay ? 'bg-amber-400' : 'bg-cyan-400',
                        )}
                    />
                </span>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{phase.emoji}</span>
                        <AuroraText className="font-bold text-sm text-white tracking-wide sm:text-base">
                            {phase.title}
                        </AuroraText>
                    </div>
                    <span className="text-[11px] text-white/70 sm:text-xs">{phase.detail}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 font-medium text-[11px] text-white/90 backdrop-blur">
                    {lunar.emoji} {lunar.name} ({Math.round(lunar.illuminatedFraction * 100)}%)
                </span>
            </div>
        </motion.div>
    );
}
