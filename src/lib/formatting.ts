import type { DayData, Timeline } from '@/types/timeline';
import { pick } from './utils';

export const fmt = (d: Date | undefined, timeZone: string) => {
    if (d) {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            hour12: true,
            minute: '2-digit',
            timeZone,
        }).format(d);
    }

    return '';
};

export function phaseLabelAndTime(p: number, tl: Timeline, timings: DayData['timings'], tz: string) {
    if (p < tl.sunrise) {
        return { label: 'Fajr', time: fmt(pick(timings, 'fajr'), tz) };
    }
    if (p < tl.dhuhr) {
        return { label: 'Sunrise', time: fmt(pick(timings, 'sunrise'), tz) };
    }
    if (p < tl.asr) {
        return { label: 'Dhuhr', time: fmt(pick(timings, 'dhuhr'), tz) };
    }
    if (p < tl.maghrib) {
        return { label: 'Asr', time: fmt(pick(timings, 'asr'), tz) };
    }
    if (p < tl.isha) {
        return { label: 'Maghrib', time: fmt(pick(timings, 'maghrib'), tz) };
    }
    if (p < tl.midNight) {
        return { label: 'Isha', time: fmt(pick(timings, 'isha'), tz) };
    }
    if (p < tl.lastThird) {
        return { label: 'Half the Night', time: fmt(pick(timings, 'middleOfTheNight'), tz) };
    }
    return { label: 'Last 1/3 of the night', time: fmt(pick(timings, 'lastThirdOfTheNight'), tz) };
}
