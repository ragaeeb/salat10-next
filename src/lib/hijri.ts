import type { HijriDate } from '@/types/hijri';

/**
 * Generalized modulo function that handles negative numbers correctly
 * Used for wrapping weekday calculations
 *
 * @param n - Number to take modulo of
 * @param m - Modulo divisor
 * @returns Result in range [0, m)
 */
const gmod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Arabic transliterated names for days of the week
 * Index 0 = Sunday (al-ʾAḥad), Index 6 = Saturday (al-Sabt)
 */
const weekdayNames = ['al-ʾAḥad', 'al-ʾIthnayn', 'ath-Thulāthāʾ', 'al-ʾArbiʿāʾ', 'al-Khamīs', 'al-Jumuʿah', 'al-Sabt'];

/**
 * Arabic transliterated names for Islamic calendar months
 * Index 0 = al-Muḥarram (month 1), Index 11 = Ḏū ʾl-Ḥijjah (month 12)
 */
const islamicMonthNames = [
    'al-Muḥarram',
    'Ṣafar',
    'Rabīʿ al-ʾAwwal',
    'Rabīʿ al-ʾĀkhir',
    'Jumadā al-ʾŪlā',
    'Jumādā al-ʾĀkhirah',
    'Rajab',
    'Shaʿbān',
    'Ramaḍān',
    'Shawwāl',
    'Ḏū ʾl-Qaʿdah',
    'Ḏū ʾl-Ḥijjah',
];

/**
 * Kuwaiti algorithm constant: total days in 30-year Islamic calendar cycle
 * 30 years × 354.36667 days/year ≈ 10631 days
 */
const KUWAITI_CYCLE_DAYS = 10631;

/**
 * Kuwaiti algorithm constant: average length of Islamic year
 * 10631 days / 30 years = 354.36667 days
 */
const KUWAITI_AVERAGE_YEAR = KUWAITI_CYCLE_DAYS / 30;

/**
 * Kuwaiti algorithm constant: Julian Day Number for Islamic epoch
 * Corresponds to July 16, 622 CE (first day of Muharram 1 AH)
 */
const KUWAITI_EPOCH = 1948084;

/**
 * Kuwaiti algorithm constant: correction shift in days
 * Fine-tunes the calendar to match astronomical observations
 */
const KUWAITI_SHIFT = 8.01 / 60;

/**
 * Complete result from Kuwaiti algorithm calculation
 * Contains both Gregorian and Islamic calendar components
 */
type KuwaitiResult = {
    /** Gregorian day of month */
    ceDay: number;
    /** Gregorian month (1-12) */
    ceMonth: number;
    /** Gregorian year */
    ceYear: number;
    /** Julian Day Number (JDN - 1) */
    julianDayNumber: number;
    /** Raw Julian Day Number */
    rawJulianDay: number;
    /** Weekday index (0=Sunday, 6=Saturday) */
    weekdayIndex: number;
    /** Islamic day of month */
    islamicDay: number;
    /** Islamic month index (0-11, where 0=Muharram) */
    islamicMonthIndex: number;
    /** Islamic year (Anno Hegirae) */
    islamicYear: number;
    /** Number of complete 30-year cycles since epoch */
    cycleIndex: number;
    /** Remaining days after removing complete cycles */
    remainderAfterCycles: number;
    /** Remaining days after removing complete years */
    remainderAfterYears: number;
    /** Raw month calculation (1-13, clamped to 12) */
    rawMonth: number;
};

/**
 * Kuwaiti algorithm for Gregorian to Islamic calendar conversion
 * Implements tabular Islamic calendar with optimizations
 *
 * Algorithm steps:
 * 1. Adjust date by offset if provided
 * 2. Calculate Julian Day Number from Gregorian date
 * 3. Calculate weekday from JDN
 * 4. Calculate days since Islamic epoch (622 CE)
 * 5. Divide into 30-year cycles
 * 6. Extract year within cycle
 * 7. Calculate month and day
 *
 * @param adjust - Number of days to adjust (positive or negative)
 * @param now - Gregorian date to convert
 * @returns Complete calculation result with both calendar systems
 */
