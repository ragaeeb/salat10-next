import type { Metadata } from 'next';

import { YearlyClient } from './yearly-client';
import { resolveInitialYear } from './utils';

export const metadata: Metadata = {
    description: 'Browse the yearly prayer timetable with ease.',
    title: 'Yearly Prayer Timetable',
};

export type YearlyPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function YearlyPage({ searchParams }: YearlyPageProps) {
    const resolvedParams = (await searchParams) ?? undefined;
    const initialYear = resolveInitialYear(resolvedParams);
    return <YearlyClient initialYear={initialYear} />;
}
