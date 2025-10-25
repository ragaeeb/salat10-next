'use client';

import { useCallback, useMemo, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PeriodNavigator } from '@/components/timetable/period-navigator';
import { PrayerLineChart } from '@/components/timetable/graph/prayer-line-chart';
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
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

    const monthParam = clampMonth(parseInteger(searchParams.get('month')) ?? initialMonth);
    const yearParam = parseInteger(searchParams.get('year')) ?? initialYear;

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

    const handleOptionsChange = useCallback(
        (options: { event: string; label: string }[], defaultEvent: string | null) => {
            setEventOptions(options);
            setSelectedEvent((previous) => {
                if (previous && options.some((option) => option.event === previous)) {
                    return previous;
                }
                return defaultEvent ?? null;
            });
        },
        [],
    );

    const handleEventChange = useCallback((event: string) => {
        setSelectedEvent(event);
    }, []);

    if (!hydrated) {
        return (
            <div className="space-y-6">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-[60vh] min-h-[320px] w-full animate-pulse rounded-md bg-muted/40" />
            </div>
        );
    }

    const addon =
        eventOptions.length > 0 ? (
            <div className="flex items-center gap-2">
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
            </div>
        ) : null;

    return (
        <div className="space-y-6">
            <PeriodNavigator label={schedule?.label ?? ''} onNavigate={handleNavigate} addon={addon} />
            <div className="flex h-[60vh] min-h-[320px] w-full">
                <PrayerLineChart
                    schedule={schedule}
                    className="h-full w-full"
                    selectedEvent={selectedEvent ?? undefined}
                    onSelectedEventChange={handleEventChange}
                    onOptionsChange={handleOptionsChange}
                />
            </div>
        </div>
    );
}
