'use client';

import { useCallback, useMemo } from 'react';
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
            <PeriodNavigator label={`Year ${schedule?.label ?? year}`} onNavigate={handleNavigate} />
            <PrayerLineChart schedule={schedule} />
        </div>
    );
}
