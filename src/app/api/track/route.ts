import { type NextRequest, NextResponse } from 'next/server';
import { REDIS_KEYS, REDIS_TTL, redis } from '@/lib/redis';
import { createCorsHeaders, validateOrigin } from '@/lib/security';

type AnalyticsEvent = { type: 'pageview' | 'event'; path: string; timestamp: number; data?: Record<string, unknown> };
type PresenceData = { sessionId: string; lat: number; lon: number; page: string; lastSeen: number };
type TrackRequest = { events?: AnalyticsEvent[]; presence?: PresenceData };

export function validatePresenceData(presence: PresenceData): { valid: boolean; error?: string } {
    if (!presence.sessionId) {
        return { error: 'Session ID required', valid: false };
    }
    if (typeof presence.lat !== 'number' || typeof presence.lon !== 'number') {
        return { error: 'Invalid coordinates', valid: false };
    }
    if (!Number.isFinite(presence.lat) || presence.lat < -90 || presence.lat > 90) {
        return { error: 'Latitude out of range', valid: false };
    }
    if (!Number.isFinite(presence.lon) || presence.lon < -180 || presence.lon > 180) {
        return { error: 'Longitude out of range', valid: false };
    }
    return { valid: true };
}

export async function processAnalyticsEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!Array.isArray(events) || events.length === 0) {
        return;
    }

    const pipeline = redis.pipeline();

    for (const event of events) {
        if (event.type === 'pageview' && event.path) {
            const key = REDIS_KEYS.pageView(event.path);
            pipeline.incr(key);
        }
    }

    await pipeline.exec();
}

export async function updatePresenceData(presence: PresenceData): Promise<void> {
    const pipeline = redis.pipeline();

    // Store presence data
    const presenceKey = REDIS_KEYS.presence(presence.sessionId);
    pipeline.hset(presenceKey, {
        lastSeen: presence.lastSeen,
        lat: presence.lat,
        lon: presence.lon,
        page: presence.page,
    });
    pipeline.expire(presenceKey, REDIS_TTL.presence);

    // Add to active presence sorted set
    pipeline.zadd(REDIS_KEYS.activePresence, { member: presence.sessionId, score: presence.lastSeen });

    await pipeline.exec();
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!validateOrigin(origin, referer)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        const body: TrackRequest = await request.json();

        // Handle batched analytics events
        if (body.events) {
            await processAnalyticsEvents(body.events);
        }

        // Handle presence update (real-time)
        if (body.presence) {
            const validation = validatePresenceData(body.presence);
            if (!validation.valid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            await updatePresenceData(body.presence);
        }

        return NextResponse.json({ success: true }, { headers: createCorsHeaders(origin) });
    } catch (error) {
        console.error('Track error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
