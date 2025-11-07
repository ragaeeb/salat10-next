import type { Metadata } from 'next';
import { SITE_URL } from '@/config/seo';
import { OnlineClient } from './client';

export const metadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/online` },
    description: 'See who is using Salat10 right now around the world. Real-time map of active users.',
    title: 'Users Online Now - Salat10',
};

export default function OnlinePage() {
    return <OnlineClient />;
}
