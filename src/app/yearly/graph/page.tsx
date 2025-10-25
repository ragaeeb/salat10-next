import type { Metadata } from 'next';

import { resolveInitialYear } from '../utils';
import { YearlyGraphClient } from './yearly-graph-client';

export const metadata: Metadata = {
    description: 'Visualize the yearly trajectory of prayer times.',
    title: 'Yearly Prayer Graph',
};

export type YearlyGraphPageProps = {
    searchParams?:
        | Record<string, string | string[] | undefined>
        | Promise<Record<string, string | string[] | undefined>>;
};

export default async function YearlyGraphPage({ searchParams }: YearlyGraphPageProps) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const initialYear = resolveInitialYear(resolvedParams);
    return <YearlyGraphClient initialYear={initialYear} />;
}
