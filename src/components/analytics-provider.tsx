'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { flushPendingEvents, initAnalytics, trackPageView, updatePresence } from '@/lib/analytics';
import { useHasValidCoordinates, useNumericSettings, useSettings } from '@/store/usePrayerStore';

/**
 * Client-side analytics and presence tracking provider
 * Wraps the app to track page views and user presence with location data
 *
 * Features:
 * - Automatic page view tracking on route changes
 * - Real-time presence updates with coordinates and location metadata
 * - Batched event flushing on page unload
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hasValidCoordinates = useHasValidCoordinates();
    const { latitude, longitude } = useNumericSettings();
    const settings = useSettings();

    // Initialize analytics on mount - flushes old events
    useEffect(() => {
        initAnalytics();
    }, []);

    // Track page views
    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    // Update presence once on mount (if coordinates available)
    // Includes city, state, country metadata for online map labels
    useEffect(() => {
        if (hasValidCoordinates) {
            updatePresence(latitude, longitude, pathname, settings.city, settings.state, settings.country);
        }
    }, [hasValidCoordinates, latitude, longitude, pathname, settings.city, settings.state, settings.country]);

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
