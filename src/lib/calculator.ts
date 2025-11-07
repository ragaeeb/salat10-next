import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { MethodValue } from '@/types/settings';
import type { SalatEvent } from './constants';
import { formatDate, formatTime } from './formatting';
import { createParameters } from './settings';

/**
 * Formatted timing entry for display
 */
export type FormattedTiming = { event: SalatEvent; isFard: boolean; label: string; time: string; value: Date };

/**
 * Configuration for prayer time calculation
 */
export type CalculationConfig = {
    fajrAngle: number;
    ishaAngle: number;
    ishaInterval: number;
    latitude: string;
    longitude: string;
    method: MethodValue;
    timeZone: string;
};

/**
 * Daily prayer times result
 */
export type DailyResult = { date: string; timings: FormattedTiming[]; nextEventTime: Date | null };

/**
 * Determines whether the provided prayer event is one of the five obligatory prayers.
 */
export const isFard = (event: string): boolean => {
    return ['asr', 'dhuhr', 'fajr', 'isha', 'maghrib'].includes(event);
};

/**
 * Formats raw prayer time objects into a sorted, display-friendly collection.
 */
const formatTimings = (
    prayerTimes: PrayerTimes,
    sunnahTimes: SunnahTimes,
    timeZone: string,
    salatLabels: Record<string, string>,
): FormattedTiming[] => {
    const labelFor = (event: SalatEvent) => salatLabels[event] ?? event;

    // Combine all times except sunset (which is same as maghrib)
    const allTimes: Record<SalatEvent, Date> = {
        asr: prayerTimes.asr,
        dhuhr: prayerTimes.dhuhr,
        fajr: prayerTimes.fajr,
        isha: prayerTimes.isha,
        lastThirdOfTheNight: sunnahTimes.lastThirdOfTheNight,
        maghrib: prayerTimes.maghrib,
        middleOfTheNight: sunnahTimes.middleOfTheNight,
        sunrise: prayerTimes.sunrise,
    };

    return Object.entries(allTimes)
        .sort(([, a], [, b]) => a.getTime() - b.getTime())
        .map(([event, value]) => ({
            event: event as SalatEvent,
            isFard: isFard(event),
            label: labelFor(event as SalatEvent),
            time: formatTime(value, timeZone),
            value,
        }));
};

/**
 * Builds the daily prayer timetable
 */
export const daily = (salatLabels: Record<string, string>, config: CalculationConfig, date: Date): DailyResult => {
    const { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone } = config;

    const params = createParameters({ fajrAngle, ishaAngle, ishaInterval, method });
    const coords = new Coordinates(Number(latitude), Number(longitude));
    const prayerTimes = new PrayerTimes(coords, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    const timings = formatTimings(prayerTimes, sunnahTimes, timeZone, salatLabels);

    // Find the next event time after current moment
    const now = Date.now();
    const nextEventTime = timings.find((t) => t.value.getTime() > now)?.value ?? null;

    return { date: formatDate(prayerTimes.fajr), nextEventTime, timings };
};

/**
 * Generates a month of prayer times for the provided target date.
 */
export const monthly = (salatLabels: Record<string, string>, config: CalculationConfig, targetDate = new Date()) => {
    const times: DailyResult[] = [];
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDayOfMonth; day += 1) {
        const date = new Date(year, month, day);
        const result = daily(salatLabels, config, date);
        times.push(result);
    }

    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });

    return { dates: times, label: `${monthName} ${year}` };
};

/**
 * Generates a year-long calendar of prayer times for the given target date.
 */
export const yearly = (salatLabels: Record<string, string>, config: CalculationConfig, targetDate = new Date()) => {
    const times: DailyResult[] = [];
    const current = new Date(targetDate.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(current.getFullYear(), 11, 31);

    while (current <= lastDayOfYear) {
        const result = daily(salatLabels, config, current);
        times.push(result);
        current.setDate(current.getDate() + 1);
    }

    return { dates: times, label: targetDate.getFullYear() };
};

/**
 * Get the active event for a given time
 *
 * Finds the most recent event that has already started (event time <= current time).
 *
 * Special case: When before today's Fajr (early morning), we need to check
 * yesterday's night prayers. To handle this, we shift night prayer times back
 * by 24 hours to see if we're in yesterday's night prayer period.
 */
export const getActiveEvent = (timings: FormattedTiming[], timestamp: number): SalatEvent | null => {
    if (!timings || timings.length === 0) {
        return null;
    }

    // Find the most recent event that has already started (forward scan from today)
    let activeEvent: SalatEvent | null = null;

    for (let i = timings.length - 1; i >= 0; i--) {
        const timing = timings[i];
        if (timing && timing.value.getTime() <= timestamp) {
            activeEvent = timing.event;
            break;
        }
    }

    // If we found an active event today, return it
    if (activeEvent) {
        return activeEvent;
    }

    // No events have started today yet - we're in early morning before Fajr
    // Check if we're in yesterday's night prayer period

    // Get the last three events (isha, middleOfTheNight, lastThirdOfTheNight)
    // These are the only events that can span into the next calendar day
    const nightEvents = timings.slice(-3);
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // Check these events as if they happened yesterday, in reverse order
    // This way we find the LATEST event that has already started
    for (let i = nightEvents.length - 1; i >= 0; i--) {
        const event = nightEvents[i];
        if (event) {
            const yesterdayTime = event.value.getTime() - TWENTY_FOUR_HOURS_MS;
            if (yesterdayTime <= timestamp) {
                return event.event;
            }
        }
    }

    // If we're before even yesterday's isha, return the last event
    return timings[timings.length - 1]?.event ?? null;
};

/**
 * Get the next event for a given time
 */
export const getNextEvent = (timings: FormattedTiming[], timestamp: number): string | null => {
    if (!timings || timings.length === 0) {
        return null;
    }
    const nextEntry = timings.find((timing) => timing.value.getTime() > timestamp);
    return nextEntry?.event ?? null;
};

/**
 * Get time remaining until next event in milliseconds
 */
export const getTimeUntilNext = (timings: FormattedTiming[], timestamp: number): number | null => {
    if (!timings || timings.length === 0) {
        return null;
    }
    const nextEntry = timings.find((timing) => timing.value.getTime() > timestamp);
    return nextEntry ? nextEntry.value.getTime() - timestamp : null;
};

/**
 * Format time remaining as "Xh Ym Zs"
 */
export const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
};
