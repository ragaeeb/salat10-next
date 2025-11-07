import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { NextRequest } from 'next/server';
import { fetchGeocode, GET, validateAddress, validateCoordinates } from './route';

describe('geocode route', () => {
    const originalConsoleError = console.error;

    beforeAll(() => {
        console.error = mock(() => {});
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    describe('validateAddress', () => {
        it('should reject null address', () => {
            const result = validateAddress(null);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Address parameter is required');
        });

        it('should reject empty address', () => {
            const result = validateAddress('   ');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Address parameter is required');
        });

        it('should reject address over 200 characters', () => {
            const longAddress = 'a'.repeat(201);
            const result = validateAddress(longAddress);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Address too long (max 200 characters)');
        });

        it('should reject script tag', () => {
            const result = validateAddress('<script>alert("xss")</script>');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid address format');
        });

        it('should reject javascript protocol', () => {
            const result = validateAddress('javascript:alert(1)');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid address format');
        });

        it('should reject event handlers', () => {
            const result = validateAddress('onclick=alert(1)');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid address format');
        });

        it('should reject data URLs', () => {
            const result = validateAddress('data:text/html,<script>alert(1)</script>');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid address format');
        });

        it('should accept valid address', () => {
            const result = validateAddress('Toronto, Canada');
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });

    describe('validateCoordinates', () => {
        it('should accept valid coordinates', () => {
            expect(validateCoordinates(43.65, -79.38)).toBe(true);
        });

        it('should accept boundary values', () => {
            expect(validateCoordinates(-90, -180)).toBe(true);
            expect(validateCoordinates(90, 180)).toBe(true);
        });

        it('should reject latitude out of range', () => {
            expect(validateCoordinates(91, 0)).toBe(false);
            expect(validateCoordinates(-91, 0)).toBe(false);
        });

        it('should reject longitude out of range', () => {
            expect(validateCoordinates(0, 181)).toBe(false);
            expect(validateCoordinates(0, -181)).toBe(false);
        });

        it('should reject non-finite values', () => {
            expect(validateCoordinates(Number.NaN, 0)).toBe(false);
            expect(validateCoordinates(0, Number.POSITIVE_INFINITY)).toBe(false);
        });
    });

    describe('fetchGeocode', () => {
        const originalFetch = global.fetch;

        afterEach(() => {
            global.fetch = originalFetch;
        });

        it('should return coordinates for valid address', async () => {
            global.fetch = mock(async () =>
                Response.json([{ display_name: 'Toronto, Ontario, Canada', lat: '43.6532', lon: '-79.3832' }]),
            ) as any;

            const result = await fetchGeocode('Toronto', 'test-key');
            expect(result).toEqual({ label: 'Toronto, Ontario, Canada', lat: 43.6532, lon: -79.3832 });
        });

        it('should return error when location not found', async () => {
            global.fetch = mock(async () => Response.json([])) as any;

            const result = await fetchGeocode('InvalidLocation123', 'test-key');
            expect(result).toEqual({ error: 'Location not found', status: 404 });
        });

        it('should return error when API returns non-ok status', async () => {
            global.fetch = mock(async () => new Response(null, { status: 500 })) as any;

            const result = await fetchGeocode('Toronto', 'test-key');
            expect(result).toEqual({ error: 'Geocoding service error', status: 502 });
        });

        it('should return error when coordinates are invalid', async () => {
            global.fetch = mock(async () => Response.json([{ display_name: 'Invalid', lat: '999', lon: '0' }])) as any;

            const result = await fetchGeocode('Test', 'test-key');
            expect(result).toEqual({ error: 'Invalid coordinates from service', status: 502 });
        });

        it('should handle timeout', async () => {
            global.fetch = mock(
                async () =>
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
                    }),
            ) as any;

            const result = await fetchGeocode('Toronto', 'test-key');
            expect(result).toEqual({ error: 'Request timeout', status: 504 });
        });

        it('should handle network error', async () => {
            global.fetch = mock(async () => {
                throw new Error('Network error');
            }) as any;

            const result = await fetchGeocode('Toronto', 'test-key');
            expect(result).toEqual({ error: 'Service error', status: 500 });
        });

        it('should handle undefined display_name', async () => {
            global.fetch = mock(async () => Response.json([{ lat: '43.6532', lon: '-79.3832' }])) as any;

            const result = await fetchGeocode('Toronto', 'test-key');
            expect(result).toEqual({ lat: 43.6532, lon: -79.3832 });
        });
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
            const request = new NextRequest('http://localhost:3000/api/geocode?address=Toronto', {
                headers: { origin: 'https://evil.com' },
            });

            const response = await GET(request);
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
            expect(data.error).toBe('Service unavailable');
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

            const corsHeader = response.headers.get('Access-Control-Allow-Origin');
            expect(corsHeader).toBe('http://localhost:3000');
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
