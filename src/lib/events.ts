import { Prayer, type PrayerTimes } from 'adhan';

const ONE_HOUR = 60 * 60 * 1000;
const FRIDAY = 5;

export const isIstijabah = (times: PrayerTimes) => {
    const next = times.nextPrayer();
    const diff = times.timeForPrayer(next)!.getTime() - times.date.getTime();

    return times.date.getDay() === FRIDAY && next === Prayer.Maghrib && diff < ONE_HOUR;
};
