import type { HijriDate } from '@/types/hijri';
import type { DayData, Timeline } from '@/types/timeline';
import { MINUTES_IN_DAY, salatLabels } from './constants';
import { pick } from './utils';

/**
 * Format a Date object as localized 12-hour time string
 *
 * @param t - Date object to format
 * @param timeZone - IANA timezone identifier
 * @returns Formatted time string like "9:30 AM"
 */
export const formatTime = (t: Date, timeZone: string) => {
    const time = new Date(t).toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
        minute: '2-digit',
        timeZone,
    });
    return time;
};

/**
 * Format a Date object as full localized date string
 *
 * @param date - Date object to format
 * @returns Formatted string like "Monday, January 15, 2024"
 */
export const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' });
};

/**
 * Format minutes since midnight as 12-hour time label
 * Handles wraparound and normalization for chart displays
 *
 * @param value - Minutes since midnight (can exceed 1440 for next-day times)
 * @returns Formatted time string like "9:30 AM"
 */
export const formatMinutesLabel = (value: number) => {
    if (!Number.isFinite(value)) {
        return '';
    }
    const normalized = ((Math.round(value) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHour = ((hours + 11) % 12) + 1;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
};

/**
 * Format Hijri date as human-readable string
 *
 * @param hijri - Hijri date object
 * @returns Formatted string like "al-Jumuʿah, 15 Ramaḍān 1445 AH"
 */
export const formatHijriDate = (hijri: HijriDate) => {
    return `${hijri.day}, ${hijri.date} ${hijri.month} ${hijri.year} AH`;
};

/**
 * Format a coordinate with direction label
 *
 * @param value - Coordinate value in degrees
 * @param positiveLabel - Label for positive values (e.g., "N", "E")
 * @param negativeLabel - Label for negative values (e.g., "S", "W")
 * @returns Formatted string like "43.6532° N"
 */
export const formatCoordinate = (value: number, positiveLabel: string, negativeLabel: string) => {
    return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positiveLabel : negativeLabel}`;
};

/**
 * Get prayer phase label and time at a given timeline position
 * Used for parallax view phase indicator
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline with normalized event positions
 * @param timings - Array of timing entries
 * @param tz - IANA timezone identifier
 * @returns Object with label and formatted time
 */
export function phaseLabelAndTime(p: number, tl: Timeline, timings: DayData['timings'], tz: string) {
    if (p < tl.sunrise) {
        return { label: salatLabels.fajr, time: formatTime(pick(timings, 'fajr')!, tz) };
    }
    if (p < tl.dhuhr) {
        return { label: salatLabels.sunrise, time: formatTime(pick(timings, 'sunrise')!, tz) };
    }
    if (p < tl.asr) {
        return { label: salatLabels.dhuhr, time: formatTime(pick(timings, 'dhuhr')!, tz) };
    }
    if (p < tl.maghrib) {
        return { label: salatLabels.asr, time: formatTime(pick(timings, 'asr')!, tz) };
    }
    if (p < tl.isha) {
        return { label: salatLabels.maghrib, time: formatTime(pick(timings, 'maghrib')!, tz) };
    }
    if (p < tl.midNight) {
        return { label: salatLabels.isha, time: formatTime(pick(timings, 'isha')!, tz) };
    }
    if (p < tl.lastThird) {
        return { label: salatLabels.middleOfTheNight, time: formatTime(pick(timings, 'middleOfTheNight')!, tz) };
    }
    return { label: salatLabels.lastThirdOfTheNight, time: formatTime(pick(timings, 'lastThirdOfTheNight')!, tz) };
}
