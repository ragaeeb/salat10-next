import { FALLBACK_TIMELINE_VALUES } from '@/lib/constants';
import { clamp01, pick } from '@/lib/utils';
import type { DayData, Timeline } from '@/types/timeline';

/** Build a normalized [0..1] timeline from actual times: 0 = today's Fajr, 1 = next day's Fajr */
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
        // Fallback to fixed fractions if anything is missing (should be rare)
        return FALLBACK_TIMELINE_VALUES;
    }

    const start = tFajr.getTime();
    const end = tNextFajr.getTime();
    const span = Math.max(1, end - start);

    const toP = (d: Date) => clamp01((d.getTime() - start) / span);

    const pSunrise = toP(tSunrise);
    const pMaghrib = toP(tMaghrib);
    // Place Dhuhr at the *meridian* (midpoint between sunrise & maghrib) visually,
    // regardless of slight equation-of-time offsets in the computed 'dhuhr' label.
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

/** Where should the initial scroll be for the current time? */
export const timeToScroll = (nowMs: number, day: DayData) => {
    const fajr = pick(day.timings, 'fajr')?.getTime();
    const nextFajr = day.nextFajr?.getTime();
    if (!fajr || !nextFajr) {
        return 0;
    }

    if (nowMs <= fajr) {
        return 0; // before fajr: start at top
    }
    if (nowMs >= nextFajr) {
        return 0.999; // after next fajr: clamp near bottom
    }

    return clamp01((nowMs - fajr) / (nextFajr - fajr));
};
