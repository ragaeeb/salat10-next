'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { PrayerLineChart } from '@/components/graph/prayer-line-chart';
import { Button } from '@/components/ui/button';
import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { monthly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { clampMonth, parseInteger } from '../utils';

export type MonthlyGraphClientProps = { initialMonth: number; initialYear: number };

export function MonthlyGraphClient({ initialMonth, initialYear }: MonthlyGraphClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { config } = useCalculationConfig();
    const selectId = useId();
    const [eventOptions, setEventOptions] = useState<{ event: string; label: string }[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(() => searchParams.get('event'));
    const pendingEventRef = useRef<string | null>(null);

    const monthParam = clampMonth(parseInteger(searchParams.get('month')) ?? initialMonth);
    const yearParam = parseInteger(searchParams.get('year')) ?? initialYear;
    const eventParam = searchParams.get('event');

    const month = monthParam ?? initialMonth;
    const year = yearParam ?? initialYear;

    const targetDate = useMemo(() => new Date(year, month - 1, 1), [month, year]);

    const schedule = useMemo(() => {
        return monthly(salatLabels, config, targetDate);
    }, [config, targetDate]);

    const handleNavigate = useCallback(
        (direction: 1 | -1) => {
            let nextMonth = month + direction;
            let nextYear = year;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear += 1;
            } else if (nextMonth < 1) {
                nextMonth = 12;
                nextYear -= 1;
            }
            const params = new URLSearchParams(searchParams.toString());
            params.set('month', nextMonth.toString());
            params.set('year', nextYear.toString());
            router.push(`/monthly/graph?${params.toString()}`, { scroll: false });
        },
        [month, router, searchParams, year],
    );

    const timetableHref = useMemo(() => {
        const params = new URLSearchParams();
        params.set('month', month.toString());
        params.set('year', year.toString());
        return `/monthly?${params.toString()}`;
    }, [month, year]);

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
                router.replace(`/monthly/graph?${params.toString()}`, { scroll: false });
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
                router.replace(`/monthly/graph?${params.toString()}`, { scroll: false });
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
            router.replace(`/monthly/graph?${params.toString()}`, { scroll: false });
        }
    }, [eventOptions, eventParam, router, searchParams, selectedEvent]);

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
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(-1)} aria-label="Previous month">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="min-w-[180px] text-center font-semibold text-foreground text-lg sm:text-xl">
                        {schedule?.label ?? ''}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(1)} aria-label="Next month">
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
