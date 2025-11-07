'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { flushPendingEvents, initAnalytics, trackPageView, updatePresence } from '@/lib/analytics';
import { useHasValidCoordinates, useNumericSettings } from '@/store/usePrayerStore';

/**
 * Client-side analytics and presence tracking
 * Wraps the app to track page views and user presence
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hasValidCoordinates = useHasValidCoordinates();
    const { latitude, longitude } = useNumericSettings();

    // Initialize analytics on mount - flushes old events
    useEffect(() => {
        initAnalytics();
    }, []);

    // Track page views
    useEffect(() => {
        trackPageView(pathname);
    }, [pathname]);

    // Update presence once on mount (if coordinates available)
    useEffect(() => {
        if (hasValidCoordinates) {
            updatePresence(latitude, longitude, pathname);
        }
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
