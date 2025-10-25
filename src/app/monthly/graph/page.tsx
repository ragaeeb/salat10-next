import type { Metadata } from 'next';

import { resolveInitialMonthYear } from '../utils';
import { MonthlyGraphClient } from './monthly-graph-client';

export const metadata: Metadata = {
    description: 'Visualize the monthly prayer timetable as a smooth line chart.',
    title: 'Monthly Prayer Graph',
};

export type MonthlyGraphPageProps = {
    searchParams?:
        | Record<string, string | string[] | undefined>
        | Promise<Record<string, string | string[] | undefined>>;
};

export default async function MonthlyGraphPage({ searchParams }: MonthlyGraphPageProps) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const initial = resolveInitialMonthYear(resolvedParams);

    return <MonthlyGraphClient initialMonth={initial.month} initialYear={initial.year} />;
}
