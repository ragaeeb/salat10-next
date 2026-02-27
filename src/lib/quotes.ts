import parseDuration from 'parse-duration';
import type { HijriDate } from '@/types/hijri';
import type { ComputedPrayerData } from '@/types/prayer';
import type { Quote } from '@/types/quote';
import { writeIslamicDate } from './hijri';

/**
 * Get all prayer/sunnah events with their times in chronological order
 * Used for determining current/next event timing
 *
 * @param data - Computed prayer data with all times
 * @returns Sorted array of events with timestamps
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
 * Get the current active event name based on timestamp
 * Handles day boundary where night prayers from yesterday can be active
 *
 * Algorithm:
 * 1. Find last event that has started today
 * 2. If none, check if we're in yesterday's night events (after midnight, before Fajr)
 * 3. Shift night events back 24 hours to detect yesterday's active event
 *
 * @param data - Computed prayer data
 * @returns Current event name, or null if none found
 */
const getCurrentEventName = (data: ComputedPrayerData): string | null => {
    const now = data.date.getTime();
    const events = getAllEvents(data);

    const activeEvent = [...events].reverse().find((e) => e.time.getTime() <= now);

    if (activeEvent) {
        return activeEvent.event;
    }

    const nightEvents = ['isha', 'middleOfTheNight', 'lastThirdOfTheNight'];
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event && nightEvents.includes(event.event)) {
            const yesterdayTime = event.time.getTime() - TWENTY_FOUR_HOURS_MS;
            if (yesterdayTime <= now) {
                return event.event;
            }
        }
    }

    return events[events.length - 1]?.event ?? null;
};

/**
 * Get the time for a specific event name
 *
 * @param data - Computed prayer data
 * @param event - Event name to look up
 * @returns Event timestamp, or null if not found
 */
