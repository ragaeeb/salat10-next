import { describe, expect, test } from 'bun:test';

import { daily, monthly, yearly } from '@/lib/calculator';

const labels = {
    asr: 'Asr',
    dhuhr: 'Dhuhr',
    fajr: 'Fajr',
    isha: 'Isha',
    lastThirdOfTheNight: 'Last third',
    maghrib: 'Maghrib',
    middleOfTheNight: 'Half',
    sunrise: 'Sunrise',
    tarawih: 'Tarawih',
} as const;

describe('calculator helpers', () => {
    const calculation = {
        fajrAngle: 15,
        ishaAngle: 15,
        ishaInterval: 0,
        latitude: '45.3506',
        longitude: '-75.7930',
        method: 'NorthAmerica' as const,
        timeZone: 'America/Toronto',
    };

    test('daily result exposes ordered timings and active prayer', () => {
        const result = daily(labels, calculation, new Date('2024-03-11T14:30:00-05:00'));
        expect(result.timings[0]?.event).toBe('fajr');
        expect(result.currentPrayer).toBe('dhuhr');
    });

    test('monthly calendar spans every day in month', () => {
        const month = monthly(labels, calculation, new Date('2024-03-11T00:00:00-05:00'));
        expect(month.label).toBe('March 2024');
        expect(month.dates.length).toBeGreaterThanOrEqual(31);
    });

    test('yearly calendar spans leap year days', () => {
        const year = yearly(labels, calculation, new Date('2024-01-01T00:00:00-05:00'));
        expect(year.label).toBe(2024);
        expect(year.dates.length).toBe(366);
    });
});
