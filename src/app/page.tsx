import { homeMetadata } from '@/config/seo';
import { PrayerTimesPageClient } from './client';

export const metadata = homeMetadata;

export default function PrayerTimesPage() {
    return <PrayerTimesPageClient />;
}
