'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { PrayerTimetableTable } from '@/components/timetable/prayer-timetable-table';
import { Button } from '@/components/ui/button';
import { useCalculationConfig } from '@/hooks/use-calculation-config';
import { yearly } from '@/lib/calculator';
import { salatLabels } from '@/lib/salat-labels';

import { parseInteger } from './utils';

export type YearlyClientProps = { initialYear: number };

export function YearlyClient({ initialYear }: YearlyClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { config } = useCalculationConfig();

    const yearParam = parseInteger(searchParams.get('year')) ?? initialYear;
    const year = yearParam ?? initialYear;

    const targetDate = useMemo(() => new Date(year, 0, 1), [year]);

    const schedule = useMemo(() => {
        return yearly(salatLabels, config, targetDate);
    }, [config, targetDate]);

    const handleNavigate = useCallback(
        (direction: 1 | -1) => {
            const nextYear = year + direction;
            const params = new URLSearchParams(searchParams.toString());
            params.set('year', nextYear.toString());
            router.push(`/yearly?${params.toString()}`, { scroll: false });
        },
        [router, searchParams, year],
    );

    const graphHref = useMemo(() => {
        const params = new URLSearchParams();
        params.set('year', year.toString());
        return `/yearly/graph?${params.toString()}`;
    }, [year]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
                <Button asChild size="sm" variant="outline">
                    <Link href="/">Home</Link>
                </Button>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(-1)} aria-label="Previous year">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="min-w-[120px] text-center font-semibold text-foreground text-lg sm:text-xl">
                        Year {schedule?.label ?? year}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => handleNavigate(1)} aria-label="Next year">
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
