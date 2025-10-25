import type { Metadata } from 'next';

import { MonthlyClient } from './monthly-client';
import { resolveInitialMonthYear } from './utils';

export const metadata: Metadata = {
    description: 'Explore the monthly prayer timetable with easily navigable schedules.',
    title: 'Monthly Prayer Timetable',
};

export type MonthlyPageProps = {
    searchParams?:
        | Record<string, string | string[] | undefined>
        | Promise<Record<string, string | string[] | undefined>>;
};

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const initial = resolveInitialMonthYear(resolvedParams);

    return <MonthlyClient initialMonth={initial.month} initialYear={initial.year} />;
}
