import parseDuration from 'parse-duration';
import type { ComputedPrayerData } from '@/store/usePrayerStore';
import type { HijriDate } from '@/types/hijri';
import type { Quote } from '@/types/quote';
import { writeIslamicDate } from './hijri';

/**
 * Get all events with their times in chronological order
 */
const getAllEvents = (data: ComputedPrayerData): Array<{ event: string; time: Date }> => {
    return [
        { event: 'fajr', time: data.prayerTimes.fajr },
        { event: 'sunrise', time: data.prayerTimes.sunrise },
        { event: 'dhuhr', time: data.prayerTimes.dhuhr },
        { event: 'asr', time: data.prayerTimes.asr },
        { event: 'maghrib', time: data.prayerTimes.maghrib },
        { event: 'isha', time: data.prayerTimes.isha },
        { event: 'middleOfTheNight', time: data.sunnahTimes.middleOfTheNight },
        { event: 'lastThirdOfTheNight', time: data.sunnahTimes.lastThirdOfTheNight },
    ].sort((a, b) => a.time.getTime() - b.time.getTime());
};

/**
 * Get the current active event based on the current time
 */
const getCurrentEventName = (data: ComputedPrayerData): string | null => {
    const now = data.date.getTime();
    const events = getAllEvents(data);

    // Find the last event that has already occurred
    for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].time.getTime() <= now) {
            return events[i].event;
        }
    }

    // If no event has occurred yet today, we're in the last event from yesterday
    // This would be lastThirdOfTheNight or after isha from previous day
    return events[events.length - 1]?.event ?? null;
};

/**
 * Get the time for a specific event
 */
const getEventTime = (data: ComputedPrayerData, event: string): Date | null => {
    // Direct lookup without normalization - event names should match exactly
    switch (event) {
        case 'fajr':
            return data.prayerTimes.fajr;
        case 'sunrise':
            return data.prayerTimes.sunrise;
        case 'dhuhr':
            return data.prayerTimes.dhuhr;
        case 'asr':
            return data.prayerTimes.asr;
        case 'maghrib':
            return data.prayerTimes.maghrib;
        case 'isha':
            return data.prayerTimes.isha;
        case 'middleOfTheNight':
            return data.sunnahTimes.middleOfTheNight;
        case 'lastThirdOfTheNight':
            return data.sunnahTimes.lastThirdOfTheNight;
        default:
            return null;
    }
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

    // Check if current event matches any of the specified events
    return quote.after.events.some((event) => event === currentEvent);
};

const matchesBefore = (quote: Quote, data: ComputedPrayerData): boolean => {
    if (!quote.before) {
        return true;
    }

    const now = data.date.getTime();
    const currentEvent = getCurrentEventName(data);

    // If diff is specified, check time window
    if (quote.before.diff) {
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
    }

    // If no diff specified, match only if we're in the event immediately before
    // For example: before: {events: ['dhuhr']} should only match when current event is 'sunrise'
    if (!currentEvent) {
        return false;
    }

    const allEvents = getAllEvents(data);
    const currentIndex = allEvents.findIndex((e) => e.event === currentEvent);

    if (currentIndex === -1) {
        return false;
    }

    // Get the next event after current
    const nextEvent = allEvents[currentIndex + 1];

    if (!nextEvent) {
        return false;
    }

    // Check if the next event is one of the specified events
    return quote.before.events.includes(nextEvent.event);
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