const kuwaiticalendar = (adjust: number, now: Date): KuwaitiResult => {
    let today = now;

    if (adjust) {
        const adjustMilliseconds = 1000 * 60 * 60 * 24 * adjust;
        const todayMilliseconds = today.getTime() + adjustMilliseconds;
        today = new Date(todayMilliseconds);
    }

    let day = today.getDate();
    let month = today.getMonth();
    let year = today.getFullYear();
    let m = month + 1;
    let y = year;
    if (m < 3) {
        y -= 1;
        m += 12;
    }

    let a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);
    if (y < 1583) {
        b = 0;
    }
    if (y === 1582) {
        if (m > 10) {
            b = -10;
        }
        if (m === 10) {
            b = 0;
            if (day > 4) {
                b = -10;
            }
        }
    }

    const rawJulianDay = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

    b = 0;
    if (rawJulianDay > 2299160) {
        a = Math.floor((rawJulianDay - 1867216.25) / 36524.25);
        b = 1 + a - Math.floor(a / 4);
    }
    const bb = rawJulianDay + b + 1524;
    let cc = Math.floor((bb - 122.1) / 365.25);
    const dd = Math.floor(365.25 * cc);
    const ee = Math.floor((bb - dd) / 30.6001);
    day = bb - dd - Math.floor(30.6001 * ee);
    month = ee - 1;
    if (ee > 13) {
        cc += 1;
        month = ee - 13;
    }
    year = cc - 4716;
    const weekdayIndex = adjust ? gmod(rawJulianDay + 1 - adjust, 7) : gmod(rawJulianDay + 1, 7);

    let remainderAfterCycles = rawJulianDay - KUWAITI_EPOCH;
    const cycleIndex = Math.floor(remainderAfterCycles / KUWAITI_CYCLE_DAYS);
    remainderAfterCycles -= KUWAITI_CYCLE_DAYS * cycleIndex;
    const yearsInCycle = Math.floor((remainderAfterCycles - KUWAITI_SHIFT) / KUWAITI_AVERAGE_YEAR);
    const islamicYear = 30 * cycleIndex + yearsInCycle;
    const remainderAfterYears = remainderAfterCycles - Math.floor(yearsInCycle * KUWAITI_AVERAGE_YEAR + KUWAITI_SHIFT);
    let rawMonth = Math.floor((remainderAfterYears + 28.5001) / 29.5);
    if (rawMonth === 13) {
        rawMonth = 12;
    }

    const islamicDay = Math.floor(remainderAfterYears - Math.floor(29.5001 * rawMonth - 29));
    const islamicMonthIndex = rawMonth - 1;

    return {
        ceDay: day,
        ceMonth: month,
        ceYear: year,
        cycleIndex,
        islamicDay,
        islamicMonthIndex,
        islamicYear,
        julianDayNumber: rawJulianDay - 1,
        rawJulianDay,
        rawMonth,
        remainderAfterCycles,
        remainderAfterYears,
        weekdayIndex,
    };
};

/**
 * Detailed explanation of Hijri conversion process
 * Used for educational/documentation purposes
 */
export type HijriExplanation = {
    /** Arabic weekday name */
    weekdayName: string;
    /** Julian Day Number for the date */
    julianDayNumber: number;
    /** Days since Islamic epoch (622 CE) */
    offsetFromEpoch: number;
    /** Algorithm constants used in calculation */
    constants: { epoch: number; cycleDays: number; averageYear: number; shift: number };
    /** Cycle calculation breakdown */
    cycle: { index: number; remainderDays: number; yearsIntoCycle: number; remainderAfterYears: number };
    /** Islamic date components */
    islamic: { day: number; monthIndex: number; monthName: string; year: number };
    /** Month calculation details */
    monthCalculation: { rawMonth: number };
};

/**
 * Generate detailed explanation of Hijri calendar conversion
 * Useful for displaying step-by-step calculation in UI
 *
 * @param adjustment - Days to adjust (0 for no adjustment)
 * @param today - Gregorian date to convert
 * @returns Detailed explanation with all intermediate values
 */
export const explainHijriConversion = (adjustment: number, today: Date): HijriExplanation => {
    const result = kuwaiticalendar(adjustment, today);
    const yearsIntoCycle = result.islamicYear - 30 * result.cycleIndex;
    const safeMonthIndex = Math.min(Math.max(result.islamicMonthIndex, 0), islamicMonthNames.length - 1);
    const monthName = islamicMonthNames[safeMonthIndex] ?? islamicMonthNames[0]!;
    const safeWeekdayIndex = Math.min(Math.max(result.weekdayIndex, 0), weekdayNames.length - 1);
    const weekdayName = weekdayNames[safeWeekdayIndex] ?? weekdayNames[0]!;

    return {
        constants: {
            averageYear: KUWAITI_AVERAGE_YEAR,
            cycleDays: KUWAITI_CYCLE_DAYS,
            epoch: KUWAITI_EPOCH,
            shift: KUWAITI_SHIFT,
        },
        cycle: {
            index: result.cycleIndex,
            remainderAfterYears: result.remainderAfterYears,
            remainderDays: result.remainderAfterCycles,
            yearsIntoCycle,
        },
        islamic: { day: result.islamicDay, monthIndex: result.islamicMonthIndex, monthName, year: result.islamicYear },
        julianDayNumber: result.julianDayNumber,
        monthCalculation: { rawMonth: result.rawMonth },
        offsetFromEpoch: result.rawJulianDay - KUWAITI_EPOCH,
        weekdayName,
    };
};

/**
 * Convert Gregorian date to Islamic date (simplified result)
 *
 * @param adjustment - Days to adjust (0 for current date)
 * @param today - Gregorian date to convert
 * @returns Islamic date with weekday and month names
 */
export const writeIslamicDate = (adjustment: number, today: Date): HijriDate => {
    const explained = explainHijriConversion(adjustment, today);
    return {
        date: explained.islamic.day,
        day: explained.weekdayName,
        month: explained.islamic.monthName,
        monthIndex: explained.islamic.monthIndex,
        year: explained.islamic.year,
    };
};
