import { explanationsMetadata } from '@/config/seo';
import { ExplanationsClient } from './client';

export const metadata = explanationsMetadata;

export default function ExplanationsPage() {
    return <ExplanationsClient />;
}
