import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { MethodValue } from '@/types/settings';
import { formatDate, formatTime } from './formatting';
import { createParameters } from './settings';

/**
 * Formatted timing entry for display
 */
export type FormattedTiming = { event: string; isFard: boolean; label: string; time: string; value: Date };

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
export type DailyResult = { date: string; timings: FormattedTiming[] };

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
    const labelFor = (event: string) => salatLabels[event] ?? event;

    // Combine all times except sunset (which is same as maghrib)
    const allTimes: Record<string, Date> = {
        asr: prayerTimes.asr,
        dhuhr: prayerTimes.dhuhr,
        fajr: prayerTimes.fajr,
        isha: prayerTimes.isha,
        lastThirdOfTheNight: sunnahTimes.lastThirdOfTheNight,
        maghrib: prayerTimes.maghrib,
        middleOfTheNight: sunnahTimes.middleOfTheNight,
        sunrise: prayerTimes.sunrise,
    };
    console.log('curr', prayerTimes.currentPrayer());
    console.log('next', prayerTimes.nextPrayer());
    console.log('allTimes', allTimes);

    return Object.entries(allTimes)
        .sort(([, a], [, b]) => a.getTime() - b.getTime())
        .map(([event, value]) => ({
            event,
            isFard: isFard(event),
            label: labelFor(event),
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

    return { date: formatDate(prayerTimes.fajr), timings };
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
 */
export const getActiveEvent = (timings: FormattedTiming[], timestamp: number): string | null => {
    const activeEntry = [...timings].reverse().find((timing) => timestamp >= timing.value.getTime());
    return activeEntry?.event ?? timings[0]?.event ?? null;
};

/**
 * Get the next event for a given time
 */
export const getNextEvent = (timings: FormattedTiming[], timestamp: number): string | null => {
    const nextEntry = timings.find((timing) => timing.value.getTime() > timestamp);
    return nextEntry?.event ?? null;
};
