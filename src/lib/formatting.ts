import type { HijriDate } from '@/types/hijri';
import { MINUTES_IN_DAY } from './constants';

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
