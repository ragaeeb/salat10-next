'use client';

import { useCallback, useEffect, useMemo, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PeriodNavigator } from '@/components/timetable/period-navigator';
import { PrayerLineChart } from '@/components/timetable/graph/prayer-line-chart';
import { Button } from '@/components/ui/button';
import { monthly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useCalculationConfig } from '@/hooks/use-calculation-config';

import { clampMonth, parseInteger } from '../utils';

export type MonthlyGraphClientProps = {
    initialMonth: number;
    initialYear: number;
};

export function MonthlyGraphClient({ initialMonth, initialYear }: MonthlyGraphClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { config, hydrated } = useCalculationConfig();
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
        if (!hydrated) {
            return null;
        }
        return monthly(salatLabels, config, targetDate);
    }, [hydrated, config, targetDate]);

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

    if (!hydrated) {
        return (
            <div className="grid min-h-[70vh] grid-rows-[auto,1fr] gap-6">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-full min-h-[360px] w-full animate-pulse rounded-md bg-muted/40" />
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
                    className="inline-flex h-9 min-w-[8rem] items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    {eventOptions.map((option) => (
                        <option key={option.event} value={option.event}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </>
        ) : null;

    const addon = (
        <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
                <Link href={timetableHref}>Monthly timetable</Link>
            </Button>
            {eventSelect}
        </div>
    );

    return (
        <div className="grid min-h-[70vh] grid-rows-[auto,1fr] gap-6">
            <PeriodNavigator label={schedule?.label ?? ''} onNavigate={handleNavigate} addon={addon} />
            <PrayerLineChart
                schedule={schedule}
                className="h-full min-h-[360px] w-full"
                selectedEvent={selectedEvent ?? null}
                onSelectedEventChange={handleEventChange}
                onOptionsChange={handleOptionsChange}
            />
        </div>
    );
}
