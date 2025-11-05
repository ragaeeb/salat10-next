import type { Metadata } from 'next';

import { parseInitialDateRange } from '@/lib/time';
import { TimetableClient } from './timetable-client';

export const metadata: Metadata = {
    description: 'View prayer timetables for any date range with detailed schedules.',
    title: 'Prayer Timetable',
};

export type TimetablePageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function TimetablePage({ searchParams }: TimetablePageProps) {
    const resolvedParams = (await searchParams) ?? undefined;
    const { from, to } = parseInitialDateRange(resolvedParams);

    return <TimetableClient initialFrom={from} initialTo={to} />;
}
