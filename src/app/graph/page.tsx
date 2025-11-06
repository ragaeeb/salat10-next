'use client';

import { parseInitialDateRange } from '@/lib/time';
import { GraphClient } from './graph-client';

export type GraphPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function GraphPage({ searchParams }: GraphPageProps) {
    const resolvedParams = (await searchParams) ?? undefined;
    const { from, to } = parseInitialDateRange(resolvedParams);

    return <GraphClient initialFrom={from} initialTo={to} />;
}
