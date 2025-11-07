import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextRequest } from 'next/server';
import { fetchPresenceData, GET, getActiveSessionIds } from './route';

// Mock redis
const mockRedis = {
    exec: mock(async () => []),
    hgetall: mock((key: string) => mockRedis),
    pipeline: mock(() => mockRedis),
    zrange: mock(async () => []),
};

let originalRedis: any;

describe('online route', () => {
    beforeEach(async () => {
        const redisModule = await import('@/lib/redis');
        originalRedis = redisModule.redis;
        (redisModule as any).redis = mockRedis;

        // Reset mocks
        mockRedis.exec.mockClear();
        mockRedis.hgetall.mockClear();
        mockRedis.pipeline.mockClear();
        mockRedis.zrange.mockClear();
    });

    afterEach(async () => {
        const redisModule = await import('@/lib/redis');
        (redisModule as any).redis = originalRedis;
    });

    describe('getActiveSessionIds', () => {
        it('should return empty array when no active sessions', async () => {
            mockRedis.zrange.mockResolvedValueOnce(null);

            const sessionIds = await getActiveSessionIds();
            expect(sessionIds).toEqual([]);
        });

        it('should return active session IDs', async () => {
            const mockIds = ['session-1', 'session-2', 'session-3'];
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
            mockRedis.exec.mockResolvedValueOnce(mockResults);

            const users = await fetchPresenceData(['session-1', 'session-2']);

            expect(mockRedis.pipeline).toHaveBeenCalled();
            expect(mockRedis.hgetall).toHaveBeenCalledTimes(2);
            expect(users.length).toBe(2);
            expect(users[0]).toEqual({ lastSeen: 1234567890, lat: 43.65, lon: -79.38, page: '/home' });
        });

        it('should handle missing page field', async () => {
            const mockResults = [{ lastSeen: '1234567890', lat: '43.65', lon: '-79.38' }];
            mockRedis.exec.mockResolvedValueOnce(mockResults);

            const users = await fetchPresenceData(['session-1']);

            expect(users[0].page).toBe('unknown');
        });

        it('should skip invalid results', async () => {
            const mockResults = [{ lastSeen: '1234567890', lat: '43.65', lon: '-79.38' }, null, { invalid: 'data' }];
            mockRedis.exec.mockResolvedValueOnce(mockResults);

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
            mockRedis.zrange.mockResolvedValueOnce(null);

            const request = new NextRequest('http://localhost:3000/api/online', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.users).toEqual([]);
        });

        it('should return online users', async () => {
            const mockSessionIds = ['session-1', 'session-2'];
            const mockPresenceData = [
                { lastSeen: '1234567890', lat: '43.65', lon: '-79.38', page: '/home' },
                { lastSeen: '1234567891', lat: '40.71', lon: '-74.01', page: '/about' },
            ];

            mockRedis.zrange.mockResolvedValueOnce(mockSessionIds);
            mockRedis.exec.mockResolvedValueOnce(mockPresenceData);

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
            mockRedis.zrange.mockRejectedValueOnce(new Error('Redis error'));

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
