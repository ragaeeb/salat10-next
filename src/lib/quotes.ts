import parseDuration from 'parse-duration';
import type { ComputedPrayerData } from '@/store/usePrayerStore';
import type { HijriDate } from '@/types/hijri';
import type { Quote } from '@/types/quote';
import { writeIslamicDate } from './hijri';

/**
 * Maps event names from quotes to prayer time keys
 */
const normalizeEventName = (event: string): string => {
    return event.toLowerCase().replace(/[^a-z]/g, '');
};

const getCurrentEventName = (data: ComputedPrayerData): string | null => {
    const currentPrayer = data.prayerTimes.currentPrayer();
    if (!currentPrayer) {
        return null;
    }
    return normalizeEventName(currentPrayer);
};

const getEventTime = (data: ComputedPrayerData, event: string): Date | null => {
    const normalized = normalizeEventName(event);

    // Check sunnah times first
    if (normalized === 'middleofthenight') {
        return data.sunnahTimes.middleOfTheNight;
    }
    if (normalized === 'lastthirdofthenight') {
        return data.sunnahTimes.lastThirdOfTheNight;
    }

    // Map to prayer names
    const prayerNameMap: Record<string, string> = {
        asr: 'Asr',
        dhuhr: 'Dhuhr',
        fajr: 'Fajr',
        isha: 'Isha',
        maghrib: 'Maghrib',
        sunrise: 'Sunrise',
    };

    const prayerName = prayerNameMap[normalized];
    if (prayerName) {
        return data.prayerTimes.timeForPrayer(prayerName);
    }

    return null;
};

const matchesHijriMonth = (quote: Quote, hijri: HijriDate): boolean => {
    if (!quote.hijri_months) {
        return true;
    }
    // hijri.monthIndex is 0-based, quote hijri_months is 1-based
    return quote.hijri_months.includes(hijri.monthIndex + 1);
};

const matchesHijriDate = (quote: Quote, hijri: HijriDate): boolean => {
    if (!quote.hijri_dates) {
        return true;
    }
    return quote.hijri_dates.includes(hijri.date);
};

const matchesWeekday = (quote: Quote, date: Date): boolean => {
    if (!quote.days) {
        return true;
    }
    return quote.days.includes(date.getDay());
};

const matchesAfter = (quote: Quote, data: ComputedPrayerData): boolean => {
    if (!quote.after) {
        return true;
    }

    const currentEvent = getCurrentEventName(data);
    if (!currentEvent) {
        return false;
    }

    return quote.after.events.some((event) => normalizeEventName(event) === currentEvent);
};

const matchesBefore = (quote: Quote, data: ComputedPrayerData): boolean => {
    if (!quote.before) {
        return true;
    }
    if (!quote.before.diff) {
        return true; // No diff specified, match all
    }

    const now = data.date.getTime();
    const maxDiffMs = parseDuration(quote.before.diff);
    if (!maxDiffMs) {
        return false;
    }

    return quote.before.events.some((event) => {
        const eventTime = getEventTime(data, event);
        if (!eventTime) {
            return false;
        }

        const diffMs = eventTime.getTime() - now;
        return diffMs > 0 && diffMs <= maxDiffMs;
    });
};

/**
 * Calculate a specificity score for a quote to prioritize more specific matches
 */
const calculateSpecificity = (quote: Quote): number => {
    let score = 0;
    if (quote.hijri_months) {
        score += 10;
    }
    if (quote.hijri_dates) {
        score += 20;
    }
    if (quote.days) {
        score += 5;
    }
    if (quote.after) {
        score += 15;
    }
    if (quote.before) {
        score += 15;
    }
    return score;
};

export const filterQuotesByPresent = (data: ComputedPrayerData, quotes: Quote[]): Quote[] => {
    const hijri = writeIslamicDate(0, data.date);

    // Filter quotes by all criteria
    const filtered = quotes.filter((quote) => {
        return (
            matchesHijriMonth(quote, hijri) &&
            matchesHijriDate(quote, hijri) &&
            matchesWeekday(quote, data.date) &&
            matchesAfter(quote, data) &&
            matchesBefore(quote, data)
        );
    });

    // If we have matches, sort by specificity (most specific first)
    if (filtered.length > 0) {
        return filtered.sort((a, b) => calculateSpecificity(b) - calculateSpecificity(a));
    }

    // Fallback to generic quotes (no filters)
    const generic = quotes.filter((q) => !q.hijri_months && !q.hijri_dates && !q.days && !q.after && !q.before);

    return generic.length > 0 ? generic : quotes;
};

export const getRandomQuote = (current: ComputedPrayerData, quotes: Quote[]): Quote | null => {
    const filtered = filterQuotesByPresent(current, quotes);
    if (filtered.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex]!;
};

export const formatCitation = (quote: Quote): string => {
    const parts: string[] = [quote.title];

    if (quote.part_number !== undefined && quote.part_page !== undefined) {
        parts.push(`${quote.part_number}/${quote.part_page}`);
    }

    parts.push(quote.author);

    return parts.join(', ');
};
