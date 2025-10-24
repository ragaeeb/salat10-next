import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';

import { createParameters, type MethodValue } from './settings';

const ONE_HOUR = 60 * 60 * 1000;
const FRIDAY = 5;

/**
 * Formats a JavaScript date into a localized 12-hour time string.
 */
const formatTime = (t: Date, timeZone: string) => {
    const time = new Date(t).toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
        minute: '2-digit',
        timeZone,
    });
    return time;
};

const formatDate = (fajr: Date) =>
    new Date(fajr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' });

/**
 * Returns a list of formatted times ordered from earliest to latest.
 * @param {*} calculationResult The result of the calculation times (object).
 * @param {*} latitude
 * @param {*} longitude
 */
/**
 * Formats raw prayer time objects into a sorted, display-friendly collection.
 */
type FormattedTiming = { event: string; isFard: boolean; label: string; time: string; value: Date };

const formatAsObject = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { sunset, ...calculationResult }: Record<string, Date>,
    timeZone: string,
    salatLabels: Record<string, string>,
) => {
    const timings: FormattedTiming[] = Object.entries(calculationResult)
        .sort(([, value], [, nextValue]) => value.getTime() - nextValue.getTime())
        .map(([event, t]) => ({
            event,
            isFard: isFard(event),
            label: salatLabels[event] ?? event,
            time: formatTime(t, timeZone),
            value: t,
        }));

    return { date: formatDate(calculationResult.fajr!), timings };
};

type Calculation = {
    fajrAngle: number;
    ishaAngle: number;
    ishaInterval: number;
    latitude: string;
    longitude: string;
    method: MethodValue;
    timeZone: string;
};

/**
 * Builds the daily prayer timetable along with metadata for the active prayer and istijaba reminder.
 */
export const daily = (
    salatLabels: Record<string, string>,
    { fajrAngle, ishaAngle, ishaInterval, latitude, longitude, method, timeZone }: Calculation,
    now = new Date(),
) => {
    const params = createParameters({ fajrAngle, ishaAngle, ishaInterval, method });
    const fard = new PrayerTimes(new Coordinates(Number(latitude), Number(longitude)), now, params);
    const sunan = new SunnahTimes(fard);
    const {
        calculationParameters: _calcParameters,
        coordinates: _coordinates,
        date: _date,
        ...rest
    } = { ...fard, ...sunan };

    const result = formatAsObject(rest, timeZone, salatLabels);
    const currentPrayer = fard.currentPrayer(now);
    const nextPrayer = fard.nextPrayer(now);
    const nowMs = now.getTime();
    const activeEntry = [...result.timings].reverse().find((timing) => nowMs >= timing.value.getTime());
    const fallbackEntry = result.timings[0];
    const activeEvent = activeEntry?.event ?? fallbackEntry?.event ?? null;

    const base = {
        ...result,
        activeEvent,
        currentPrayer: currentPrayer === 'none' ? null : currentPrayer,
        istijaba: false,
    };

    if (nextPrayer === 'none') {
        return base;
    }

    const diff = fard.timeForPrayer(nextPrayer)!.getTime() - now.getTime();

    return { ...base, istijaba: now.getDay() === FRIDAY && nextPrayer === 'maghrib' && diff < ONE_HOUR };
};

/**
 * Generates a month of prayer times for the provided target date.
 */
export const monthly = (salatLabels: Record<string, string>, calculation: Calculation, targetDate = new Date()) => {
    const times = [];
    const now = new Date(targetDate.getTime());
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // https://stackoverflow.com/questions/222309/calculate-last-day-of-month-in-javascript

    for (let i = 1; i <= 31; i += 1) {
        now.setDate(i);
        const timings = daily(salatLabels, calculation, now);
        times.push(timings);

        if (now > lastDayOfMonth) {
            break;
        }
    }

    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    return { dates: times, label: `${monthName} ${targetDate.getFullYear()}` };
};

/**
 * Generates a year-long calendar of prayer times for the given target date.
 */
export const yearly = (salatLabels: Record<string, string>, calculation: Calculation, targetDate = new Date()) => {
    const times = [];
    const now = new Date(targetDate.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(now.getFullYear(), 11, 31);

    while (now <= lastDayOfYear) {
        const timings = daily(salatLabels, calculation, now);
        times.push(timings);

        now.setDate(now.getDate() + 1);
    }

    return { dates: times, label: targetDate.getFullYear() };
};

/**
 * Determines whether the provided prayer event is one of the five obligatory prayers.
 */
export const isFard = (event: string) => ['asr', 'dhuhr', 'fajr', 'isha', 'maghrib'].includes(event);
