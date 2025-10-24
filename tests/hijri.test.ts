import { describe, expect, test } from 'bun:test';

import { explainHijriConversion, writeIslamicDate } from '@/lib/hijri';

describe('Hijri conversion helpers', () => {
    test('produces known Ramadan date for March 11, 2024', () => {
        const sample = new Date('2024-03-11T00:00:00Z');
        const written = writeIslamicDate(0, sample);
        expect(written).toEqual({ date: 2, day: 'al-ʾIthnayn', month: 'Ramaḍān', year: 1445 });

        const explanation = explainHijriConversion(0, sample);
        expect(explanation.islamic.day).toBe(2);
        expect(explanation.islamic.monthName).toBe('Ramaḍān');
        expect(explanation.weekdayName).toBe(written.day);
        expect(explanation.offsetFromEpoch).toBeCloseTo(explanation.julianDayNumber + 1 - explanation.constants.epoch);
    });

    test('adjustments shift the day forward', () => {
        const today = new Date('2024-03-11T00:00:00Z');
        const todayHijri = writeIslamicDate(0, today);
        const tomorrowHijri = writeIslamicDate(1, today);
        const advancedOneDay =
            tomorrowHijri.date === todayHijri.date + 1 || (todayHijri.date === 30 && tomorrowHijri.date === 1);
        expect(advancedOneDay).toBe(true);
    });
});
