import { FALLBACK_TIMELINE_VALUES } from '@/lib/constants';
import { clamp01, pick } from '@/lib/utils';
import type { DayData, Timeline } from '@/types/timeline';

/**
 * Build normalized timeline from actual prayer times
 * Converts absolute timestamps to [0..1] range where:
 * - 0 = today's Fajr
 * - 1 = tomorrow's Fajr
 *
 * Returns fallback values if any times are missing (rare edge case)
 *
 * Special handling:
 * - Dhuhr positioned at visual midpoint between sunrise and Maghrib
 *   (accounts for equation of time without visual jump)
 *
 * @param day - Day data with timings and next Fajr
 * @returns Timeline with normalized event positions [0..1]
 */
export function buildTimeline(day: DayData): Timeline {
    const tFajr = pick(day.timings, 'fajr');
    const tSunrise = pick(day.timings, 'sunrise');
    const tDhuhr = pick(day.timings, 'dhuhr');
    const tAsr = pick(day.timings, 'asr');
    const tMaghrib = pick(day.timings, 'maghrib');
    const tIsha = pick(day.timings, 'isha');
    const tMid = pick(day.timings, 'middleOfTheNight');
    const tLast = pick(day.timings, 'lastThirdOfTheNight');
    const tNextFajr = day.nextFajr;

    if (!tFajr || !tSunrise || !tDhuhr || !tAsr || !tMaghrib || !tIsha || !tMid || !tLast || !tNextFajr) {
        return FALLBACK_TIMELINE_VALUES;
    }

    const start = tFajr.getTime();
    const end = tNextFajr.getTime();
    const span = Math.max(1, end - start);

    const toP = (d: Date) => clamp01((d.getTime() - start) / span);

    const pSunrise = toP(tSunrise);
    const pMaghrib = toP(tMaghrib);
    const pDhuhr = (pSunrise + pMaghrib) / 2;

    return {
        asr: toP(tAsr),
        dhuhr: pDhuhr,
        end: 1,
        fajr: 0,
        isha: toP(tIsha),
        lastThird: toP(tLast),
        maghrib: pMaghrib,
        midNight: toP(tMid),
        sunrise: pSunrise,
    };
}

/**
 * Calculate initial scroll position for current time
 * Maps current timestamp to timeline position [0..1]
 *
 * Handles edge cases:
 * - Before Fajr: scroll to top (0)
 * - After next Fajr: clamp near bottom (0.999)
 * - Between: interpolate position
 *
 * @param nowMs - Current timestamp in milliseconds
 * @param day - Day data with timings
 * @returns Scroll position [0..1]
 */
export const timeToScroll = (nowMs: number, day: DayData) => {
    const fajr = pick(day.timings, 'fajr')?.getTime();
    const nextFajr = day.nextFajr?.getTime();
    if (!fajr || !nextFajr) {
        return 0;
    }

    if (nowMs <= fajr) {
        return 0;
    }
    if (nowMs >= nextFajr) {
        return 0.999;
    }

    return clamp01((nowMs - fajr) / (nextFajr - fajr));
};
