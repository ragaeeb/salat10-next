'use client';

import { ChevronLeft, ChevronRight, Loader2, Play } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import { AuroraText } from '@/components/ui/aurora-text';
import { Button } from '@/components/ui/button';
import { Meteors } from '@/components/ui/meteors';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PrayerTiming = { event: string; isFard: boolean; label: string; time: string; value: Date };

export type PrayerTimesCardProps = {
    activePrayer: string | null;
    addressLabel: string;
    dateLabel: string;
    explanationDisabled: boolean;
    explanationLoading: boolean;
    hijriLabel: string;
    istijaba?: boolean;
    locationDetail: string;
    methodLabel: string;
    onExplain: () => void;
    onNextDay: () => void;
    onPrevDay: () => void;
    onToday: () => void;
    timings: PrayerTiming[];
};

const PrayerTimeRow = ({
    active,
    label,
    time,
    isFard,
}: {
    active: boolean;
    isFard: boolean;
    label: string;
    time: string;
}) => {
    const labelContent = active ? (
        <AuroraText className="font-semibold text-2xl md:text-3xl" colors={['#ffffff', '#bcd7ff', '#80b8ff']}>
            {label}
        </AuroraText>
    ) : (
        <span className="font-semibold text-2xl md:text-3xl">{label}</span>
    );

    const timeContent = active ? (
        <AuroraText className="font-semibold text-2xl md:text-3xl" colors={['#ffffff', '#f2f2ff', '#d6e6ff']}>
            {time}
        </AuroraText>
    ) : (
        <span className="font-semibold text-2xl md:text-3xl">{time}</span>
    );

    return (
        <li
            className={cn(
                'flex items-center justify-between rounded-2xl px-4 py-3 text-foreground transition-colors',
                active ? 'bg-white/10 shadow-lg backdrop-blur' : 'bg-white/5',
                isFard ? 'font-semibold' : 'font-medium',
            )}
        >
            {labelContent}
            {timeContent}
        </li>
    );
};

/**
 * Displays the daily schedule with navigation and explanation triggers.
 */
export function PrayerTimesCard({
    activePrayer,
    addressLabel,
    dateLabel,
    explanationDisabled,
    explanationLoading,
    hijriLabel,
    istijaba,
    locationDetail,
    methodLabel,
    onExplain,
    onNextDay,
    onPrevDay,
    onToday,
    timings,
}: PrayerTimesCardProps) {
    return (
        <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-background/90 p-6 shadow-2xl backdrop-blur"
            initial={{ opacity: 0, y: 16 }}
        >
            <Meteors className="pointer-events-none bg-primary/60" number={18} />
            <div className="relative z-10 space-y-6">
                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1 text-foreground/80 text-sm uppercase tracking-wide">
                        <span>{dateLabel}</span>
                        <span>{hijriLabel}</span>
                        <span>{methodLabel}</span>
                    </div>
                    {istijaba ? (
                        <span className="rounded-full bg-emerald-500/20 px-4 py-1 font-medium text-emerald-100 text-sm">
                            Special hour of Istijaba — make extra duʿāʾ
                        </span>
                    ) : null}
                </header>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={onPrevDay}
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-foreground"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                        </Button>
                        <Button onClick={onToday} variant="ghost" size="sm" className="text-foreground/80">
                            Today
                        </Button>
                        <Button
                            onClick={onNextDay}
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-foreground"
                        >
                            Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="cursor-help font-semibold text-foreground/80 text-sm">{addressLabel}</span>
                        </TooltipTrigger>
                        <TooltipContent>{locationDetail}</TooltipContent>
                    </Tooltip>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                    {timings.map((timing) => (
                        <PrayerTimeRow
                            key={timing.event}
                            active={timing.event === activePrayer}
                            isFard={timing.isFard}
                            label={timing.label}
                            time={timing.time}
                        />
                    ))}
                </ul>

                <div className="flex flex-col gap-4 border-white/10 border-t pt-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-foreground/70 text-sm">
                        Need the full derivation? Walk through the astronomy, prophetic guidance, and safeguards step by
                        step.
                    </p>
                    <Button
                        disabled={explanationDisabled}
                        onClick={onExplain}
                        size="sm"
                        className="group flex items-center gap-2"
                    >
                        {explanationLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Explain today’s calculations
                    </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 text-foreground/70 text-xs">
                    <span>
                        <strong>Active prayer:</strong>{' '}
                        {activePrayer ? (timings.find((t) => t.event === activePrayer)?.label ?? '—') : '—'}
                    </span>
                    <span>
                        <Link
                            className="underline decoration-dotted underline-offset-4 hover:text-foreground"
                            href="/settings"
                        >
                            Update calculation settings
                        </Link>
                    </span>
                </div>
            </div>
        </motion.section>
    );
}
