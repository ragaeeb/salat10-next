// src/components/analytics-provider.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { flushPendingEvents, trackPageView, updatePresence } from '@/lib/analytics';
import { useHasValidCoordinates, useNumericSettings } from '@/store/usePrayerStore';

/**
 * Client-side analytics and presence tracking
 * Wraps the app to track page views and user presence
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hasValidCoordinates = useHasValidCoordinates();
    const { latitude, longitude } = useNumericSettings();

    // Track page views
    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    // Update presence every 2 minutes (if coordinates available)
    useEffect(() => {
        if (!hasValidCoordinates) {
            return;
        }

        const updateInterval = setInterval(
            () => {
                updatePresence(latitude, longitude, pathname);
            },
            2 * 60 * 1000,
        ); // 2 minutes

        // Initial update
        updatePresence(latitude, longitude, pathname);

        return () => clearInterval(updateInterval);
    }, [hasValidCoordinates, latitude, longitude, pathname]);

    // Flush pending events on page unload
    useEffect(() => {
        const handleUnload = () => {
            flushPendingEvents();
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    return <>{children}</>;
}
