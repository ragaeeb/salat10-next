/** Seconds in one hour */
export const SECONDS_PER_HOUR = 3600;

/** Sun's altitude at sunrise/sunset (accounts for refraction and solar diameter) */
export const SOLAR_ALTITUDE = -50 / 60;

/**
 * Convert degrees to radians for trigonometric calculations
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Convert radians to degrees
 *
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Normalize a number to [0, max) range using modulo
 *
 * @param num - Input number
 * @param max - Maximum value (exclusive)
 * @returns Normalized value
 */
export const normalizeToScale = (num: number, max: number) => num - max * Math.floor(num / max);

/**
 * Unwind angle to [0, 360) range
 *
 * @param angle - Input angle in degrees
 * @returns Angle normalized to 0-360
 */
export const unwindAngle = (angle: number) => normalizeToScale(angle, 360.0);

/**
 * Shift angle to [-180, 180] range
 * Useful for representing rotations with direction
 *
 * @param angle - Input angle in degrees
 * @returns Angle in range [-180, 180]
 */
export const quadrantShiftAngle = (angle: number) =>
    angle >= -180 && angle <= 180 ? angle : angle - 360 * Math.round(angle / 360);

/**
 * Add days to a date
 *
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date object
 */
export const dateByAddingDays = (date: Date, days: number) => {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
};

/**
 * Add seconds to a date
 *
 * @param date - Starting date
 * @param seconds - Number of seconds to add (can be negative)
 * @returns New date object
 */
export const dateByAddingSeconds = (date: Date, seconds: number) => new Date(date.getTime() + seconds * 1000);

/**
 * Check if a year is a leap year
 * Handles century rules correctly
 *
 * @param year - Year to check
 * @returns True if leap year
 */
export const isLeapYear = (year: number) => {
    if (year % 4 !== 0) {
        return false;
    }
    if (year % 100 === 0 && year % 400 !== 0) {
        return false;
    }
    return true;
};

/**
 * Calculate day of year (1-366)
 *
 * @param date - Date object
 * @returns Day number (1 = Jan 1)
 */
export const dayOfYear = (date: Date) => {
    const feb = isLeapYear(date.getFullYear()) ? 29 : 28;
    const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return months.slice(0, date.getMonth()).reduce((acc, value) => acc + value, 0) + date.getDate();
};

/**
 * Calculate Julian Day Number from Gregorian date
 * Uses standard astronomical formula
 *
 * @param year - Gregorian year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param hours - Fraction of day (default 0)
 * @returns Julian Day Number
 */
export const julianDay = (year: number, month: number, day: number, hours = 0) => {
    const Y = Math.trunc(month > 2 ? year : year - 1);
    const M = Math.trunc(month > 2 ? month : month + 12);
    const D = day + hours / 24;

    const A = Math.trunc(Y / 100);
    const B = Math.trunc(2 - A + Math.trunc(A / 4));

    const i0 = Math.trunc(365.25 * (Y + 4716));
    const i1 = Math.trunc(30.6001 * (M + 1));

    return i0 + i1 + D + B - 1524.5;
};

/**
 * Calculate Julian Century from Julian Day Number
 * Reference epoch: J2000.0 (January 1, 2000, 12:00 TT)
 *
 * @param julianDayValue - Julian Day Number
 * @returns Julian Centuries since J2000.0
 */
export const julianCentury = (julianDayValue: number) => (julianDayValue - 2451545.0) / 36525;

/**
 * Get short timezone name from date
 * Returns abbreviation like "EST" or "PDT"
 *
 * @param date - Date object
 * @param timeZone - IANA timezone identifier
 * @returns Short timezone name or full identifier on error
 */
export const shortTimeZone = (date: Date, timeZone: string) => {
    try {
        return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
            .formatToParts(date)
            .find((part) => part.type === 'timeZoneName')?.value;
    } catch (error) {
        console.warn('Failed to format timezone', error);
        return timeZone;
    }
};
