/**
 * Get cached time formatter for a timezone
 * Uses Intl.DateTimeFormat for localized 12-hour time formatting
 *
 * @param timeZone - IANA timezone identifier
 * @returns Intl.DateTimeFormat instance
 */
const getTimeFormatter = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true, minute: '2-digit', timeZone });

/**
 * Get cached date formatter for a timezone
 * Includes weekday, full month name, day, and year
 *
 * @param timeZone - IANA timezone identifier
 * @returns Intl.DateTimeFormat instance
 */
const getDateFormatter = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', timeZone, weekday: 'long', year: 'numeric' });

/**
 * Format a Date object as time string in specific timezone
 *
 * @param date - Date to format
 * @param timeZone - IANA timezone identifier
 * @returns Formatted time like "9:30 AM" or fallback on error
 */
export const formatTimeInZone = (date: Date, timeZone: string) => {
    try {
        return getTimeFormatter(timeZone).format(date);
    } catch (error) {
        console.warn('Failed to format time', error);
        return date.toLocaleTimeString();
    }
};

/**
 * Format a Date object as full date string in specific timezone
 *
 * @param date - Date to format
 * @param timeZone - IANA timezone identifier
 * @returns Formatted date like "Monday, January 15, 2024" or fallback on error
 */
export const formatDateInZone = (date: Date, timeZone: string) => {
    try {
        return getDateFormatter(timeZone).format(date);
    } catch (error) {
        console.warn('Failed to format date', error);
        return date.toDateString();
    }
};

/**
 * Format a number with fixed decimal places
 * Returns em-dash (—) for non-finite values
 *
 * @param value - Number to format
 * @param fractionDigits - Number of decimal places (default 2)
 * @returns Formatted number string or "—"
 */
export const formatNumber = (value: number, fractionDigits = 2) =>
    Number.isFinite(value) ? value.toFixed(fractionDigits) : '—';

/**
 * Format an angle value with degree symbol
 *
 * @param value - Angle in degrees
 * @param fractionDigits - Decimal places (default 2)
 * @returns Formatted string like "18.00°"
 */
export const formatAngle = (value: number, fractionDigits = 2) => `${formatNumber(value, fractionDigits)}°`;

/**
 * Format a duration in minutes with "minutes" label
 *
 * @param minutes - Duration in minutes
 * @param fractionDigits - Decimal places (default 1)
 * @returns Formatted string like "45.5 minutes"
 */
export const formatMinutes = (minutes: number, fractionDigits = 1) =>
    `${formatNumber(minutes, fractionDigits)} minutes`;

/**
 * Describe a night fraction as percentage
 *
 * @param portion - Fraction of night (0-1)
 * @returns Formatted string like "33.33% of the night"
 */
export const describeNightFraction = (portion: number) => `${formatNumber(portion * 100, 2)}% of the night`;
