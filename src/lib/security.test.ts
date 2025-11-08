import { describe, expect, it } from 'bun:test';
import { createCorsHeaders, validateOrigin } from './security';

describe('security', () => {
    describe('validateOrigin', () => {
        it('should accept allowed origin', () => {
            expect(validateOrigin('http://localhost:3000', null)).toBe(true);
        });

        it('should accept allowed referer', () => {
            expect(validateOrigin(null, 'http://localhost:3000/page')).toBe(true);
        });

        it('should reject unknown origin', () => {
            expect(validateOrigin('https://evil.com', null)).toBe(false);
        });

        it('should reject unknown referer', () => {
            expect(validateOrigin(null, 'https://evil.com/page')).toBe(false);
        });

        it('should accept production URL', () => {
            expect(validateOrigin('https://salaten.vercel.app', null)).toBe(true);
        });

        it('should allow missing headers in development', () => {
            const original = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            expect(validateOrigin(null, null)).toBe(true);

            process.env.NODE_ENV = original;
        });

        it('should reject missing headers in production', () => {
            const original = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            expect(validateOrigin(null, null)).toBe(false);

            process.env.NODE_ENV = original;
        });
    });

    describe('createCorsHeaders', () => {
        it('should create headers with origin', () => {
            const headers = createCorsHeaders('http://localhost:3000');
            expect(headers).toEqual({
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Origin': 'http://localhost:3000',
            });
        });

        it('should return empty headers without origin', () => {
            const headers = createCorsHeaders(null);
            expect(headers).toEqual({});
        });
    });
});
