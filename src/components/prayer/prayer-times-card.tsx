'use client';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, SearchIcon, TableIcon, TrendingUpIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AuroraText } from '@/components/magicui/aurora-text';
import { Meteors } from '@/components/magicui/meteors';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { FormattedTiming } from '@/lib/calculator';
import type { SalatEvent } from '@/lib/constants';
import { useCountdownRemaining } from '@/lib/prayer-utils';
import { cn } from '@/lib/utils';

/**
 * Props for the PrayerTimesCard component
 */
type PrayerTimesCardProps = {
    /** Currently active prayer event, if any */
    activeEvent: SalatEvent | null;
    /** Location address label for display */
    addressLabel: string;
    /** Optional countdown remaining string override (e.g., during simulation) */
    countdownRemaining?: string;
    /** Formatted date string (e.g., "Nov 8, 2025") */
    dateLabel: string;
    /** Hijri calendar date string */
    hijriLabel: string;
    /** Detailed location info (city, state, country) */
    locationDetail: string;
    /** Calculation method label */
    methodLabel: string;
    /** Whether the sky is past Maghrib, so the moon can show through the card */
    isAfterMaghrib?: boolean;
    /** Initial expanded state (defaults to false for compact view) */
    defaultExpanded?: boolean;
    /** Handler for navigating to next day */
    onNextDay: () => void;
    /** Handler for navigating to previous day */
    onPrevDay: () => void;
    /** Handler for resetting to today */
    onToday: () => void;
    /** Array of prayer times to display */
    timings: FormattedTiming[];
};

/**
 * Individual prayer time row with label and time
 *
 * @param props - Row configuration
 * @returns Prayer time list item with conditional highlighting
 */
const PrayerTimeRow = ({
    active,
    badge,
    label,
    time,
    isFard,
}: {
    /** Whether this is the currently active prayer */
    active: boolean;
    /** Optional badge label (e.g., "Current", "in 2h 15m") */
    badge?: string;
    /** Whether this is a fard prayer */
    isFard: boolean;
    /** Prayer name label */
    label: string;
    /** Formatted time string */
    time: string;
}) => {
    const labelContent = active ? (
        <AuroraText className="font-semibold text-lg text-white sm:text-xl">{label}</AuroraText>
    ) : (
        <span className="font-semibold text-lg sm:text-xl">{label}</span>
    );

    const timeContent = active ? (
        <AuroraText className="font-semibold text-lg text-white sm:text-xl">{time}</AuroraText>
    ) : (
        <span className="font-semibold text-lg sm:text-xl">{time}</span>
    );

    return (
        <li
            className={cn(
                'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-foreground transition-colors sm:rounded-2xl sm:px-4 sm:py-3',
                active ? 'bg-white/10 shadow-lg ring-2 ring-primary/40 backdrop-blur' : 'bg-white/5',
                isFard ? 'font-semibold' : 'font-medium',
            )}
        >
            <div className="flex items-center gap-2">
                {labelContent}
                {badge && (
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider',
                            active ? 'bg-primary/30 text-white' : 'bg-white/10 text-foreground/70',
                        )}
                    >
                        {badge}
                    </span>
                )}
            </div>
            {timeContent}
        </li>
    );
};

/**
 * Main prayer times display card with date navigation, compact/expanded modes, and quick actions.
 *
 * Features:
 * - Compact mode showing current event, next event (with countdown chip), and Hijri date ONLY
 * - Expandable full timetable view with active prayer highlighting (aurora effect)
 * - Gregorian and Hijri date display
 * - Day navigation (prev/today/next)
 * - Location and method information
 * - Quick links to trends, timetable, and explanations
 * - Meteor animation during last third of night
 *
 * @param props - Card configuration and handlers
 * @returns Animated card displaying prayer times and controls
 */
