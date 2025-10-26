'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { PrayerLineChart } from '@/components/timetable/graph/prayer-line-chart';
import { Button } from '@/components/ui/button';
import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { yearly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';

import { parseInteger } from '../utils';

export type YearlyGraphClientProps = { initialYear: number };

export function YearlyGraphClient({ initialYear }: YearlyGraphClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { config, hydrated } = useCalculationConfig();
    const selectId = useId();
    const [eventOptions, setEventOptions] = useState<{ event: string; label: string }[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(() => searchParams.get('event'));
    const pendingEventRef = useRef<string | null>(null);

    const yearParam = parseInteger(searchParams.get('year')) ?? initialYear;
    const year = yearParam ?? initialYear;
    const eventParam = searchParams.get('event');

    const targetDate = useMemo(() => new Date(year, 0, 1), [year]);

    const schedule = useMemo(() => {
        if (!hydrated) {
            return null;
        }
        return yearly(salatLabels, config, targetDate);
    }, [hydrated, config, targetDate]);

    const handleNavigate = useCallback(
        (direction: 1 | -1) => {
            const nextYear = year + direction;
            const params = new URLSearchParams(searchParams.toString());
            params.set('year', nextYear.toString());
            router.push(`/yearly/graph?${params.toString()}`, { scroll: false });
        },
        [router, searchParams, year],
    );

    const timetableHref = useMemo(() => {
        const params = new URLSearchParams();
        params.set('year', year.toString());
        return `/yearly?${params.toString()}`;
    }, [year]);

    const handleOptionsChange = useCallback(
        (options: { event: string; label: string }[], _defaultEvent: string | null) => {
            setEventOptions(options);
        },
        [],
    );

    const handleEventChange = useCallback(
        (event: string) => {
            pendingEventRef.current = event;
            setSelectedEvent(event);
            const current = searchParams.get('event');
            const params = new URLSearchParams(searchParams.toString());
            params.set('event', event);
            if (current !== event) {
                router.replace(`/yearly/graph?${params.toString()}`, { scroll: false });
            }
        },
        [router, searchParams],
    );

    useEffect(() => {
        if (!eventOptions.length) {
            if (selectedEvent !== null) {
                setSelectedEvent(null);
            }
            if (eventParam) {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('event');
                router.replace(`/yearly/graph?${params.toString()}`, { scroll: false });
            }
            return;
        }

        if (eventParam && eventOptions.some((option) => option.event === eventParam)) {
            if (pendingEventRef.current && pendingEventRef.current !== eventParam) {
                return;
            }
            pendingEventRef.current = null;
            setSelectedEvent((previous) => (previous === eventParam ? previous : eventParam));
            return;
        }

        if (pendingEventRef.current) {
            return;
        }

        const fallback = eventOptions[0]?.event ?? null;
        if (!fallback) {
            setSelectedEvent(null);
            return;
        }

        if (fallback !== selectedEvent) {
            pendingEventRef.current = fallback;
            setSelectedEvent(fallback);
        }
        if (eventParam !== fallback) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('event', fallback);
            router.replace(`/yearly/graph?${params.toString()}`, { scroll: false });
        }
    }, [eventOptions, eventParam, router, searchParams, selectedEvent]);

    if (!hydrated) {
        return (
            <div className="flex h-screen flex-col gap-6 p-6">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-full w-full flex-1 animate-pulse rounded-md bg-muted/40" />
            </div>
        );
    }

    const eventSelect =
        eventOptions.length > 0 ? (
            <>
                <label className="sr-only" htmlFor={selectId}>
                    Select prayer or event
                </label>
                <select
                    id={selectId}
                    value={selectedEvent ?? eventOptions[0]?.event ?? ''}
                    onChange={(event) => handleEventChange(event.target.value)}
                    className="inline-flex h-9 min-w-[8rem] items-center rounded-md border border-input bg-background px-3 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    {eventOptions.map((option) => (
                        <option key={option.event} value={option.event}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </>
        ) : null;

    return (
        <div className="flex h-screen flex-col gap-6 p-6">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                        <Link href="/">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                        <Link href={timetableHref}>Timetable</Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(-1)} aria-label="Previous year">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="min-w-[120px] text-center font-semibold text-foreground text-lg sm:text-xl">
                        Year {schedule?.label ?? year}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(1)} aria-label="Next year">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {eventSelect}
            </div>
            <div className="min-h-0 flex-1">
                <PrayerLineChart
                    schedule={schedule}
                    className="h-full w-full"
                    selectedEvent={selectedEvent ?? null}
                    onSelectedEventChange={handleEventChange}
                    onOptionsChange={handleOptionsChange}
                />
            </div>
        </div>
    );
}
