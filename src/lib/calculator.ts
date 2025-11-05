import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { MethodValue } from '@/types/settings';
import { formatDate, formatTime } from './formatting';
import { createParameters } from './settings';

/**
 * Formats raw prayer time objects into a sorted, display-friendly collection.
 */
type FormattedTiming = { event: string; isFard: boolean; label: string; time: string; value: Date };

const formatAsObject = (
    { sunset, ...calculationResult }: Record<string, Date>,
    timeZone: string,
    salatLabels: Record<string, string>,
) => {
    const labelFor = (event: string) => salatLabels[event] ?? event;
    const timings: FormattedTiming[] = Object.entries(calculationResult)
        .sort(([, value], [, nextValue]) => value.getTime() - nextValue.getTime())
        .map(([event, t]) => ({
            event,
            isFard: isFard(event),
            label: labelFor(event),
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
    now: Date,
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
    const nowMs = now.getTime();
    const activeEntry = [...result.timings].reverse().find((timing) => nowMs >= timing.value.getTime());
    const fallbackEntry = result.timings[0];
    const activeEvent = activeEntry?.event ?? fallbackEntry?.event ?? null;
    const activeLabel = activeEvent
        ? (result.timings.find((timing) => timing.event === activeEvent)?.label ??
          salatLabels[activeEvent] ??
          activeEvent)
        : null;

    return { ...result, activeEvent, activeLabel, currentPrayer: currentPrayer === 'none' ? null : currentPrayer };
};

/**
 * Generates a month of prayer times for the provided target date.
 */
export const monthly = (salatLabels: Record<string, string>, calculation: Calculation, targetDate = new Date()) => {
    const times = [];
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDayOfMonth; day += 1) {
        const now = new Date(year, month, day);
        const timings = daily(salatLabels, calculation, now);
        times.push(timings);
    }

    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });

    return { dates: times, label: `${monthName} ${year}` };
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
