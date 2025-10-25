import type { Metadata } from 'next';

import { MonthlyClient } from './monthly-client';
import { resolveInitialMonthYear } from './utils';

export const metadata: Metadata = {
    description: 'Explore the monthly prayer timetable with easily navigable schedules.',
    title: 'Monthly Prayer Timetable',
};

export type MonthlyPageProps = { searchParams?: Record<string, string | string[] | undefined> };

export default function MonthlyPage({ searchParams }: MonthlyPageProps) {
    const initial = resolveInitialMonthYear(searchParams);

    return <MonthlyClient initialMonth={initial.month} initialYear={initial.year} />;
}
