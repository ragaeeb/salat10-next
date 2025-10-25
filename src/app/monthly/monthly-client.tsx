'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PeriodNavigator } from '@/components/timetable/period-navigator';
import { PrayerTimetableTable } from '@/components/timetable/prayer-timetable-table';
import { Button } from '@/components/ui/button';
import { monthly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useCalculationConfig } from '@/hooks/use-calculation-config';

import { clampMonth, parseInteger } from './utils';

export type MonthlyClientProps = {
    initialMonth: number;
    initialYear: number;
};

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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <PeriodNavigator label={schedule?.label ?? ''} onNavigate={handleNavigate} />
                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                        <Link href="/">Home</Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href={graphHref}>View monthly graph</Link>
                    </Button>
                </div>
            </div>
            <PrayerTimetableTable schedule={schedule} timeZone={config.timeZone} />
        </div>
    );
}
