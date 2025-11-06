import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { calculateQibla } from '@/lib/qibla';
import { usePrayerStore } from '@/store/usePrayerStore';
import { QiblaFinderClient } from './client';

export const metadata: Metadata = { description: 'Find the Qibla direction using AR', title: 'Qibla Finder - Salat10' };

/**
 * Qibla finder page
 * SSR: Validates coordinates and calculates Qibla bearing on server
 * Client: Handles camera and compass sensors
 */
export default function QiblaPage() {
    // Get coordinates from store (server-side access)
    const settings = usePrayerStore.getState().settings;
    console.log('settings', settings);

    // Validate coordinates
    const latitude = Number.parseFloat(settings.latitude);
    const longitude = Number.parseFloat(settings.longitude);
    const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    // Redirect to settings if no valid coordinates
    if (!hasValidCoordinates) {
        redirect('/settings');
    }

    // Calculate Qibla bearing on server
    const qiblaBearing = calculateQibla(latitude, longitude);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* Back button */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="icon"
                >
                    <Link aria-label="Go back" href="/">
                        <IconArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            {/* Client-side AR finder */}
            <QiblaFinderClient qiblaBearing={qiblaBearing} latitude={latitude} longitude={longitude} />
        </div>
    );
}
