import { type NextRequest, NextResponse } from 'next/server';
import { REDIS_KEYS, REDIS_TTL, redis } from '@/lib/redis';
import { createCorsHeaders, validateOrigin } from '@/lib/security';

/**
 * Online user data with location information
 */
type OnlineUser = {
    lat: number;
    lon: number;
    page: string;
    lastSeen: number;
    city?: string;
    state?: string;
    country?: string;
};

/**
 * Presence record structure from Redis
 */
type PresenceRecord = {
    lat: string;
    lon: string;
    page?: string;
    lastSeen: string;
    city?: string;
    state?: string;
    country?: string;
};

/**
 * Get active session IDs from Redis sorted set
 *
 * @returns Array of session IDs active within TTL window
 */
export async function getActiveSessionIds(): Promise<string[]> {
    const cutoff = Date.now() - REDIS_TTL.presence * 1000;

    // Upstash Redis uses 'zrange' with BYSCORE option
    const sessionIds = await redis.zrange<string[]>(REDIS_KEYS.activePresence, cutoff, '+inf', { byScore: true });

    return sessionIds || [];
}

/**
 * Fetch presence data for given session IDs
 *
 * @param sessionIds - Array of session IDs to fetch
 * @returns Array of online user data
 */
export async function fetchPresenceData(sessionIds: string[]): Promise<OnlineUser[]> {
    if (sessionIds.length === 0) {
        return [];
    }

    const pipeline = redis.pipeline();
    for (const sessionId of sessionIds) {
        pipeline.hgetall(REDIS_KEYS.presence(sessionId));
    }

    const results = await pipeline.exec();
    const users: OnlineUser[] = [];

    for (const result of results) {
        if (result && typeof result === 'object' && 'lat' in result && 'lon' in result) {
            const user = result as PresenceRecord;
            users.push({
                lastSeen: Number.parseInt(user.lastSeen, 10),
                lat: Number.parseFloat(user.lat),
                lon: Number.parseFloat(user.lon),
                page: user.page || 'unknown',
                ...(user.city && { city: user.city }),
                ...(user.state && { state: user.state }),
                ...(user.country && { country: user.country }),
            });
        }
    }

    return users;
}

/**
 * GET /api/online
 * Returns list of currently online users with location data
 *
 * Returns:
 * - 200: { users: OnlineUser[], ttl: number }
 * - 403: Access denied (invalid origin)
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!validateOrigin(origin, referer)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        const sessionIds = await getActiveSessionIds();
        const users = await fetchPresenceData(sessionIds);

        return NextResponse.json({ ttl: REDIS_TTL.presence, users }, { headers: createCorsHeaders(origin) });
    } catch (error) {
        console.error('Online users fetch error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
