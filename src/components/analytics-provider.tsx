'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { flushPendingEvents, initAnalytics, trackPageView, updatePresence } from '@/lib/analytics';
import { useHasValidCoordinates, useNumericSettings, useSettings } from '@/store/usePrayerStore';

/**
 * Client-side analytics and presence tracking provider
 * Combines page views with presence updates to minimize API calls
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hasValidCoordinates = useHasValidCoordinates();
    const { latitude, longitude } = useNumericSettings();
    const settings = useSettings();

    // Initialize analytics on mount (no flush, just sets up interval)
    useEffect(() => {
        initAnalytics();
    }, []);

    // Track page view (queued, not sent immediately)
    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    // Update presence - this will flush pending events + send presence
    // Only done once per route change, combines with queued events
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
