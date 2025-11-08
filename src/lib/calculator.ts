import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { MethodValue } from '@/types/settings';
import type { SalatEvent } from './constants';
import { formatDate, formatTime } from './formatting';
import { createParameters } from './settings';

/**
 * Formatted timing entry for display in UI
 * Combines event metadata with human-readable labels and times
 */
export type FormattedTiming = {
    /** Prayer event identifier */
    event: SalatEvent;
    /** Whether this is one of the five obligatory prayers */
    isFard: boolean;
    /** Human-readable label for the event */
    label: string;
    /** Formatted time string in local timezone */
    time: string;
    /** Actual Date object for calculations */
    value: Date;
};

/**
 * Configuration parameters for prayer time calculation
 * Extracted from Settings for testability
 */
export type CalculationConfig = {
    /** Fajr angle below horizon in degrees */
    fajrAngle: number;
    /** Isha angle below horizon in degrees */
    ishaAngle: number;
    /** Fixed interval after Maghrib for Isha (minutes), 0 for angle-based */
    ishaInterval: number;
    /** Latitude as string (from form input) */
    latitude: string;
    /** Longitude as string (from form input) */
    longitude: string;
    /** Calculation method preset */
    method: MethodValue;
    /** IANA timezone identifier */
    timeZone: string;
};

/**
 * Daily prayer times calculation result
 * Includes all timings and metadata for a single day
 */
export type DailyResult = {
    /** Formatted date string */
    date: string;
    /** Array of all prayer/sunnah times in chronological order */
    timings: FormattedTiming[];
    /** Time of next event, or null if all events passed */
    nextEventTime: Date | null;
};

/**
 * Check if a prayer event is one of the five obligatory (fard) prayers
 *
 * @param event - Prayer event name
 * @returns True if the event is Fajr, Dhuhr, Asr, Maghrib, or Isha
 */
export const isFard = (event: string): boolean => {
    return ['asr', 'dhuhr', 'fajr', 'isha', 'maghrib'].includes(event);
};

/**
 * Format raw prayer time objects into sorted, display-friendly collection
 * Combines five obligatory prayers with sunnah times (sunrise, middle/last third of night)
 * Excludes sunset as it's identical to Maghrib
 *
 * @param prayerTimes - Calculated prayer times from Adhan library
 * @param sunnahTimes - Calculated sunnah times (night portions)
 * @param timeZone - IANA timezone for formatting
 * @param salatLabels - Event name to label mapping
 * @returns Sorted array of formatted timings
 */
const formatTimings = (
    prayerTimes: PrayerTimes,
    sunnahTimes: SunnahTimes,
    timeZone: string,
    salatLabels: Record<string, string>,
): FormattedTiming[] => {
    const labelFor = (event: SalatEvent) => salatLabels[event] ?? event;

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
 * Calculate daily prayer timetable for a specific date
 * Uses Adhan library for astronomical calculations
 *
 * @param salatLabels - Event name to human-readable label mapping
 * @param config - Calculation configuration (coordinates, angles, method)
 * @param date - Target date for calculation
 * @returns Daily result with formatted timings and next event time
 */
export const daily = (salatLabels: Record<string, string>, config: CalculationConfig, date: Date): DailyResult => {
    const { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone } = config;

    const params = createParameters({ fajrAngle, ishaAngle, ishaInterval, method });
    const coords = new Coordinates(Number(latitude), Number(longitude));
    const prayerTimes = new PrayerTimes(coords, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    const timings = formatTimings(prayerTimes, sunnahTimes, timeZone, salatLabels);

    const now = Date.now();
    const nextEventTime = timings.find((t) => t.value.getTime() > now)?.value ?? null;

    return { date: formatDate(prayerTimes.fajr), nextEventTime, timings };
};

/**
 * Generate a full month of prayer times
 * Iterates through all days in the target month
 *
 * @param salatLabels - Event name to label mapping
 * @param config - Calculation configuration
 * @param targetDate - Any date within the target month (defaults to current month)
 * @returns Object with dates array and formatted label
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
 * Generate a full year of prayer times (365 or 366 days)
 * Iterates through all days from January 1 to December 31
 *
 * @param salatLabels - Event name to label mapping
 * @param config - Calculation configuration
 * @param targetDate - Any date within the target year (defaults to current year)
 * @returns Object with dates array and year label
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
 * Get the currently active prayer event at a given timestamp
 * Handles day boundaries where night prayers from yesterday can be active
 * after midnight but before today's Fajr
 *
 * Algorithm:
 * 1. Find most recent event that has started (forward scan)
 * 2. If found, return it
 * 3. If not found (before Fajr), check yesterday's night prayers
 * 4. Shift night events back 24 hours and check if active
 *
 * @param timings - Array of formatted timings for today
 * @param timestamp - Unix timestamp in milliseconds to check
 * @returns Active event name, or null if none found
 */
export const getActiveEvent = (timings: FormattedTiming[], timestamp: number): SalatEvent | null => {
    if (!timings || timings.length === 0) {
        return null;
    }

    let activeEvent: SalatEvent | null = null;

    for (let i = timings.length - 1; i >= 0; i--) {
        const timing = timings[i];
        if (timing && timing.value.getTime() <= timestamp) {
            activeEvent = timing.event;
            break;
        }
    }

    if (activeEvent) {
        return activeEvent;
    }

    const nightEvents = timings.slice(-3);
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    for (let i = nightEvents.length - 1; i >= 0; i--) {
        const event = nightEvents[i];
        if (event) {
            const yesterdayTime = event.value.getTime() - TWENTY_FOUR_HOURS_MS;
            if (yesterdayTime <= timestamp) {
                return event.event;
            }
        }
    }

    return timings[timings.length - 1]?.event ?? null;
};

/**
 * Get the next upcoming prayer event at a given timestamp
 *
 * @param timings - Array of formatted timings
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Next event name, or null if no upcoming events today
 */
export const getNextEvent = (timings: FormattedTiming[], timestamp: number): string | null => {
    if (!timings || timings.length === 0) {
        return null;
    }
    const nextEntry = timings.find((timing) => timing.value.getTime() > timestamp);
    return nextEntry?.event ?? null;
};

/**
 * Calculate milliseconds remaining until next prayer event
 *
 * @param timings - Array of formatted timings
 * @param timestamp - Current Unix timestamp in milliseconds
 * @returns Milliseconds until next event, or null if no upcoming events
 */
export const getTimeUntilNext = (timings: FormattedTiming[], timestamp: number): number | null => {
    if (!timings || timings.length === 0) {
        return null;
    }
    const nextEntry = timings.find((timing) => timing.value.getTime() > timestamp);
    return nextEntry ? nextEntry.value.getTime() - timestamp : null;
};

/**
 * Format milliseconds into human-readable countdown string
 *
 * @param milliseconds - Time duration in milliseconds
 * @returns Formatted string like "2h 15m 30s"
 */
export const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
};
