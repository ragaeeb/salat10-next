import { describe, expect, it } from 'bun:test';

import { explainHijriConversion, writeIslamicDate } from './hijri';

describe('hijri', () => {
    describe('writeIslamicDate', () => {
        it('should produce known Ramadan date for March 11, 2024', () => {
            const sample = new Date('2024-03-11T00:00:00Z');
            const written = writeIslamicDate(0, sample);

            expect(written).toEqual({ date: 2, day: 'al-ʾIthnayn', month: 'Ramaḍān', year: 1445 });
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

        it('should handle all 12 Islamic months correctly', () => {
            // Testing dates that fall in each month of year 1445
            const testDates = [
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
            ];

            for (const { gregorian, month } of testDates) {
                const date = new Date(`${gregorian}T00:00:00Z`);
                const hijri = writeIslamicDate(0, date);
                expect(hijri.month).toBe(month);
            }
        });

        it('should handle all 7 weekday names correctly', () => {
            // Week starting March 10, 2024 (Sunday)
            const weekdays = [
                { date: '2024-03-10', day: 'al-ʾAḥad' }, // Sunday
                { date: '2024-03-11', day: 'al-ʾIthnayn' }, // Monday
                { date: '2024-03-12', day: 'ath-Thulāthāʾ' }, // Tuesday
                { date: '2024-03-13', day: 'al-ʾArbiʿāʾ' }, // Wednesday
                { date: '2024-03-14', day: 'al-Khamīs' }, // Thursday
                { date: '2024-03-15', day: 'al-Jumuʿah' }, // Friday
                { date: '2024-03-16', day: 'al-Sabt' }, // Saturday
            ];

            for (const { date, day } of weekdays) {
                const hijri = writeIslamicDate(0, new Date(`${date}T00:00:00Z`));
                expect(hijri.day).toBe(day);
            }
        });

        it('should handle month transitions correctly', () => {
            // Test end of Shaʿbān (day 29) and start of Ramaḍān
            const endOfShaban = new Date('2024-03-10T00:00:00Z');
            const startOfRamadan = new Date('2024-03-11T00:00:00Z');

            const endHijri = writeIslamicDate(0, endOfShaban);
            const startHijri = writeIslamicDate(0, startOfRamadan);

            expect(endHijri.month).toBe('Shaʿbān');
            expect(startHijri.month).toBe('Ramaḍān');
            expect(startHijri.date).toBeLessThan(endHijri.date); // New month resets date
        });

        it('should handle year transitions correctly', () => {
            // End of 1444 and start of 1445
            const endOf1444 = new Date('2023-07-18T00:00:00Z');
            const startOf1445 = new Date('2023-07-19T00:00:00Z');

            const end1444Hijri = writeIslamicDate(0, endOf1444);
            const start1445Hijri = writeIslamicDate(0, startOf1445);

            expect(end1444Hijri.year).toBe(1444);
            expect(start1445Hijri.year).toBe(1445);
            expect(start1445Hijri.month).toBe('al-Muḥarram');
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

        it('should handle month index correctly for all months', () => {
            const testDates = [
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
            ];

            for (const { gregorian, monthIndex } of testDates) {
                const date = new Date(`${gregorian}T00:00:00Z`);
                const explanation = explainHijriConversion(0, date);
                expect(explanation.islamic.monthIndex).toBe(monthIndex);
            }
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

        it('should maintain consistency across adjustments', () => {
            const base = new Date('2024-03-11T00:00:00Z');

            for (let adjustment = -5; adjustment <= 5; adjustment++) {
                const explanation = explainHijriConversion(adjustment, base);

                expect(explanation.islamic.day).toBeGreaterThan(0);
                expect(explanation.islamic.day).toBeLessThanOrEqual(30);
                expect(explanation.islamic.monthIndex).toBeGreaterThanOrEqual(0);
                expect(explanation.islamic.monthIndex).toBeLessThanOrEqual(11);
                expect(explanation.islamic.year).toBeGreaterThan(1400);
            }
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
        it('should handle dates at month boundaries', () => {
            // Test various day 1s and day 29/30s throughout the year
            const boundaries = [
                '2024-03-11', // Ramadan 1
                '2024-04-09', // Ramadan 29
                '2024-04-10', // Shawwāl 1
            ];

            for (const dateStr of boundaries) {
                const date = new Date(`${dateStr}T00:00:00Z`);
                const hijri = writeIslamicDate(0, date);

                expect(hijri.date).toBeGreaterThan(0);
                expect(hijri.date).toBeLessThanOrEqual(30);
                expect(hijri.month).toBeTruthy();
                expect(hijri.year).toBeGreaterThan(1400);
            }
        });

        it('should handle very large adjustments consistently', () => {
            const base = new Date('2024-03-11T00:00:00Z');
            const largePositive = writeIslamicDate(365, base); // +1 Gregorian year
            const largeNegative = writeIslamicDate(-365, base); // -1 Gregorian year

            expect(largePositive.year - largeNegative.year).toBeCloseTo(2, 0);
        });

        it('should be consistent between writeIslamicDate and explainHijriConversion', () => {
            const dates = ['2024-01-01', '2024-03-11', '2024-06-15', '2024-12-31'];

            for (const dateStr of dates) {
                const date = new Date(`${dateStr}T00:00:00Z`);
                const written = writeIslamicDate(0, date);
                const explained = explainHijriConversion(0, date);

                expect(written.date).toBe(explained.islamic.day);
                expect(written.month).toBe(explained.islamic.monthName);
                expect(written.year).toBe(explained.islamic.year);
                expect(written.day).toBe(explained.weekdayName);
            }
        });
    });
});
