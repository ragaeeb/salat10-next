'use client';

import { getDeviceMetadata, getOrCreateUserId } from './fingerprint';

const STORAGE_KEY = process.env.NEXT_PUBLIC_ANALYTICS_STORAGE_KEY ?? 'salat10_analytics';
const BATCH_SIZE = Number.parseInt(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE ?? '10', 10);
const SESSION_ID_KEY = process.env.NEXT_PUBLIC_SESSION_ID_KEY ?? 'salat10_session_id';
const FLUSH_INTERVAL = Number.parseInt(process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL ?? '3600000', 10);
const LAST_FLUSH_KEY = 'salat10_last_flush';
const MIN_FLUSH_DELAY = 5000;

/**
 * Analytics event structure for tracking pageviews and custom events
 */
type AnalyticsEvent = { type: 'pageview' | 'event'; path: string; timestamp: number; data?: Record<string, unknown> };

/**
 * User presence data including location and metadata
 */
type PresenceData = { lat: number; lon: number; page: string; city?: string; state?: string; country?: string };

/**
 * Get or create a unique session ID for this browser tab
 * Uses sessionStorage to ensure uniqueness per tab
 *
 * @returns Session ID string in format "timestamp-random"
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
 * Get the timestamp of the last analytics flush
 * Used for rate limiting to prevent excessive API calls
 *
 * @returns Unix timestamp in milliseconds, or 0 if never flushed
 */
function getLastFlushTime(): number {
    if (typeof window === 'undefined') {
        return 0;
    }

    try {
        const stored = localStorage.getItem(LAST_FLUSH_KEY);
        return stored ? Number.parseInt(stored, 10) : 0;
    } catch {
        return 0;
    }
}

/**
 * Update the last flush timestamp
 *
 * @param timestamp - Unix timestamp in milliseconds
 */
function setLastFlushTime(timestamp: number): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(LAST_FLUSH_KEY, timestamp.toString());
    } catch {
        // Ignore errors
    }
}

/**
 * Retrieve pending analytics events from localStorage
 * Events are batched locally before being sent to the server
 *
 * @returns Array of pending events, or empty array if none or error
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
 *
 * @param events - Array of events to persist
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
 * Send batched events to the analytics API
 * Includes rate limiting to prevent excessive requests
 *
 * @param events - Array of events to send
 * @param presence - Optional presence data to include
 */
export async function flushEvents(events: AnalyticsEvent[], presence?: PresenceData): Promise<void> {
    if (events.length === 0 && !presence) {
        return;
    }

    const now = Date.now();
    const lastFlush = getLastFlushTime();
    if (now - lastFlush < MIN_FLUSH_DELAY && events.length < BATCH_SIZE) {
        return;
    }

    try {
        const userId = getOrCreateUserId();
        const sessionId = getOrCreateSessionId();
        const metadata = getDeviceMetadata();

        const payload: Record<string, unknown> = { metadata, userId };

        if (events.length > 0) {
            payload.events = events;
        }

        if (presence) {
            payload.presence = { ...presence, lastSeen: now, sessionId };
        }

        await fetch('/api/track', {
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });

        if (events.length > 0) {
            setPendingEvents([]);
        }
        setLastFlushTime(now);
    } catch (error) {
        console.error('Failed to send analytics', error);
    }
}

/**
 * Add an event to the pending queue
 * Automatically flushes when batch size is reached
 *
 * @param event - Analytics event to queue
 */
async function queueEvent(event: AnalyticsEvent): Promise<void> {
    const pending = getPendingEvents();
    pending.push(event);
    setPendingEvents(pending);

    if (pending.length >= BATCH_SIZE) {
        await flushEvents(pending);
    }
}

/**
 * Track a page view
 *
 * @param path - URL path that was viewed
 */
export async function trackPageView(path: string): Promise<void> {
    const event: AnalyticsEvent = { path, timestamp: Date.now(), type: 'pageview' };
    await queueEvent(event);
}

/**
 * Track a custom event with optional data
 *
 * @param name - Event name/identifier
 * @param data - Optional event metadata
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
 * Update user presence with location and page information
 * Immediately flushes to server for real-time online map
 *
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @param page - Current page path
 * @param city - Optional city name
 * @param state - Optional state/province name
 * @param country - Optional country name
 */
export async function updatePresence(
    lat: number,
    lon: number,
    page: string,
    city?: string,
    state?: string,
    country?: string,
): Promise<void> {
    const presence: PresenceData = {
        lat,
        lon,
        page,
        ...(city && { city }),
        ...(state && { state }),
        ...(country && { country }),
    };

    const pending = getPendingEvents();
    await flushEvents(pending, presence);
}

/**
 * Force flush all pending events to server
 * Useful for page unload or manual sync
 */
export async function flushPendingEvents(): Promise<void> {
    const pending = getPendingEvents();
    if (pending.length > 0) {
        await flushEvents(pending);
    }
}

/**
 * Initialize analytics system with periodic flush interval
 * Should be called once on app initialization
 */
export function initAnalytics(): void {
    if (typeof window === 'undefined') {
        return;
    }

    setInterval(() => {
        const events = getPendingEvents();
        if (events.length > 0) {
            flushEvents(events).catch(console.error);
        }
    }, FLUSH_INTERVAL);
}
