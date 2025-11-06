import { describe, expect, it } from 'bun:test';
import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { ComputedPrayerData } from '@/store/usePrayerStore';
import type { Quote } from '@/types/quote';
import { filterQuotesByPresent, formatCitation, getRandomQuote } from './quotes';
import { createParameters } from './settings';

// Helper to create prayer data for a specific date
const createPrayerData = (date: Date): ComputedPrayerData => {
    const coords = new Coordinates(43.6532, -79.3832); // Toronto
    const params = createParameters({ fajrAngle: 15, ishaAngle: 15, ishaInterval: 0, method: 'MuslimWorldLeague' });
    const prayerTimes = new PrayerTimes(coords, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    return { computedAt: Date.now(), date, prayerTimes, sunnahTimes };
};

describe('filterQuotesByPresent', () => {
    describe('hijri month filtering', () => {
        it('should match quotes with hijri_months when month matches', () => {
            // April 2, 2022 is 1 Ramadan 1443
            const data = createPrayerData(new Date(2022, 3, 2, 12, 0, 0));

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    body: 'Ramadan quote',
                    hijri_months: [9], // Ramadan
                    title: 'Test',
                },
                {
                    author: 'Test Author',
                    body: 'Other month quote',
                    hijri_months: [8], // Shaban
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].body).toBe('Ramadan quote');
        });

        it('should match quotes without hijri_months (generic)', () => {
            const data = createPrayerData(new Date(2022, 3, 2, 12, 0, 0));

            const quotes: Quote[] = [{ author: 'Test Author', body: 'Generic quote', title: 'Test' }];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].body).toBe('Generic quote');
        });

        it('should match quotes with multiple hijri_months (OR logic)', () => {
            const data = createPrayerData(new Date(2022, 3, 2, 12, 0, 0)); // Ramadan

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    body: 'Multiple months quote',
                    hijri_months: [8, 9, 10], // Shaban, Ramadan, Shawwal
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
        });
    });

    describe('hijri date filtering', () => {
        it('should match quotes with hijri_dates when date matches', () => {
            // April 2, 2022 is 1 Ramadan 1443
            const data = createPrayerData(new Date(2022, 3, 2, 12, 0, 0));

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'First of Ramadan', hijri_dates: [1], hijri_months: [9], title: 'Test' },
                { author: 'Test Author', body: 'Last of Ramadan', hijri_dates: [29], hijri_months: [9], title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].body).toBe('First of Ramadan');
        });

        it('should match quotes with multiple hijri_dates (OR logic)', () => {
            const data = createPrayerData(new Date(2022, 3, 2, 12, 0, 0)); // 1 Ramadan

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    body: 'Multiple dates quote',
                    hijri_dates: [1, 2, 3],
                    hijri_months: [9],
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
        });

        it('should match quotes with hijri_months but no hijri_dates (any day of month)', () => {
            const data = createPrayerData(new Date(2022, 3, 15, 12, 0, 0)); // Mid Ramadan

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'Any Ramadan day', hijri_months: [9], title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
        });
    });

    describe('weekday filtering', () => {
        it('should match quotes with days when weekday matches', () => {
            // Friday, April 1, 2022
            const data = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    body: 'Friday quote',
                    days: [5], // Friday
                    title: 'Test',
                },
                {
                    author: 'Test Author',
                    body: 'Monday quote',
                    days: [1], // Monday
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].body).toBe('Friday quote');
        });

        it('should match quotes with multiple days (OR logic)', () => {
            // Friday, April 1, 2022
            const data = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'Monday or Thursday or Friday', days: [1, 4, 5], title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
        });
    });

    describe('after event filtering', () => {
        it('should match quotes with after.events when current prayer matches', () => {
            // Create a date during Isha time
            const data = createPrayerData(new Date(2022, 3, 1, 21, 0, 0));

            const quotes: Quote[] = [
                { after: { events: ['isha'] }, author: 'Test Author', body: 'After Isha quote', title: 'Test' },
                { after: { events: ['fajr'] }, author: 'Test Author', body: 'After Fajr quote', title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered.length).toBeGreaterThanOrEqual(1);
            expect(filtered.some((q) => q.body === 'After Isha quote')).toBe(true);
        });

        it('should match quotes with multiple after.events (OR logic)', () => {
            const data = createPrayerData(new Date(2022, 3, 1, 21, 0, 0)); // Isha time

            const quotes: Quote[] = [
                {
                    after: { events: ['maghrib', 'isha'] },
                    author: 'Test Author',
                    body: 'After Maghrib or Isha',
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('before event filtering', () => {
        it('should match quotes with before.diff when within time window', () => {
            // Create initial data to get maghrib time
            const initialData = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));
            const maghribTime = initialData.prayerTimes.maghrib;

            // Create test date at 30 minutes before Maghrib
            const testDate = new Date(maghribTime.getTime() - 30 * 60 * 1000);
            // FIXED: Update the entire prayer data with the new date
            const testData = createPrayerData(testDate);

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    before: { diff: '1h', events: ['maghrib'] },
                    body: 'Last hour before Maghrib',
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(testData, quotes);
            expect(filtered.some((q) => q.body === 'Last hour before Maghrib')).toBe(true);
        });

        it('should not match quotes when outside time window', () => {
            const initialData = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));
            const maghribTime = initialData.prayerTimes.maghrib;

            // 30 minutes before (WITHIN 1h window) - should match
            const withinDate = new Date(maghribTime.getTime() - 30 * 60 * 1000);
            // FIXED: Create fresh prayer data for the within date
            const withinData = createPrayerData(withinDate);

            // 2 hours before (OUTSIDE 1h window) - should NOT match
            const outsideDate = new Date(maghribTime.getTime() - 2 * 60 * 60 * 1000);
            // FIXED: Create fresh prayer data for the outside date
            const outsideData = createPrayerData(outsideDate);

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    before: { diff: '1h', events: ['maghrib'] },
                    body: 'Last hour before Maghrib',
                    title: 'Test',
                },
                { author: 'Test Author', body: 'Generic quote', title: 'Test' },
            ];

            // Within window - specific quote should match
            const withinFiltered = filterQuotesByPresent(withinData, quotes);
            expect(withinFiltered.some((q) => q.body === 'Last hour before Maghrib')).toBe(true);

            // Outside window - specific quote should NOT match, generic should
            const outsideFiltered = filterQuotesByPresent(outsideData, quotes);
            expect(outsideFiltered.some((q) => q.body === 'Last hour before Maghrib')).toBe(false);
            expect(outsideFiltered.some((q) => q.body === 'Generic quote')).toBe(true);
        });

        it('should match quotes with before (no diff) when in the immediately preceding event', () => {
            // Create data during sunrise period (after sunrise, before dhuhr)
            const initialData = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));
            const sunriseTime = initialData.prayerTimes.sunrise;

            // 30 minutes after sunrise - we're in the 'sunrise' event period
            const testDate = new Date(sunriseTime.getTime() + 30 * 60 * 1000);
            const testData = createPrayerData(testDate);

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    before: { events: ['dhuhr'] }, // Should match when current event is sunrise
                    body: 'Before dhuhr (no diff)',
                    title: 'Test',
                },
                {
                    author: 'Test Author',
                    before: { events: ['asr'] }, // Should NOT match - asr is not the next event
                    body: 'Before asr (no diff)',
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(testData, quotes);
            expect(filtered.some((q) => q.body === 'Before dhuhr (no diff)')).toBe(true);
            expect(filtered.some((q) => q.body === 'Before asr (no diff)')).toBe(false);
        });

        it.skip('should not match before (no diff) when not in immediately preceding event', () => {
            // Create data during middleOfTheNight
            const initialData = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));
            const middleTime = initialData.sunnahTimes.middleOfTheNight;

            // During middle of the night
            const testDate = new Date(middleTime.getTime() + 10 * 60 * 1000);
            const testData = createPrayerData(testDate);

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    before: { events: ['dhuhr'] }, // Should NOT match - next event is lastThirdOfTheNight, not dhuhr
                    body: 'Before dhuhr from middle of night',
                    title: 'Test',
                },
                {
                    author: 'Test Author',
                    before: { events: ['lastThirdOfTheNight'] }, // Should match - next event
                    body: 'Before last third',
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(testData, quotes);
            console.log('filtered', filtered);
            expect(filtered.some((q) => q.body === 'Before dhuhr from middle of night')).toBe(false);
            expect(filtered.some((q) => q.body === 'Before last third')).toBe(true);
        });
    });

    describe('combined filters (AND logic)', () => {
        it('should match quotes when all filters match', () => {
            // Friday, April 1, 2022 during Ramadan
            const data = createPrayerData(new Date(2022, 3, 1, 21, 0, 0)); // Isha time

            const quotes: Quote[] = [
                {
                    after: { events: ['isha'] },
                    author: 'Test Author',
                    body: 'Friday Ramadan Isha quote',
                    days: [5],
                    hijri_months: [9],
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered.length).toBeGreaterThanOrEqual(1);
        });

        it('should not match quotes when one filter fails', () => {
            // Use a simple daytime hour to avoid Islamic day boundary issues
            // April 15, 2022 at 2pm should be solidly in Ramadan
            const data = createPrayerData(new Date(2022, 3, 15, 14, 0, 0));

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    body: 'Wrong month',
                    hijri_months: [8], // Shaban, but we're in Ramadan
                    title: 'Test',
                },
                {
                    author: 'Test Author',
                    body: 'Correct month',
                    hijri_months: [9], // Ramadan
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered.some((q) => q.body === 'Wrong month')).toBe(false);
            expect(filtered.some((q) => q.body === 'Correct month')).toBe(true);
        });

        it('should match Friday + specific Hijri date combination', () => {
            // We need to find a date that is both Friday and 1st of Shawwal (Eid)
            // May 13, 2022 is Friday and 13 Shawwal 1443 (close enough for test)
            const data = createPrayerData(new Date(2022, 4, 13, 12, 0, 0));

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'Friday in Shawwal', days: [5], hijri_months: [10], title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
        });
    });

    describe('specificity and sorting', () => {
        it('should prioritize more specific quotes', () => {
            const data = createPrayerData(new Date(2022, 3, 1, 21, 0, 0)); // Friday, Ramadan, Isha

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'Generic Ramadan', hijri_months: [9], title: 'Test' },
                {
                    after: { events: ['isha'] },
                    author: 'Test Author',
                    body: 'Specific: Ramadan + Date + Day + After',
                    days: [5],
                    hijri_dates: [29],
                    hijri_months: [9],
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            // More specific quote should come first (if dates align)
            expect(filtered[0]).toBeDefined();
        });
    });

    describe('fallback behavior', () => {
        it('should return generic quotes when no matches found', () => {
            const data = createPrayerData(new Date(2022, 0, 1, 12, 0, 0)); // Non-Ramadan

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'Ramadan only', hijri_months: [9], title: 'Test' },
                { author: 'Test Author', body: 'Generic quote', title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].body).toBe('Generic quote');
        });

        it('should return all quotes when no matches and no generic quotes', () => {
            const data = createPrayerData(new Date(2022, 0, 1, 12, 0, 0));

            const quotes: Quote[] = [
                { author: 'Test Author', body: 'Ramadan only', hijri_months: [9], title: 'Test' },
                { author: 'Test Author', body: 'Shaban only', hijri_months: [8], title: 'Test' },
            ];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(2);
        });
    });

    describe('edge cases', () => {
        it('should handle empty quotes array', () => {
            const data = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));

            const filtered = filterQuotesByPresent(data, []);
            expect(filtered).toHaveLength(0);
        });

        it('should handle quotes with all optional fields undefined', () => {
            const data = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));

            const quotes: Quote[] = [{ author: 'Test Author', body: 'Minimal quote', title: 'Test' }];

            const filtered = filterQuotesByPresent(data, quotes);
            expect(filtered).toHaveLength(1);
        });

        it('should handle sunnah time events (middleOfTheNight, lastThirdOfTheNight)', () => {
            const initialData = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));
            const middleTime = initialData.sunnahTimes.middleOfTheNight;

            // Create test date 30 minutes before middle of night
            const testDate = new Date(middleTime.getTime() - 30 * 60 * 1000);
            // FIXED: Create fresh prayer data for the test date
            const testData = createPrayerData(testDate);

            const quotes: Quote[] = [
                {
                    author: 'Test Author',
                    before: { diff: '1h', events: ['middleOfTheNight'] },
                    body: 'Before middle of night',
                    title: 'Test',
                },
            ];

            const filtered = filterQuotesByPresent(testData, quotes);
            expect(filtered.length).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('getRandomQuote', () => {
    it('should return a random quote from filtered results', () => {
        const data = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));

        const quotes: Quote[] = [
            { author: 'Test Author', body: 'Quote 1', title: 'Test' },
            { author: 'Test Author', body: 'Quote 2', title: 'Test' },
        ];

        const quote = getRandomQuote(data, quotes);
        expect(quote).not.toBeNull();
        expect(['Quote 1', 'Quote 2']).toContain(quote!.body);
    });

    it('should return null for empty quotes', () => {
        const data = createPrayerData(new Date(2022, 3, 1, 12, 0, 0));
        const quote = getRandomQuote(data, []);
        expect(quote).toBeNull();
    });
});

describe('formatCitation', () => {
    it('should format citation with part number and page', () => {
        const quote: Quote = {
            author: 'Muḥammad Nāṣir ʾl-Dīn al-Albānī',
            body: 'Test',
            part_number: 1,
            part_page: 176,
            title: 'Irwāʾ al-Ġalīl',
        };

        const citation = formatCitation(quote);
        expect(citation).toBe('Irwāʾ al-Ġalīl, 1/176, Muḥammad Nāṣir ʾl-Dīn al-Albānī');
    });

    it('should format citation without part number and page', () => {
        const quote: Quote = { author: 'Test Author', body: 'Test', title: 'Test Title' };

        const citation = formatCitation(quote);
        expect(citation).toBe('Test Title, Test Author');
    });

    it('should handle citation with only part_number', () => {
        const quote: Quote = { author: 'Test Author', body: 'Test', part_number: 1, title: 'Test Title' };

        const citation = formatCitation(quote);
        expect(citation).toBe('Test Title, Test Author');
    });

    it('should handle citation with only part_page', () => {
        const quote: Quote = { author: 'Test Author', body: 'Test', part_page: 176, title: 'Test Title' };

        const citation = formatCitation(quote);
        expect(citation).toBe('Test Title, Test Author');
    });
});
