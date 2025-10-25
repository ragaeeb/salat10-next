'use client';

import { useCallback, useMemo, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PeriodNavigator } from '@/components/timetable/period-navigator';
import { PrayerLineChart } from '@/components/timetable/graph/prayer-line-chart';
import { yearly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useCalculationConfig } from '@/hooks/use-calculation-config';

import { parseInteger } from '../utils';

export type YearlyGraphClientProps = {
    initialYear: number;
};

export function YearlyGraphClient({ initialYear }: YearlyGraphClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { config, hydrated } = useCalculationConfig();
    const selectId = useId();
    const [eventOptions, setEventOptions] = useState<{ event: string; label: string }[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

    const yearParam = parseInteger(searchParams.get('year')) ?? initialYear;
    const year = yearParam ?? initialYear;

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
            <PeriodNavigator label={`Year ${schedule?.label ?? year}`} onNavigate={handleNavigate} addon={addon} />
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
