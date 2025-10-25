'use client';

import { useCallback, useMemo } from 'react';
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

    if (!hydrated) {
        return (
            <div className="space-y-6">
                <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
                <div className="h-[420px] w-full animate-pulse rounded-md bg-muted/40" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PeriodNavigator label={schedule?.label ?? ''} onNavigate={handleNavigate} />
            <PrayerLineChart schedule={schedule} />
        </div>
    );
}
