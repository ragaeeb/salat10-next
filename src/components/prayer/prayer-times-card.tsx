'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuroraText } from '@/components/magicui/aurora-text';
import { Meteors } from '@/components/magicui/meteors';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PrayerTiming = { event: string; isFard: boolean; label: string; time: string; value: Date };

export type PrayerTimesCardProps = {
    activeLabel: string;
    activeEvent: string | null;
    addressLabel: string;
    dateLabel: string;
    hijriLabel: string;
    istijaba?: boolean;
    locationDetail: string;
    methodLabel: string;
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
        <AuroraText className="font-semibold text-2xl md:text-3xl">{label}</AuroraText>
    ) : (
        <span className="font-semibold text-2xl md:text-3xl">{label}</span>
    );

    const timeContent = active ? (
        <AuroraText className="font-semibold text-2xl md:text-3xl">{time}</AuroraText>
    ) : (
        <span className="font-semibold text-2xl md:text-3xl">{time}</span>
    );

    return (
        <li
            className={cn(
                'flex items-center justify-between rounded-2xl px-4 py-3 text-foreground transition-colors',
                active ? 'bg-white/10 shadow-lg ring-2 ring-primary/40 backdrop-blur dark:ring-white/40' : 'bg-white/5',
                isFard ? 'font-semibold' : 'font-medium',
            )}
        >
            {labelContent}
            {timeContent}
        </li>
    );
};

const Countdown = ({ timings }: { timings: PrayerTiming[] }) => {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        const updateCountdown = () => {
            const now = Date.now();
            const nextPrayer = timings.find((t) => t.value.getTime() > now);

            if (!nextPrayer) {
                setCountdown('');
                return;
            }

            const diff = nextPrayer.value.getTime() - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${hours}h ${minutes}m ${seconds}s until ${nextPrayer.label}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [timings]);

    if (!countdown) {
        return null;
    }

    return (
        <div className="flex items-center justify-center rounded-2xl bg-white/5 px-4 py-3 text-foreground/70 text-sm">
            <span className="font-medium">{countdown}</span>
        </div>
    );
};

/**
 * Displays the daily schedule with navigation.
 */
export function PrayerTimesCard({
    activeLabel,
    activeEvent,
    addressLabel,
    dateLabel,
    hijriLabel,
    istijaba,
    locationDetail,
    methodLabel,
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
            <Meteors className="pointer-events-none" number={18} />
            <div className="relative z-10 space-y-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-foreground/80 text-xs uppercase tracking-wide">
                        <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-foreground">
                            {dateLabel}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-foreground/90">
                            {hijriLabel}
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-foreground/70">
                            {methodLabel}
                        </span>
                    </div>
                    {istijaba ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-4 py-1 font-medium text-emerald-100 text-sm">
                            Special hour of Istijaba — make extra duʿāʾ
                        </span>
                    ) : null}
                </header>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
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
                            <span className="inline-flex max-w-[min(60vw,14rem)] cursor-help truncate font-semibold text-foreground/80 text-sm sm:max-w-[18rem]">
                                {addressLabel}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm space-y-1 break-words text-left" sideOffset={8}>
                            <p className="font-semibold">{addressLabel}</p>
                            <p className="text-xs opacity-80">{locationDetail}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                    {timings.map((timing) => (
                        <PrayerTimeRow
                            key={timing.event}
                            active={timing.event === activeEvent}
                            isFard={timing.isFard}
                            label={timing.label}
                            time={timing.time}
                        />
                    ))}
                </ul>

                <Countdown timings={timings} />

                <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button asChild size="sm" variant="outline" className="border-white/30">
                        <Link href="/monthly">Monthly timetable</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-white/30">
                        <Link href="/yearly">Yearly timetable</Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/explanations">Explain today's calculations</Link>
                    </Button>
                </div>
            </div>
        </motion.section>
    );
}
