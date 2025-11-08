'use client';

import { getDeviceMetadata, getOrCreateUserId } from './fingerprint';

const STORAGE_KEY = process.env.NEXT_PUBLIC_ANALYTICS_STORAGE_KEY ?? 'salat10_analytics';
const BATCH_SIZE = Number.parseInt(process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE ?? '10', 10);
const SESSION_ID_KEY = process.env.NEXT_PUBLIC_SESSION_ID_KEY ?? 'salat10_session_id';
const FLUSH_INTERVAL = Number.parseInt(process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL ?? '3600000', 10);
const LAST_FLUSH_KEY = 'salat10_last_flush';
const MIN_FLUSH_DELAY = 5000; // Don't flush more than once per 5 seconds

type AnalyticsEvent = { type: 'pageview' | 'event'; path: string; timestamp: number; data?: Record<string, unknown> };

type PresenceData = { lat: number; lon: number; page: string; city?: string; state?: string; country?: string };

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

export async function flushEvents(events: AnalyticsEvent[], presence?: PresenceData): Promise<void> {
    if (events.length === 0 && !presence) {
        return;
    }

    // Rate limiting: don't flush too frequently
    const now = Date.now();
    const lastFlush = getLastFlushTime();
    if (now - lastFlush < MIN_FLUSH_DELAY && events.length < BATCH_SIZE) {
        return; // Wait for batch size or longer delay
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

async function queueEvent(event: AnalyticsEvent): Promise<void> {
    const pending = getPendingEvents();
    pending.push(event);
    setPendingEvents(pending);

    if (pending.length >= BATCH_SIZE) {
        await flushEvents(pending);
    }
}

export async function trackPageView(path: string): Promise<void> {
    const event: AnalyticsEvent = { path, timestamp: Date.now(), type: 'pageview' };
    await queueEvent(event);
}

export async function trackEvent(name: string, data?: Record<string, unknown>): Promise<void> {
    const event: AnalyticsEvent = {
        path: name,
        timestamp: Date.now(),
        type: 'event',
        ...(data !== undefined && { data }),
    };
    await queueEvent(event);
}

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

    // Combine with any pending events
    const pending = getPendingEvents();
    await flushEvents(pending, presence);
}

export async function flushPendingEvents(): Promise<void> {
    const pending = getPendingEvents();
    if (pending.length > 0) {
        await flushEvents(pending);
    }
}

export function initAnalytics(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Don't flush on init - let the first updatePresence handle it
    // This avoids the double-call issue

    // Set up periodic flush
    setInterval(() => {
        const events = getPendingEvents();
        if (events.length > 0) {
            flushEvents(events).catch(console.error);
        }
    }, FLUSH_INTERVAL);
}
