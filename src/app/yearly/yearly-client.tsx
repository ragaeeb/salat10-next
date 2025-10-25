'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PeriodNavigator } from '@/components/timetable/period-navigator';
import { PrayerTimetableTable } from '@/components/timetable/prayer-timetable-table';
import { yearly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';
import { useCalculationConfig } from '@/hooks/use-calculation-config';

import { parseInteger } from './utils';

export type YearlyClientProps = {
    initialYear: number;
};

export function YearlyClient({ initialYear }: YearlyClientProps) {
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
            router.push(`/yearly?${params.toString()}`, { scroll: false });
        },
        [router, searchParams, year],
    );

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
            <PeriodNavigator label={`Year ${schedule?.label ?? year}`} onNavigate={handleNavigate} />
            <PrayerTimetableTable schedule={schedule} timeZone={config.timeZone} />
        </div>
    );
}
