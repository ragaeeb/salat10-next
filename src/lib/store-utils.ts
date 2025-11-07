import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import type { ComputedPrayerData } from '@/types/prayer';
import type { Settings } from '@/types/settings';
import { createParameters } from './settings';

/**
 * Check if coordinates in settings are valid numbers
 */
export function hasValidCoordinates(settings: Settings): boolean {
    const lat = Number.parseFloat(settings.latitude);
    const lon = Number.parseFloat(settings.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon);
}

/**
 * Compute prayer times for a given date using settings
 * Returns null if coordinates are invalid
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
 * Find the next event time from computed prayer data
 * Returns null if no next event found (will trigger midnight recalculation)
 */
export function findNextEventTime(data: ComputedPrayerData | null): Date | null {
    if (!data) {
        return null;
    }

    const now = Date.now();
    const { prayerTimes, sunnahTimes } = data;

    // All possible events in chronological order
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

    // Find the next event that hasn't happened yet
    return events.find((time) => time.getTime() > now) ?? null;
}

/**
 * Calculate milliseconds until the next event
 * If no next event, returns ms until midnight
 */
export function getMillisecondsUntilNextUpdate(data: ComputedPrayerData | null): number {
    const nextTime = findNextEventTime(data);

    if (!nextTime) {
        // No next event found, schedule for midnight to compute next day
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight.getTime() - now.getTime();
    }

    // Schedule for the next event
    const now = Date.now();
    return Math.max(0, nextTime.getTime() - now);
}
