import { describe, expect, test } from 'bun:test';
import { Coordinates } from 'adhan';

import { buildCalculationContext } from '@/lib/explanation/context';
import { createParameters } from '@/lib/settings';

describe('calculation context', () => {
    test('includes astronomy, hijri, and input metadata', () => {
        const context = buildCalculationContext({
            address: 'Ottawa, Canada',
            coordinates: new Coordinates(45.3506, -75.793),
            date: new Date('2024-03-11T17:00:00Z'),
            parameters: createParameters({ fajrAngle: 15, ishaAngle: 15, ishaInterval: 0, method: 'NorthAmerica' }),
            timeZone: 'America/Toronto',
        });

        expect(context.inputs.address).toBe('Ottawa, Canada');
        expect(context.inputs.timeZone).toBe('America/Toronto');
        expect(context.inputs.timezoneLabel).toBe('EDT');
        expect(context.julian.day).toBeCloseTo(2460380.5);
        expect(context.hijri.islamic.monthName).toBe('Ramaḍān');
        expect(Math.abs(context.safeties.finalFajr.getTime() - context.prayerTimes.fajr.getTime())).toBeLessThan(60000);
    });
});
