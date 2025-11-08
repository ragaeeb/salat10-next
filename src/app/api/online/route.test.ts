import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { NextRequest } from 'next/server';
import { fetchPresenceData, GET, getActiveSessionIds } from './route';

// Mock redis module
const mockRedis = {
    exec: mock(async () => []),
    hgetall: mock((key: string) => mockRedis),
    pipeline: mock(() => mockRedis),
    zrange: mock(async () => []),
};

mock.module('@/lib/redis', () => ({
    REDIS_KEYS: { activePresence: 'presence:active', presence: (sessionId: string) => `presence:${sessionId}` },
    REDIS_TTL: { presence: 300 },
    redis: mockRedis,
}));

describe('route', () => {
    const originalConsoleError = console.error;

    beforeAll(() => {
        console.error = mock(() => {});
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    describe('getActiveSessionIds', () => {
        it('should return empty array when no active sessions', async () => {
            mockRedis.zrange.mockResolvedValueOnce(null as any);

            const sessionIds = await getActiveSessionIds();
            expect(sessionIds).toEqual([]);
        });

        it('should return active session IDs', async () => {
            const mockIds = ['session-1', 'session-2', 'session-3'] as any;
            mockRedis.zrange.mockResolvedValueOnce(mockIds);

            const sessionIds = await getActiveSessionIds();
            expect(sessionIds).toEqual(mockIds);
            expect(mockRedis.zrange).toHaveBeenCalledWith(expect.any(String), expect.any(Number), '+inf', {
                byScore: true,
            });
        });
    });

    describe('fetchPresenceData', () => {
        it('should return empty array for no sessions', async () => {
            const users = await fetchPresenceData([]);
            expect(users).toEqual([]);
            expect(mockRedis.pipeline).not.toHaveBeenCalled();
        });

        it('should fetch presence data for sessions', async () => {
            const mockResults = [
                { lastSeen: '1234567890', lat: '43.65', lon: '-79.38', page: '/home' },
                { lastSeen: '1234567891', lat: '40.71', lon: '-74.01', page: '/about' },
            ];
            mockRedis.exec.mockResolvedValueOnce(mockResults as any);

            const users = await fetchPresenceData(['session-1', 'session-2']);

            expect(mockRedis.pipeline).toHaveBeenCalled();
            expect(mockRedis.hgetall).toHaveBeenCalledTimes(2);
            expect(users.length).toBe(2);
            expect(users[0]).toEqual({ lastSeen: 1234567890, lat: 43.65, lon: -79.38, page: '/home' });
        });

        it('should handle missing page field', async () => {
            const mockResults = [{ lastSeen: '1234567890', lat: '43.65', lon: '-79.38' }];
            mockRedis.exec.mockResolvedValueOnce(mockResults as any);

            const users = await fetchPresenceData(['session-1']);

            expect(users[0]!.page).toBe('unknown');
        });

        it('should include optional location fields', async () => {
            const mockResults = [
                {
                    city: 'Toronto',
                    country: 'Canada',
                    lastSeen: '1234567890',
                    lat: '43.65',
                    lon: '-79.38',
                    page: '/home',
                    state: 'Ontario',
                },
            ];
            mockRedis.exec.mockResolvedValueOnce(mockResults as any);

            const users = await fetchPresenceData(['session-1']);

            expect(users[0]).toMatchObject({ city: 'Toronto', country: 'Canada', state: 'Ontario' });
        });

        it('should skip invalid results', async () => {
            const mockResults = [{ lastSeen: '1234567890', lat: '43.65', lon: '-79.38' }, null, { invalid: 'data' }];
            mockRedis.exec.mockResolvedValueOnce(mockResults as any);

            const users = await fetchPresenceData(['s1', 's2', 's3']);

            expect(users.length).toBe(1);
        });
    });

    describe('GET', () => {
        it('should reject invalid origin', async () => {
            const request = new NextRequest('http://localhost:3000/api/online', {
                headers: { origin: 'https://evil.com' },
            });

            const response = await GET(request);
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe('Access denied');
        });

        it('should return empty users array when no sessions', async () => {
            mockRedis.zrange.mockResolvedValueOnce(null as any);

            const request = new NextRequest('http://localhost:3000/api/online', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.users).toEqual([]);
            expect(data.ttl).toBe(300);
        });

        it('should return online users', async () => {
            const mockSessionIds = ['session-1', 'session-2'];
            const mockPresenceData = [
                { lastSeen: '1234567890', lat: '43.65', lon: '-79.38', page: '/home' },
                { lastSeen: '1234567891', lat: '40.71', lon: '-74.01', page: '/about' },
            ];

            mockRedis.zrange.mockResolvedValueOnce(mockSessionIds as any);
            mockRedis.exec.mockResolvedValueOnce(mockPresenceData as any);

            const request = new NextRequest('http://localhost:3000/api/online', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.users.length).toBe(2);
            expect(data.users[0]).toMatchObject({ lat: 43.65, lon: -79.38, page: '/home' });
        });

        it('should include CORS headers', async () => {
            mockRedis.zrange.mockResolvedValueOnce([]);

            const request = new NextRequest('http://localhost:3000/api/online', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);

            const corsHeader = response.headers.get('Access-Control-Allow-Origin');
            expect(corsHeader).toBe('http://localhost:3000');
        });

        it('should return 500 on server error', async () => {
            mockRedis.zrange.mockRejectedValueOnce('Redis error');

            const request = new NextRequest('http://localhost:3000/api/online', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.error).toBe('Server error');
        });
    });
});
