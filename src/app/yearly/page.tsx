import type { Metadata } from 'next';

import { YearlyClient } from './yearly-client';
import { resolveInitialYear } from './utils';

export const metadata: Metadata = {
    description: 'Browse the yearly prayer timetable with ease.',
    title: 'Yearly Prayer Timetable',
};

export type YearlyPageProps = {
    searchParams?:
        | Record<string, string | string[] | undefined>
        | Promise<Record<string, string | string[] | undefined>>;
};

export default async function YearlyPage({ searchParams }: YearlyPageProps) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const initialYear = resolveInitialYear(resolvedParams);
    return <YearlyClient initialYear={initialYear} />;
}
