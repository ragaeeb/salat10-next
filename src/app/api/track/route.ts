import { type NextRequest, NextResponse } from 'next/server';
import { REDIS_KEYS, REDIS_TTL, redis } from '@/lib/redis';
import { createCorsHeaders, validateOrigin } from '@/lib/security';

type AnalyticsEvent = { type: 'pageview' | 'event'; path: string; timestamp: number; data?: Record<string, unknown> };

type PresenceData = { sessionId: string; lat: number; lon: number; page: string; lastSeen: number };

type TrackRequest = { events?: AnalyticsEvent[]; presence?: PresenceData };

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Validate origin
    if (!validateOrigin(origin, referer)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        const body: TrackRequest = await request.json();

        // Handle batched analytics events
        if (body.events && Array.isArray(body.events)) {
            const pipeline = redis.pipeline();

            for (const event of body.events) {
                if (event.type === 'pageview' && event.path) {
                    // Increment page view counter
                    const key = REDIS_KEYS.pageView(event.path);
                    pipeline.incr(key);
                }
            }

            await pipeline.exec();
        }

        // Handle presence update (real-time)
        if (body.presence) {
            const { sessionId, lat, lon, page, lastSeen } = body.presence;

            if (!sessionId || typeof lat !== 'number' || typeof lon !== 'number') {
                return NextResponse.json({ error: 'Invalid presence data' }, { status: 400 });
            }

            const pipeline = redis.pipeline();

            // Store presence data
            const presenceKey = REDIS_KEYS.presence(sessionId);
            pipeline.hset(presenceKey, { lastSeen, lat, lon, page });
            pipeline.expire(presenceKey, REDIS_TTL.presence);

            // Add to active presence sorted set
            pipeline.zadd(REDIS_KEYS.activePresence, { member: sessionId, score: lastSeen });

            await pipeline.exec();
        }

        return NextResponse.json({ success: true }, { headers: createCorsHeaders(origin) });
    } catch (error) {
        console.error('Track error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
