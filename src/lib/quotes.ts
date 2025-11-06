import type { ComputedPrayerData } from '@/store/usePrayerStore';
import type { HijriDate } from '@/types/hijri';
import type { Quote } from '@/types/quote';
import { writeIslamicDate } from './hijri';

export const filterQuotesByPresent = (data: ComputedPrayerData, quotes: Quote[]) => {
    const hijri = writeIslamicDate(0, data.date);
    const next = data.prayerTimes.nextPrayer();
    const currentPrayer = data.prayerTimes.currentPrayer();

    return quotes;
};

export const getRandomQuote = (current: ComputedPrayerData, quotes: Quote[]) => {
    const filtered = filterQuotesByPresent(current, quotes);
    return filtered[0];
};
