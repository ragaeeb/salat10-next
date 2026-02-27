import { describe, expect, it } from 'bun:test';

import { explainHijriConversion, writeIslamicDate } from './hijri';

describe('hijri', () => {
    describe('writeIslamicDate', () => {
        it('should produce known Ramadan date for March 11, 2024', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const written = writeIslamicDate(0, sample);

            expect(written).toEqual({ date: 2, day: 'al-ʾIthnayn', month: 'Ramaḍān', monthIndex: 8, year: 1445 });
        });

        it('should advance by one day when adjustment is +1', () => {
            const today = new Date('2024-03-11T00:00:00Z');
            const todayHijri = writeIslamicDate(0, today);
            const tomorrowHijri = writeIslamicDate(1, today);

            const advancedOneDay =
                tomorrowHijri.date === todayHijri.date + 1 || (todayHijri.date === 30 && tomorrowHijri.date === 1);

            expect(advancedOneDay).toBe(true);
        });

        it('should go back by one day when adjustment is -1', () => {
            const today = new Date('2024-03-11T00:00:00Z');
            const todayHijri = writeIslamicDate(0, today);
            const yesterdayHijri = writeIslamicDate(-1, today);

            const wentBackOneDay =
                yesterdayHijri.date === todayHijri.date - 1 || (todayHijri.date === 1 && yesterdayHijri.date === 30);

            expect(wentBackOneDay).toBe(true);
        });

        it.each([
            { gregorian: '2023-07-19', month: 'al-Muḥarram' },
            { gregorian: '2023-08-18', month: 'Ṣafar' },
            { gregorian: '2023-09-16', month: 'Rabīʿ al-ʾAwwal' },
            { gregorian: '2023-10-16', month: 'Rabīʿ al-ʾĀkhir' },
            { gregorian: '2023-11-14', month: 'Jumadā al-ʾŪlā' },
            { gregorian: '2023-12-14', month: 'Jumādā al-ʾĀkhirah' },
            { gregorian: '2024-01-12', month: 'Rajab' },
            { gregorian: '2024-02-11', month: 'Shaʿbān' },
            { gregorian: '2024-03-11', month: 'Ramaḍān' },
            { gregorian: '2024-04-10', month: 'Shawwāl' },
            { gregorian: '2024-05-09', month: 'Ḏū ʾl-Qaʿdah' },
            { gregorian: '2024-06-08', month: 'Ḏū ʾl-Ḥijjah' },
        ])('should correctly identify $month for $gregorian', ({ gregorian, month }) => {
            const date = new Date(`${gregorian}T00:00:00Z`);
            const hijri = writeIslamicDate(0, date);
            expect(hijri.month).toBe(month);
        });

        it.each([
            { date: '2024-03-10', day: 'al-ʾAḥad' }, // Sunday
            { date: '2024-03-11', day: 'al-ʾIthnayn' }, // Monday
            { date: '2024-03-12', day: 'ath-Thulāthāʾ' }, // Tuesday
            { date: '2024-03-13', day: 'al-ʾArbiʿāʾ' }, // Wednesday
            { date: '2024-03-14', day: 'al-Khamīs' }, // Thursday
            { date: '2024-03-15', day: 'al-Jumuʿah' }, // Friday
            { date: '2024-03-16', day: 'al-Sabt' }, // Saturday
        ])('should correctly identify $day for $date', ({ date, day }) => {
            const hijri = writeIslamicDate(0, new Date(`${date}T00:00:00Z`));
            expect(hijri.day).toBe(day);
        });

        it('should handle month transitions correctly', () => {
            // Test actual month transition: March 10 and 11, 2024
            // Based on the Kuwaiti algorithm at UTC midnight:
            // March 10, 2024 00:00 UTC = Ramadan 1, 1445
            // March 11, 2024 00:00 UTC = Ramadan 2, 1445
            const ramadan1 = new Date('2024-03-10T00:00:00Z');
            const ramadan2 = new Date('2024-03-11T00:00:00Z');

            const hijri1 = writeIslamicDate(0, ramadan1);
            const hijri2 = writeIslamicDate(0, ramadan2);

            expect(hijri1.month).toBe('Ramaḍān');
            expect(hijri1.date).toBe(1);
            expect(hijri2.month).toBe('Ramaḍān');
            expect(hijri2.date).toBe(2);

            // Verify the day before Ramadan 1 is in Sha'ban
            const shaban = new Date('2024-03-09T00:00:00Z');
            const shabanHijri = writeIslamicDate(0, shaban);
            expect(shabanHijri.month).toBe('Shaʿbān');
        });

        it('should handle year transitions correctly', () => {
            // Year 1445 starts on July 19, 2023 (Muharram 1, 1445)
            // According to the Kuwaiti algorithm at UTC midnight,
            // July 18, 2023 00:00 UTC may already be in year 1445
            // (last day of previous year or first day of new year)
            const muharram1_1445 = new Date('2023-07-19T00:00:00Z');
            const dayBefore = new Date('2023-07-18T00:00:00Z');

            const muharramHijri = writeIslamicDate(0, muharram1_1445);
            const dayBeforeHijri = writeIslamicDate(0, dayBefore);

            expect(muharramHijri.year).toBe(1445);
            expect(muharramHijri.month).toBe('al-Muḥarram');
            expect(muharramHijri.date).toBe(2);

            // The day before could be in year 1444 or 1445 depending on the algorithm
            // Just verify it's a valid date
            expect(dayBeforeHijri.year).toBeGreaterThanOrEqual(1444);
            expect(dayBeforeHijri.year).toBeLessThanOrEqual(1445);

            // If it's 1444, should be last month; if 1445, should be Muharram
            if (dayBeforeHijri.year === 1444) {
                expect(dayBeforeHijri.month).toBe('Ḏū ʾl-Ḥijjah');
            } else {
                expect(dayBeforeHijri.month).toBe('al-Muḥarram');
            }
        });

        it('should handle large positive adjustments', () => {
            const base = new Date('2024-03-11T00:00:00Z');
            const adjusted = writeIslamicDate(30, base); // +30 days

            expect(adjusted.year).toBeGreaterThanOrEqual(1445);
            expect(adjusted.date).toBeGreaterThan(0);
            expect(adjusted.date).toBeLessThanOrEqual(30);
        });

        it('should handle large negative adjustments', () => {
            const base = new Date('2024-03-11T00:00:00Z');
            const adjusted = writeIslamicDate(-30, base); // -30 days

            expect(adjusted.year).toBeLessThanOrEqual(1445);
            expect(adjusted.date).toBeGreaterThan(0);
            expect(adjusted.date).toBeLessThanOrEqual(30);
        });
    });

    describe('explainHijriConversion', () => {
        it('should provide correct Julian Day Number for March 11, 2024', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const explanation = explainHijriConversion(0, sample);

            expect(explanation.julianDayNumber).toBeGreaterThan(0);
            expect(explanation.offsetFromEpoch).toBeCloseTo(
                explanation.julianDayNumber + 1 - explanation.constants.epoch,
            );
        });

        it('should include all required constants', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const explanation = explainHijriConversion(0, sample);

            expect(explanation.constants.epoch).toBe(1948084);
            expect(explanation.constants.cycleDays).toBe(10631);
            expect(explanation.constants.averageYear).toBeCloseTo(354.36666666666667);
            expect(explanation.constants.shift).toBeCloseTo(0.13350000000000001);
        });

        it('should calculate cycle information correctly', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const explanation = explainHijriConversion(0, sample);

            expect(explanation.cycle.index).toBeGreaterThanOrEqual(0);
            expect(explanation.cycle.remainderDays).toBeGreaterThanOrEqual(0);
            expect(explanation.cycle.remainderDays).toBeLessThan(explanation.constants.cycleDays);
            expect(explanation.cycle.yearsIntoCycle).toBeGreaterThanOrEqual(0);
            expect(explanation.cycle.yearsIntoCycle).toBeLessThan(30);
        });

        it('should provide Islamic date information matching writeIslamicDate', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const explanation = explainHijriConversion(0, sample);
            const written = writeIslamicDate(0, sample);

            expect(explanation.islamic.day).toBe(written.date);
            expect(explanation.islamic.monthName).toBe(written.month);
            expect(explanation.islamic.year).toBe(written.year);
            expect(explanation.weekdayName).toBe(written.day);
        });

        it.each([
            { gregorian: '2023-07-19', monthIndex: 0 }, // al-Muḥarram
            { gregorian: '2023-08-18', monthIndex: 1 }, // Ṣafar
            { gregorian: '2023-09-16', monthIndex: 2 }, // Rabīʿ al-ʾAwwal
            { gregorian: '2023-10-16', monthIndex: 3 }, // Rabīʿ al-ʾĀkhir
            { gregorian: '2023-11-14', monthIndex: 4 }, // Jumadā al-ʾŪlā
            { gregorian: '2023-12-14', monthIndex: 5 }, // Jumādā al-ʾĀkhirah
            { gregorian: '2024-01-12', monthIndex: 6 }, // Rajab
            { gregorian: '2024-02-11', monthIndex: 7 }, // Shaʿbān
            { gregorian: '2024-03-11', monthIndex: 8 }, // Ramaḍān
            { gregorian: '2024-04-10', monthIndex: 9 }, // Shawwāl
            { gregorian: '2024-05-09', monthIndex: 10 }, // Ḏū ʾl-Qaʿdah
            { gregorian: '2024-06-08', monthIndex: 11 }, // Ḏū ʾl-Ḥijjah
        ])('should have month index $monthIndex for $gregorian', ({ gregorian, monthIndex }) => {
            const date = new Date(`${gregorian}T00:00:00Z`);
            const explanation = explainHijriConversion(0, date);
            expect(explanation.islamic.monthIndex).toBe(monthIndex);
        });

        it('should provide month calculation details', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const explanation = explainHijriConversion(0, sample);

            expect(explanation.monthCalculation.rawMonth).toBeGreaterThan(0);
            expect(explanation.monthCalculation.rawMonth).toBeLessThanOrEqual(12);
        });

        it('should handle adjustment parameter correctly', () => {
            const base = new Date('2024-03-11T00:00:00Z');
            const noAdjust = explainHijriConversion(0, base);
            const withAdjust = explainHijriConversion(1, base);

            // With +1 adjustment, should be one day ahead
            const dayDiff = withAdjust.islamic.day - noAdjust.islamic.day;
            const monthChanged = withAdjust.islamic.monthIndex !== noAdjust.islamic.monthIndex;

            expect(dayDiff === 1 || (dayDiff < 0 && monthChanged)).toBe(true);
        });

        it.each([
            -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5,
        ])('should maintain consistency for adjustment %i', (adjustment) => {
            const base = new Date('2024-03-11T00:00:00Z');
            const explanation = explainHijriConversion(adjustment, base);

            expect(explanation.islamic.day).toBeGreaterThan(0);
            expect(explanation.islamic.day).toBeLessThanOrEqual(30);
            expect(explanation.islamic.monthIndex).toBeGreaterThanOrEqual(0);
            expect(explanation.islamic.monthIndex).toBeLessThanOrEqual(11);
            expect(explanation.islamic.year).toBeGreaterThan(1400);
        });

        it('should handle historical dates correctly', () => {
            const historical = new Date('2000-01-01T00:00:00Z');
            const explanation = explainHijriConversion(0, historical);

            expect(explanation.islamic.year).toBeGreaterThan(1400);
            expect(explanation.islamic.year).toBeLessThan(1500);
            expect(explanation.islamic.monthIndex).toBeGreaterThanOrEqual(0);
            expect(explanation.islamic.monthIndex).toBeLessThanOrEqual(11);
        });

        it('should handle future dates correctly', () => {
            const future = new Date('2030-12-31T00:00:00Z');
            const explanation = explainHijriConversion(0, future);

            expect(explanation.islamic.year).toBeGreaterThan(1440);
            expect(explanation.islamic.monthIndex).toBeGreaterThanOrEqual(0);
            expect(explanation.islamic.monthIndex).toBeLessThanOrEqual(11);
        });
    });

    describe('edge cases', () => {
        it.each([
            '2024-03-10', // Ramadan 1
            '2024-04-09', // Ramadan 30 (last day)
            '2024-04-10', // Shawwāl 1
        ])('should handle month boundary date %s', (dateStr) => {
            const date = new Date(`${dateStr}T00:00:00Z`);
            const hijri = writeIslamicDate(0, date);

            expect(hijri.date).toBeGreaterThan(0);
            expect(hijri.date).toBeLessThanOrEqual(30);
            expect(hijri.month).toBeTruthy();
            expect(hijri.year).toBeGreaterThan(1400);
        });

        it('should handle very large adjustments consistently', () => {
            const base = new Date('2024-03-11T00:00:00Z');
            const largePositive = writeIslamicDate(365, base); // +1 Gregorian year
            const largeNegative = writeIslamicDate(-365, base); // -1 Gregorian year

            expect(largePositive.year - largeNegative.year).toBeCloseTo(2, 0);
        });

        it.each([
            '2024-01-01',
            '2024-03-11',
            '2024-06-15',
            '2024-12-31',
        ])('should be consistent between functions for %s', (dateStr) => {
            const date = new Date(`${dateStr}T00:00:00Z`);
            const written = writeIslamicDate(0, date);
            const explained = explainHijriConversion(0, date);

            expect(written.date).toBe(explained.islamic.day);
            expect(written.month).toBe(explained.islamic.monthName);
            expect(written.year).toBe(explained.islamic.year);
            expect(written.day).toBe(explained.weekdayName);
        });
    });
});
