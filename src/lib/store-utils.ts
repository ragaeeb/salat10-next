import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { ComputedPrayerData } from '@/types/prayer';
import type { Settings } from '@/types/settings';
import { createParameters } from './settings';

/**
 * Check if coordinates in settings are valid finite numbers
 * Parses string coordinates and validates they are usable
 *
 * @param settings - Application settings containing latitude/longitude strings
 * @returns True if both coordinates are valid finite numbers
 */
export function hasValidCoordinates(settings: Settings): boolean {
    const lat = Number.parseFloat(settings.latitude);
    const lon = Number.parseFloat(settings.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon);
}

/**
 * Compute prayer times for a specific date using current settings
 * Creates Adhan calculation parameters and computes prayer/sunnah times
 * Returns null if coordinates are invalid
 *
 * @param settings - Application settings with location and calculation method
 * @param date - Target date for prayer time calculation
 * @returns Computed prayer data with timestamps, or null if invalid coordinates
 */
export function computePrayerTimesForDate(settings: Settings, date: Date): ComputedPrayerData | null {
    if (!hasValidCoordinates(settings)) {
        return null;
    }

    const lat = Number.parseFloat(settings.latitude);
    const lon = Number.parseFloat(settings.longitude);
    const fajrAngle = Number.parseFloat(settings.fajrAngle);
    const ishaAngle = Number.parseFloat(settings.ishaAngle);
    const ishaInterval = Number.parseFloat(settings.ishaInterval);

    const params = createParameters({
        fajrAngle: Number.isFinite(fajrAngle) ? fajrAngle : 0,
        ishaAngle: Number.isFinite(ishaAngle) ? ishaAngle : 0,
        ishaInterval: Number.isFinite(ishaInterval) ? ishaInterval : 0,
        method: settings.method,
    });

    const coordinates = new Coordinates(lat, lon);
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    return { computedAt: Date.now(), date, prayerTimes, sunnahTimes };
}

/**
 * Find the next event time that hasn't occurred yet
 * Searches through all prayer and sunnah times chronologically
 * Returns null if all events have passed (triggers midnight recalculation)
 *
 * @param data - Computed prayer data with all event times
 * @returns Date of next event, or null if no upcoming events
 */
export function findNextEventTime(data: ComputedPrayerData | null): Date | null {
    if (!data) {
        return null;
    }

    const now = Date.now();
    const { prayerTimes, sunnahTimes } = data;

    const events = [
        prayerTimes.fajr,
        prayerTimes.sunrise,
        prayerTimes.dhuhr,
        prayerTimes.asr,
        prayerTimes.maghrib,
        prayerTimes.isha,
        sunnahTimes.middleOfTheNight,
        sunnahTimes.lastThirdOfTheNight,
    ].filter((time): time is Date => time instanceof Date);

    return events.find((time) => time.getTime() > now) ?? null;
}

/**
 * Calculate milliseconds until the next prayer time update is needed
 * If no next event found, returns time until midnight for next day calculation
 * Used for efficient auto-recalculation scheduling
 *
 * @param data - Computed prayer data
 * @returns Milliseconds until next update needed (always >= 0)
 */
export function getMillisecondsUntilNextUpdate(data: ComputedPrayerData | null): number {
    const nextTime = findNextEventTime(data);

    if (!nextTime) {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight.getTime() - now.getTime();
    }

    const now = Date.now();
    return Math.max(0, nextTime.getTime() - now);
}
