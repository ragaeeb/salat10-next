import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextRequest } from 'next/server';
import { POST, processAnalyticsEvents, updatePresenceData, validatePresenceData } from './route';

// Mock redis module
const mockRedis = {
    exec: mock(async () => []),
    expire: mock((_key: string, _ttl: number) => mockRedis),
    hset: mock((_key: string, _data: Record<string, unknown>) => mockRedis),
    incr: mock((_key: string) => mockRedis),
    pipeline: mock(() => mockRedis),
    zadd: mock((_key: string, _data: { member: string; score: number }) => mockRedis),
};

mock.module('@/lib/redis', () => ({
    REDIS_KEYS: {
        activePresence: 'presence:active',
        pageView: (path: string) => `analytics:pageviews:${path}`,
        presence: (sessionId: string) => `presence:${sessionId}`,
    },
    REDIS_TTL: { presence: 300 },
    redis: mockRedis,
}));

describe('route', () => {
    const originalConsoleError = console.error;
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
        console.error = mock(() => {});
        process.env.NODE_ENV = 'development';
    });

    afterAll(() => {
        console.error = originalConsoleError;
        process.env.NODE_ENV = originalEnv;
    });

    beforeEach(() => {
        // Reset mocks
        mockRedis.exec.mockClear();
        mockRedis.expire.mockClear();
        mockRedis.hset.mockClear();
        mockRedis.incr.mockClear();
        mockRedis.pipeline.mockClear();
        mockRedis.zadd.mockClear();
    });

    describe('validatePresenceData', () => {
        it('should accept valid presence data', () => {
            const presence = { lastSeen: Date.now(), lat: 43.65, lon: -79.38, page: '/home', sessionId: 'test-123' };
            const result = validatePresenceData(presence);
            expect(result.valid).toBe(true);
        });

        it('should reject missing session ID', () => {
            const presence = { lastSeen: Date.now(), lat: 43.65, lon: -79.38, page: '/home', sessionId: '' };
            const result = validatePresenceData(presence);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Session ID required');
        });

        it('should reject invalid latitude type', () => {
            const presence = {
                lastSeen: Date.now(),
                lat: 'invalid' as any,
                lon: -79.38,
                page: '/home',
                sessionId: 'test',
            };
            const result = validatePresenceData(presence);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid coordinates');
        });

        it('should reject latitude out of range', () => {
            const presence = { lastSeen: Date.now(), lat: 91, lon: -79.38, page: '/home', sessionId: 'test' };
            const result = validatePresenceData(presence);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Latitude out of range');
        });

        it('should reject longitude out of range', () => {
            const presence = { lastSeen: Date.now(), lat: 43.65, lon: 181, page: '/home', sessionId: 'test' };
            const result = validatePresenceData(presence);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Longitude out of range');
        });

        it('should reject NaN values', () => {
            const presence = { lastSeen: Date.now(), lat: Number.NaN, lon: -79.38, page: '/home', sessionId: 'test' };
            const result = validatePresenceData(presence);
            expect(result.valid).toBe(false);
        });
    });

    describe('processAnalyticsEvents', () => {
        it('should not process empty array', async () => {
            await processAnalyticsEvents([]);
            expect(mockRedis.pipeline).not.toHaveBeenCalled();
        });

        it('should increment pageview counters', async () => {
            const events = [
                { path: '/home', timestamp: Date.now(), type: 'pageview' as const },
                { path: '/about', timestamp: Date.now(), type: 'pageview' as const },
            ];

            await processAnalyticsEvents(events);

            expect(mockRedis.pipeline).toHaveBeenCalled();
            expect(mockRedis.incr).toHaveBeenCalledTimes(2);
            expect(mockRedis.exec).toHaveBeenCalled();
        });

        it('should ignore non-pageview events', async () => {
            const events = [{ path: 'button_click', timestamp: Date.now(), type: 'event' as const }];

            await processAnalyticsEvents(events);

            expect(mockRedis.incr).not.toHaveBeenCalled();
        });

        it('should ignore pageviews without path', async () => {
            const events = [{ path: '', timestamp: Date.now(), type: 'pageview' as const }];

            await processAnalyticsEvents(events);

            expect(mockRedis.incr).not.toHaveBeenCalled();
        });
    });

    describe('updatePresenceData', () => {
        it('should store presence data with expiry', async () => {
            const presence = { lastSeen: Date.now(), lat: 43.65, lon: -79.38, page: '/home', sessionId: 'test-123' };

            await updatePresenceData(presence);

            expect(mockRedis.pipeline).toHaveBeenCalled();
            expect(mockRedis.hset).toHaveBeenCalledWith(
                expect.stringContaining('test-123'),
                expect.objectContaining({ lat: 43.65, lon: -79.38 }),
            );
            expect(mockRedis.expire).toHaveBeenCalled();
            expect(mockRedis.zadd).toHaveBeenCalled();
            expect(mockRedis.exec).toHaveBeenCalled();
        });

        it('should include optional location fields', async () => {
            const presence = {
                city: 'Toronto',
                country: 'Canada',
                lastSeen: Date.now(),
                lat: 43.65,
                lon: -79.38,
                page: '/home',
                sessionId: 'test-123',
                state: 'Ontario',
            };

            await updatePresenceData(presence);

            expect(mockRedis.hset).toHaveBeenCalledWith(
                expect.stringContaining('test-123'),
                expect.objectContaining({ city: 'Toronto', country: 'Canada', state: 'Ontario' }),
            );
        });
    });

    describe('POST', () => {
        it('should reject invalid origin', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const request = new NextRequest('http://localhost:3000/api/track', {
                body: JSON.stringify({}),
                headers: { origin: 'https://evil.com' },
                method: 'POST',
            });

            const response = await POST(request);

            process.env.NODE_ENV = originalEnv;

            expect(response.status).toBe(403);
        });

        it('should process analytics events', async () => {
            const request = new NextRequest('http://localhost:3000/api/track', {
                body: JSON.stringify({ events: [{ path: '/home', timestamp: Date.now(), type: 'pageview' }] }),
                headers: { origin: 'http://localhost:3000' },
                method: 'POST',
            });

            const response = await POST(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(mockRedis.pipeline).toHaveBeenCalled();
        });

        it('should process presence data', async () => {
            const request = new NextRequest('http://localhost:3000/api/track', {
                body: JSON.stringify({
                    presence: { lastSeen: Date.now(), lat: 43.65, lon: -79.38, page: '/home', sessionId: 'test' },
                }),
                headers: { origin: 'http://localhost:3000' },
                method: 'POST',
            });

            const response = await POST(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(mockRedis.hset).toHaveBeenCalled();
        });

        it('should reject invalid presence data', async () => {
            const request = new NextRequest('http://localhost:3000/api/track', {
                body: JSON.stringify({
                    presence: { lastSeen: Date.now(), lat: 43.65, lon: -79.38, page: '/home', sessionId: '' },
                }),
                headers: { origin: 'http://localhost:3000' },
                method: 'POST',
            });

            const response = await POST(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBeDefined();
        });

        it('should handle both events and presence', async () => {
            const request = new NextRequest('http://localhost:3000/api/track', {
                body: JSON.stringify({
                    events: [{ path: '/home', timestamp: Date.now(), type: 'pageview' }],
                    presence: { lastSeen: Date.now(), lat: 43.65, lon: -79.38, page: '/home', sessionId: 'test' },
                }),
                headers: { origin: 'http://localhost:3000' },
                method: 'POST',
            });

            const response = await POST(request);
            expect(response.status).toBe(200);
        });

        it('should return 500 on server error', async () => {
            mockRedis.exec.mockRejectedValueOnce('Redis error');

            const request = new NextRequest('http://localhost:3000/api/track', {
                body: JSON.stringify({ events: [{ path: '/home', timestamp: Date.now(), type: 'pageview' }] }),
                headers: { origin: 'http://localhost:3000' },
                method: 'POST',
            });

            const response = await POST(request);
            expect(response.status).toBe(500);
        });
    });
});
