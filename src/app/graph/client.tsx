'use client';

import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { PrayerLineChart } from '@/components/prayer-line-chart';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/constants';
import { useCalculationConfig } from '@/lib/prayer-utils';
import { formatDateRangeDisplay, generateScheduleLabel, updateDateRangeParams } from '@/lib/time';
import { cn } from '@/lib/utils';

export type GraphClientProps = { initialFrom: Date; initialTo: Date };

export function GraphClient({ initialFrom, initialTo }: GraphClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const config = useCalculationConfig();
    const selectId = useId();
    const [eventOptions, setEventOptions] = useState<{ event: string; label: string }[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(() => searchParams.get('event'));
    const pendingEventRef = useRef<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: initialFrom, to: initialTo });

    const eventParam = searchParams.get('event');

    const schedule = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return null;
        }

        const times = [];
        const current = new Date(dateRange.from);
        const end = new Date(dateRange.to);

        while (current <= end) {
            const result = daily(salatLabels, config, current);
            times.push(result);
            current.setDate(current.getDate() + 1);
        }

        return { dates: times, label: generateScheduleLabel(dateRange.from, dateRange.to) };
    }, [config, dateRange]);

    const handleDateRangeChange = useCallback(
        (newRange: DateRange | undefined) => {
            if (!newRange?.from || !newRange?.to) {
                return;
            }

            setDateRange(newRange);

            const params = updateDateRangeParams(searchParams, newRange.from, newRange.to);
            router.replace(`/graph?${params.toString()}`, { scroll: false });
        },
        [router, searchParams],
    );

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
                router.replace(`/graph?${params.toString()}`, { scroll: false });
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
                router.replace(`/graph?${params.toString()}`, { scroll: false });
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
            router.replace(`/graph?${params.toString()}`, { scroll: false });
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

    const dateRangeDisplay = formatDateRangeDisplay(dateRange);

    return (
        <div className="flex h-screen flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                        <Link href="/">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'min-w-[240px] justify-start text-left font-normal',
                                    !dateRange && 'text-muted-foreground',
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRangeDisplay}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                                autoFocus
                                mode="range"
                                defaultMonth={dateRange?.from ?? new Date()}
                                selected={dateRange}
                                onSelect={handleDateRangeChange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
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