export function PrayerTimesCard({
    activeEvent,
    addressLabel,
    countdownRemaining: countdownOverride,
    dateLabel,
    defaultExpanded = false,
    hijriLabel,
    isAfterMaghrib = false,
    locationDetail,
    methodLabel,
    onNextDay,
    onPrevDay,
    onToday,
    timings,
}: PrayerTimesCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const liveCountdown = useCountdownRemaining();
    const countdownRemaining = countdownOverride !== undefined ? countdownOverride : liveCountdown;

    // Identify current and next prayer events for compact view
    const currentIndex = activeEvent ? timings.findIndex((t) => t.event === activeEvent) : -1;
    const currentTiming = currentIndex !== -1 ? timings[currentIndex] : timings[0];
    const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % timings.length : timings.length > 1 ? 1 : 0;
    const nextTiming = timings.length > 0 ? timings[nextIndex] : undefined;

    return (
        <section
            className={cn(
                'relative z-10 w-full overflow-hidden rounded-2xl border border-white/15 p-4 shadow-xl sm:rounded-3xl sm:p-6 sm:shadow-2xl',
                isAfterMaghrib ? 'bg-background/25 backdrop-blur-none' : 'bg-background/60 backdrop-blur-xl',
            )}
        >
            {activeEvent === 'lastThirdOfTheNight' && <Meteors className="pointer-events-none" number={18} />}
            <div className="relative z-10 space-y-4 sm:space-y-5">
                {isExpanded ? (
                    <>
                        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-wrap items-center gap-1.5 text-foreground/80 text-xs uppercase tracking-wide sm:gap-2">
                                <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-semibold text-[11px] text-foreground sm:px-3 sm:py-1 sm:text-xs">
                                    {hijriLabel}
                                </span>
                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-[11px] text-foreground/90 sm:px-3 sm:py-1 sm:text-xs">
                                    {dateLabel}
                                </span>
                                <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-medium text-[11px] text-foreground/70 sm:px-3 sm:py-1 sm:text-xs">
                                    {methodLabel}
                                </span>
                            </div>
                        </header>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <Button
                                    onClick={onPrevDay}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-white/30 px-2.5 text-foreground text-xs sm:px-3"
                                >
                                    <ChevronLeft className="mr-0.5 h-3.5 w-3.5 sm:mr-1 sm:h-4 sm:w-4" /> Previous
                                </Button>
                                <Button
                                    onClick={onToday}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 text-foreground/80 text-xs sm:px-3"
                                >
                                    Today
                                </Button>
                                <Button
                                    onClick={onNextDay}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-white/30 px-2.5 text-foreground text-xs sm:px-3"
                                >
                                    Next <ChevronRight className="ml-0.5 h-3.5 w-3.5 sm:ml-1 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="block max-w-[min(60vw,14rem)] cursor-help overflow-hidden text-ellipsis whitespace-nowrap font-medium text-foreground/80 text-xs sm:max-w-[18rem] sm:text-sm">
                                        {addressLabel}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm space-y-1 break-words text-left" sideOffset={8}>
                                    <p className="font-semibold">{addressLabel}</p>
                                    <p className="text-xs opacity-80">{locationDetail}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </>
                ) : (
                    <header className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-foreground/80 text-xs uppercase tracking-wide sm:gap-2">
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-semibold text-[11px] text-foreground sm:px-3 sm:py-1 sm:text-xs">
                                {hijriLabel}
                            </span>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="block max-w-[min(45vw,14rem)] cursor-help overflow-hidden text-ellipsis whitespace-nowrap font-medium text-foreground/80 text-xs sm:max-w-[18rem] sm:text-sm">
                                    {addressLabel}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm space-y-1 break-words text-left" sideOffset={8}>
                                <p className="font-semibold">{addressLabel}</p>
                                <p className="text-xs opacity-80">{locationDetail}</p>
                            </TooltipContent>
                        </Tooltip>
                    </header>
                )}

                {timings.length > 0 && (
                    <ul className={cn('grid gap-2 sm:gap-3', isExpanded && 'sm:grid-cols-2')}>
                        {isExpanded ? (
                            timings.map((timing) => (
                                <PrayerTimeRow
                                    key={timing.event}
                                    active={timing.event === activeEvent}
                                    isFard={timing.isFard}
                                    label={timing.label}
                                    time={timing.time}
                                />
                            ))
                        ) : (
                            <>
                                {currentTiming && (
                                    <PrayerTimeRow
                                        active={currentTiming.event === activeEvent}
                                        badge={currentTiming.event === activeEvent ? 'Current' : undefined}
                                        isFard={currentTiming.isFard}
                                        label={currentTiming.label}
                                        time={currentTiming.time}
                                    />
                                )}
                                {nextTiming && nextTiming !== currentTiming && (
                                    <PrayerTimeRow
                                        active={false}
                                        badge={countdownRemaining || 'Next'}
                                        isFard={nextTiming.isFard}
                                        label={nextTiming.label}
                                        time={nextTiming.time}
                                    />
                                )}
                            </>
                        )}
                    </ul>
                )}

                {timings.length > 2 && (
                    <div className="flex justify-center">
                        <Button
                            onClick={() => setIsExpanded((prev) => !prev)}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-foreground/80 text-xs hover:bg-white/10 hover:text-foreground"
                        >
                            {isExpanded ? (
                                <>
                                    Show Less <ChevronUp className="ml-1 h-3.5 w-3.5" />
                                </>
                            ) : (
                                <>
                                    Show All Prayers ({timings.length}) <ChevronDown className="ml-1 h-3.5 w-3.5" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 border-white/30 px-3 text-xs">
                        <Link href="/graph">
                            <TrendingUpIcon className="mr-1 h-3.5 w-3.5" />
                            View Trends
                        </Link>
                    </Button>

                    <Button asChild size="sm" variant="outline" className="h-8 border-white/30 px-3 text-xs">
                        <Link href="/timetable">
                            <TableIcon className="mr-1 h-3.5 w-3.5" />
                            Timetable
                        </Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 px-3 text-xs">
                        <Link href="/explanations">
                            <SearchIcon className="mr-1 h-3.5 w-3.5" /> Explain
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
