import parseDuration from 'parse-duration';
import type { HijriDate } from '@/types/hijri';
import type { ComputedPrayerData } from '@/types/prayer';
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
    const activeEvent = [...events].reverse().find((e) => e.time.getTime() <= now);

    if (activeEvent) {
        return activeEvent.event;
    }

    // If no event has occurred yet today, check if we're in yesterday's night events
    // This handles the case where we're after midnight but before today's Fajr
    const nightEvents = ['isha', 'middleOfTheNight', 'lastThirdOfTheNight'];
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // Check night events as if they happened yesterday
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event && nightEvents.includes(event.event)) {
            const yesterdayTime = event.time.getTime() - TWENTY_FOUR_HOURS_MS;
            if (yesterdayTime <= now) {
                return event.event;
            }
        }
    }

    // Fallback to last event
    return events[events.length - 1]?.event ?? null;
};

/**
 * Get the time for a specific event
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

const matchesHijriMonth = (quote: Quote, hijri: HijriDate): boolean => {
    if (!quote.hijri_months) {
        return true;
    }
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
    if (!currentEvent) {
        return false;
    }

    const allEvents = getAllEvents(data);

    // Special handling for night events that span into the next day
    // If we're in a night event (isha, middleOfTheNight, lastThirdOfTheNight),
    // we need to check if we're actually in yesterday's event
    const nightEvents = ['isha', 'middleOfTheNight', 'lastThirdOfTheNight'];
    const isInNightEvent = nightEvents.includes(currentEvent);
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    let currentIndex = -1;

    if (isInNightEvent) {
        // Check if we're actually in yesterday's version of this event
        // by seeing if today's version hasn't happened yet
        const todayEventTime = getEventTime(data, currentEvent);
        if (todayEventTime && todayEventTime.getTime() > now) {
            // We're in yesterday's event, so the next event is today's first event (fajr)
            // unless we're looking for a specific night event that comes after current one

            // Find which night event we're in
            const nightEventOrder = ['isha', 'middleOfTheNight', 'lastThirdOfTheNight'];
            const currentNightIndex = nightEventOrder.indexOf(currentEvent);

            // If there's another night event after this one, check if quote is looking for it
            if (currentNightIndex < nightEventOrder.length - 1) {
                const nextNightEvent = nightEventOrder[currentNightIndex + 1];
                if (quote.before.events.includes(nextNightEvent!)) {
                    return true;
                }
            }

            // Otherwise, next event is fajr
            return quote.before.events.includes('fajr');
        }
    }

    // Normal case - find current event in today's timeline
    currentIndex = allEvents.findIndex((e) => e.event === currentEvent);

    if (currentIndex === -1) {
        return false;
    }

    const nextIndex = currentIndex + 1;

    // If at end of day, next is tomorrow's fajr
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