const getEventTime = (data: ComputedPrayerData, event: string): Date | null => {
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

/**
 * Check if quote matches current Hijri month
 * If quote has no month filter, it matches all months
 *
 * @param quote - Quote to check
 * @param hijri - Current Hijri date
 * @returns True if quote should be shown in this month
 */
const matchesHijriMonth = (quote: Quote, hijri: HijriDate): boolean => {
    if (!quote.hijri_months) {
        return true;
    }
    return quote.hijri_months.includes(hijri.monthIndex + 1);
};

/**
 * Check if quote matches current Hijri date (day of month)
 * If quote has no date filter, it matches all dates
 *
 * @param quote - Quote to check
 * @param hijri - Current Hijri date
 * @returns True if quote should be shown on this date
 */
const matchesHijriDate = (quote: Quote, hijri: HijriDate): boolean => {
    if (!quote.hijri_dates) {
        return true;
    }
    return quote.hijri_dates.includes(hijri.date);
};

/**
 * Check if quote matches current weekday
 * If quote has no weekday filter, it matches all days
 *
 * @param quote - Quote to check
 * @param date - Current date
 * @returns True if quote should be shown on this weekday
 */
const matchesWeekday = (quote: Quote, date: Date): boolean => {
    if (!quote.days) {
        return true;
    }
    return quote.days.includes(date.getDay());
};

/**
 * Check if quote matches "after" filter (during specific events)
 * Example: `after: {events: ['isha']}` matches while in Isha prayer
 *
 * @param quote - Quote to check
 * @param data - Computed prayer data
 * @returns True if currently in one of the specified events
 */
const matchesAfter = (quote: Quote, data: ComputedPrayerData): boolean => {
    if (!quote.after) {
        return true;
    }

    const currentEvent = getCurrentEventName(data);
    if (!currentEvent) {
        return false;
    }

    return quote.after.events.some((event) => event === currentEvent);
};

/**
 * Check if quote matches "before" filter (time windows before events)
 *
 * Two modes:
 * 1. With `diff`: Match if within time window before event
 *    Example: `before: {events: ['maghrib'], diff: '1h'}` = within 1 hour before Maghrib
 * 2. Without `diff`: Match only if in the event immediately before
 *    Example: `before: {events: ['maghrib']}` = only during Asr (event before Maghrib)
 *
 * Handles day boundaries for night events
 *
 * @param quote - Quote to check
 * @param data - Computed prayer data
 * @returns True if conditions are met
 */
const matchesBefore = (quote: Quote, data: ComputedPrayerData): boolean => {
    if (!quote.before) {
        return true;
    }

    const now = data.date.getTime();
    const currentEvent = getCurrentEventName(data);

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

    if (!currentEvent) {
        return false;
    }

    const allEvents = getAllEvents(data);

    const nightEvents = ['isha', 'middleOfTheNight', 'lastThirdOfTheNight'];
    const isInNightEvent = nightEvents.includes(currentEvent);

    let currentIndex = -1;

    if (isInNightEvent) {
        const todayEventTime = getEventTime(data, currentEvent);
        if (todayEventTime && todayEventTime.getTime() > now) {
            const nightEventOrder = ['isha', 'middleOfTheNight', 'lastThirdOfTheNight'];
            const currentNightIndex = nightEventOrder.indexOf(currentEvent);

            if (currentNightIndex < nightEventOrder.length - 1) {
                const nextNightEvent = nightEventOrder[currentNightIndex + 1];
                if (quote.before.events.includes(nextNightEvent!)) {
                    return true;
                }
            }

            return quote.before.events.includes('fajr');
        }
    }

    currentIndex = allEvents.findIndex((e) => e.event === currentEvent);

    if (currentIndex === -1) {
        return false;
    }

    const nextIndex = currentIndex + 1;

    if (nextIndex >= allEvents.length) {
        return quote.before.events.includes('fajr');
    }

    const nextEvent = allEvents[nextIndex];
    if (!nextEvent) {
        return false;
    }

    return quote.before.events.includes(nextEvent.event);
};

/**
 * Calculate specificity score for a quote
 * More specific quotes (with more filters) are prioritized
 *
 * Score breakdown:
 * - hijri_dates: +20 (most specific)
 * - after/before: +15 each (time-specific)
 * - hijri_months: +10 (month-specific)
 * - days: +5 (weekday-specific)
 *
 * @param quote - Quote to score
 * @returns Specificity score (higher = more specific)
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

/**
 * Filter quotes by current conditions and sort by specificity
 *
 * Process:
 * 1. Apply all filters (Hijri month/date, weekday, after/before)
 * 2. If matches found, sort by specificity (most specific first)
 * 3. If no matches, return generic quotes (no filters)
 * 4. If no generic quotes, return all quotes as fallback
 *
 * @param data - Current prayer data with date/time
 * @param quotes - Array of all available quotes
 * @returns Filtered and sorted array of matching quotes
 */
export const filterQuotesByPresent = (data: ComputedPrayerData, quotes: Quote[]): Quote[] => {
    const hijri = writeIslamicDate(0, data.date);

    const filtered = quotes.filter((quote) => {
        return (
            matchesHijriMonth(quote, hijri) &&
            matchesHijriDate(quote, hijri) &&
            matchesWeekday(quote, data.date) &&
            matchesAfter(quote, data) &&
            matchesBefore(quote, data)
        );
    });

    if (filtered.length > 0) {
        return filtered.sort((a, b) => calculateSpecificity(b) - calculateSpecificity(a));
    }

    const generic = quotes.filter((q) => !q.hijri_months && !q.hijri_dates && !q.days && !q.after && !q.before);

    return generic.length > 0 ? generic : quotes;
};

/**
 * Get a random quote from filtered results
 *
 * @param current - Current prayer data
 * @param quotes - Array of all available quotes
 * @returns Random matching quote, or null if no quotes available
 */
export const getRandomQuote = (current: ComputedPrayerData, quotes: Quote[]): Quote | null => {
    const filtered = filterQuotesByPresent(current, quotes);

    if (filtered.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex]!;
};

/**
 * Format quote citation for display
 * Combines title, part/page numbers, and author
 *
 * @param quote - Quote to format citation for
 * @returns Formatted citation string like "Title, 1/123, Author"
 */
export const formatCitation = (quote: Quote): string => {
    const parts: string[] = [quote.title];

    if (quote.part_number !== undefined && quote.part_page !== undefined) {
        parts.push(`${quote.part_number}/${quote.part_page}`);
    }

    parts.push(quote.author);

    return parts.join(', ');
};
