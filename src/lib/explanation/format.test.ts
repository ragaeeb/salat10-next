import { describe, expect, test } from 'bun:test';

import { formatAngle, formatDateInZone, formatMinutes, formatNumber, formatTimeInZone } from './format';

describe('format helpers', () => {
    const sample = new Date('2024-03-11T17:14:00Z');

    test('time and date formatting respects timezone', () => {
        expect(formatTimeInZone(sample, 'America/Toronto')).toBe('1:14 PM');
        expect(formatDateInZone(sample, 'America/Toronto')).toContain('Monday');
    });

    test('fall back gracefully when timezone is invalid', () => {
        const originalWarn = console.warn;
        console.warn = () => {};
        try {
            const fallback = formatTimeInZone(sample, 'Invalid/Zone');
            expect(typeof fallback).toBe('string');
        } finally {
            console.warn = originalWarn;
        }
    });

    test('numeric helpers add units', () => {
        expect(formatNumber(Math.PI, 3)).toBe('3.142');
        expect(formatAngle(23.5)).toBe('23.50°');
        expect(formatMinutes(90)).toBe('90.0 minutes');
    });
});
