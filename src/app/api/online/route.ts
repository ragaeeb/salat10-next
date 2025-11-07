import { type NextRequest, NextResponse } from 'next/server';
import { REDIS_KEYS, REDIS_TTL, redis } from '@/lib/redis';
import { createCorsHeaders, validateOrigin } from '@/lib/security';

type OnlineUser = { lat: number; lon: number; page: string; lastSeen: number };

export async function GET(request: NextRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!validateOrigin(origin, referer)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
        // Get active session IDs from sorted set
        const cutoff = Date.now() - REDIS_TTL.presence * 1000;
        const sessionIds = await redis.zrangebyscore<string[]>(REDIS_KEYS.activePresence, cutoff, '+inf');

        if (!sessionIds || sessionIds.length === 0) {
            return NextResponse.json({ users: [] }, { headers: createCorsHeaders(origin) });
        }

        // Fetch presence data for each session
        const pipeline = redis.pipeline();
        for (const sessionId of sessionIds) {
            pipeline.hgetall(REDIS_KEYS.presence(sessionId));
        }

        const results = await pipeline.exec();
        const users: OnlineUser[] = [];

        for (const result of results) {
            if (result && typeof result === 'object' && 'lat' in result && 'lon' in result) {
                const user = result as { lat: string; lon: string; page?: string; lastSeen: string };
                users.push({
                    lastSeen: Number.parseInt(user.lastSeen, 10),
                    lat: Number.parseFloat(user.lat),
                    lon: Number.parseFloat(user.lon),
                    page: user.page || 'unknown',
                });
            }
        }

        return NextResponse.json({ users }, { headers: createCorsHeaders(origin) });
    } catch (error) {
        console.error('Online users fetch error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
