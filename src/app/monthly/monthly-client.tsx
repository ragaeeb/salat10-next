'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { PrayerTimetableTable } from '@/components/timetable/prayer-timetable-table';
import { Button } from '@/components/ui/button';
import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { monthly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';

import { clampMonth, parseInteger } from './utils';

export type MonthlyClientProps = { initialMonth: number; initialYear: number };

export function MonthlyClient({ initialMonth, initialYear }: MonthlyClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { config, hydrated } = useCalculationConfig();

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
            router.push(`/monthly?${params.toString()}`, { scroll: false });
        },
        [month, router, searchParams, year],
    );

    const graphHref = useMemo(() => {
        const params = new URLSearchParams();
        params.set('month', month.toString());
        params.set('year', year.toString());
        return `/monthly/graph?${params.toString()}`;
    }, [month, year]);

    if (!hydrated) {
        return (
            <div className="space-y-6">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-[400px] w-full animate-pulse rounded-md bg-muted/40" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
                <Button asChild size="sm" variant="outline">
                    <Link href="/">Home</Link>
                </Button>

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

                <Button asChild size="sm">
                    <Link href={graphHref}>View graph</Link>
                </Button>
            </div>
            <PrayerTimetableTable schedule={schedule} timeZone={config.timeZone} />
        </div>
    );
}
