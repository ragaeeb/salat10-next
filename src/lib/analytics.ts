'use client';

const STORAGE_KEY = 'salat10_analytics';
const BATCH_SIZE = 10; // Send after 10 events
const SESSION_ID_KEY = 'salat10_session_id';

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
function getPendingEvents(): AnalyticsEvent[] {
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
function setPendingEvents(events: AnalyticsEvent[]): void {
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
async function flushEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) {
        return;
    }

    try {
        await fetch('/api/track', {
            body: JSON.stringify({ events }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });

        // Clear flushed events from storage
        const remaining = getPendingEvents();
        const flushedTimestamps = new Set(events.map((e) => e.timestamp));
        const updated = remaining.filter((e) => !flushedTimestamps.has(e.timestamp));
        setPendingEvents(updated);
    } catch (error) {
        console.error('Failed to send analytics', error);
    }
}

/**
 * Track a pageview (batched)
 */
export async function trackPageView(path: string): Promise<void> {
    const event: AnalyticsEvent = { path, timestamp: Date.now(), type: 'pageview' };

    const pending = getPendingEvents();
    pending.push(event);
    setPendingEvents(pending);

    // Flush if we've reached batch size
    if (pending.length >= BATCH_SIZE) {
        await flushEvents(pending);
    }
}

/**
 * Track custom event (batched)
 */
export async function trackEvent(name: string, data?: Record<string, unknown>): Promise<void> {
    const event: AnalyticsEvent = { data, path: name, timestamp: Date.now(), type: 'event' };

    const pending = getPendingEvents();
    pending.push(event);
    setPendingEvents(pending);

    // Flush if we've reached batch size
    if (pending.length >= BATCH_SIZE) {
        await flushEvents(pending);
    }
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
 * Force flush all pending events (e.g., on page unload)
 */
export async function flushPendingEvents(): Promise<void> {
    const pending = getPendingEvents();
    if (pending.length > 0) {
        await flushEvents(pending);
    }
}
