'use client';

const STORAGE_KEY = process.env.NEXT_PUBLIC_ANALYTICS_STORAGE_KEY ?? 'salat10_analytics';
const BATCH_SIZE = Number.parseInt(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE ?? '10', 10);
const SESSION_ID_KEY = process.env.NEXT_PUBLIC_SESSION_ID_KEY ?? 'salat10_session_id';
const FLUSH_INTERVAL = Number.parseInt(process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL ?? '3600000', 10); // 1 hour

type AnalyticsEvent = { type: 'pageview' | 'event'; path: string; timestamp: number; data?: Record<string, unknown> };

/**
 * Generate a unique session ID for presence tracking
 */
export function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        const stored = sessionStorage.getItem(SESSION_ID_KEY);
        if (stored) {
            return stored;
        }

        const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        sessionStorage.setItem(SESSION_ID_KEY, newId);
        return newId;
    } catch {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
}

/**
 * Get pending analytics events from localStorage
 */
export function getPendingEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save pending analytics events to localStorage
 */
export function setPendingEvents(events: AnalyticsEvent[]): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
        console.error('Failed to save analytics events', error);
    }
}

/**
 * Send batched events to server
 */
export async function flushEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) {
        return;
    }

    try {
        await fetch('/api/track', {
            body: JSON.stringify({ events }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });

        // Clear ALL events from storage after successful flush
        setPendingEvents([]);
    } catch (error) {
        console.error('Failed to send analytics', error);
        // Keep events in storage on failure for retry
    }
}

/**
 * Add event to queue and optionally flush
 */
async function queueEvent(event: AnalyticsEvent): Promise<void> {
    const pending = getPendingEvents();
    pending.push(event);
    setPendingEvents(pending);

    // Only flush if we've reached batch size
    if (pending.length >= BATCH_SIZE) {
        await flushEvents(pending);
    }
}

/**
 * Track a pageview (batched)
 */
export async function trackPageView(path: string): Promise<void> {
    const event: AnalyticsEvent = { path, timestamp: Date.now(), type: 'pageview' };
    await queueEvent(event);
}

/**
 * Track custom event (batched)
 */
export async function trackEvent(name: string, data?: Record<string, unknown>): Promise<void> {
    const event: AnalyticsEvent = {
        path: name,
        timestamp: Date.now(),
        type: 'event',
        ...(data !== undefined && { data }),
    };
    await queueEvent(event);
}

/**
 * Update presence (real-time, not batched)
 */
export async function updatePresence(lat: number, lon: number, page: string): Promise<void> {
    const sessionId = getOrCreateSessionId();

    try {
        await fetch('/api/track', {
            body: JSON.stringify({ presence: { lastSeen: Date.now(), lat, lon, page, sessionId } }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    } catch (error) {
        console.error('Failed to update presence', error);
    }
}

/**
 * Force flush all pending events (e.g., on page unload or init)
 */
export async function flushPendingEvents(): Promise<void> {
    const pending = getPendingEvents();
    if (pending.length > 0) {
        await flushEvents(pending);
    }
}

/**
 * Initialize analytics - flush old events on app load
 * Call this once on app mount
 */
export function initAnalytics(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Flush any pending events from previous sessions
    const pending = getPendingEvents();
    if (pending.length > 0) {
        flushEvents(pending).catch(console.error);
    }

    // Set up periodic flush
    setInterval(() => {
        const events = getPendingEvents();
        if (events.length > 0) {
            flushEvents(events).catch(console.error);
        }
    }, FLUSH_INTERVAL);
}
