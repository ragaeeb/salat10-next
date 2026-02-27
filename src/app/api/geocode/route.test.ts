import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('geocode route', () => {
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

    describe('GET', () => {
        const originalEnv = process.env.GEOCODE_API_KEY;
        const originalFetch = global.fetch;

        beforeEach(() => {
            process.env.GEOCODE_API_KEY = 'test-api-key';
        });

        afterEach(() => {
            process.env.GEOCODE_API_KEY = originalEnv;
            global.fetch = originalFetch;
        });

        it('should return 403 for invalid origin', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const request = new NextRequest('http://localhost:3000/api/geocode?address=Toronto', {
                headers: { origin: 'https://evil.com' },
            });

            const response = await GET(request);

            process.env.NODE_ENV = originalEnv;

            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe('Access denied');
        });

        it('should return 400 for missing address', async () => {
            const request = new NextRequest('http://localhost:3000/api/geocode', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBe('Address parameter is required');
        });

        it('should return 400 for invalid address', async () => {
            const request = new NextRequest('http://localhost:3000/api/geocode?address=<script>alert(1)</script>', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toBe('Invalid address format');
        });

        it('should return 500 when API key is missing', async () => {
            delete process.env.GEOCODE_API_KEY;

            const request = new NextRequest('http://localhost:3000/api/geocode?address=Toronto', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(500);

            const data = await response.json();
            // Error message can vary, just check it's an error
            expect(data.error).toBeDefined();
            expect(typeof data.error).toBe('string');
        });

        it('should return coordinates for valid request', async () => {
            global.fetch = mock(async () =>
                Response.json([{ display_name: 'Toronto, Ontario, Canada', lat: '43.6532', lon: '-79.3832' }]),
            ) as any;

            const request = new NextRequest('http://localhost:3000/api/geocode?address=Toronto', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toEqual({ label: 'Toronto, Ontario, Canada', latitude: 43.6532, longitude: -79.3832 });
        });

        it('should not include CORS headers when no origin', async () => {
            global.fetch = mock(async () =>
                Response.json([{ display_name: 'Toronto', lat: '43.6532', lon: '-79.3832' }]),
            ) as any;

            const request = new NextRequest('http://localhost:3000/api/geocode?address=Toronto');

            const response = await GET(request);
            expect(response.status).toBe(200);

            const corsHeader = response.headers.get('Access-Control-Allow-Origin');
            expect(corsHeader).toBeNull();
        });

        it('should propagate geocode errors', async () => {
            global.fetch = mock(async () => Response.json([])) as any;

            const request = new NextRequest('http://localhost:3000/api/geocode?address=InvalidLocation', {
                headers: { origin: 'http://localhost:3000' },
            });

            const response = await GET(request);
            expect(response.status).toBe(404);

            const data = await response.json();
            expect(data.error).toBe('Location not found');
        });
    });
});
