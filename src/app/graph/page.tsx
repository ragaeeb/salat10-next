import { graphMetadata } from '@/config/seo';
import { parseInitialDateRange } from '@/lib/time';
import { GraphClient } from './client';

export const metadata = graphMetadata;

export type GraphPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function GraphPage({ searchParams }: GraphPageProps) {
    const resolvedParams = (await searchParams) ?? undefined;
    const { from, to } = parseInitialDateRange(resolvedParams);

    return <GraphClient initialFrom={from} initialTo={to} />;
}
