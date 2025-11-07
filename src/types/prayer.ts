import type { PrayerTimes, SunnahTimes } from 'adhan';

export type ComputedPrayerData = { date: Date; prayerTimes: PrayerTimes; sunnahTimes: SunnahTimes; computedAt: number };
