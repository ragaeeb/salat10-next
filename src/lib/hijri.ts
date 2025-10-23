const gmod = (n: number, m: number) => ((n % m) + m) % m;

const weekdayNames = ['al-ʾAḥad', 'al-ʾIthnayn', 'ath-Thulāthāʾ', 'al-ʾArbiʿāʾ', 'al-Khamīs', 'al-Jumuʿah', 'al-Sabt'];

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
    'Ḏū al-Qaʿdah',
    'Ḏū al-Ḥijjah',
];

const KUWAITI_CYCLE_DAYS = 10631;
const KUWAITI_AVERAGE_YEAR = KUWAITI_CYCLE_DAYS / 30;
const KUWAITI_EPOCH = 1948084;
const KUWAITI_SHIFT = 8.01 / 60;

type KuwaitiResult = {
    ceDay: number;
    ceMonth: number;
    ceYear: number;
    julianDayNumber: number;
    rawJulianDay: number;
    weekdayIndex: number;
    islamicDay: number;
    islamicMonthIndex: number;
    islamicYear: number;
    cycleIndex: number;
    remainderAfterCycles: number;
    remainderAfterYears: number;
    rawMonth: number;
};

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

export type HijriExplanation = {
    weekdayName: string;
    julianDayNumber: number;
    offsetFromEpoch: number;
    constants: { epoch: number; cycleDays: number; averageYear: number; shift: number };
    cycle: { index: number; remainderDays: number; yearsIntoCycle: number; remainderAfterYears: number };
    islamic: { day: number; monthIndex: number; monthName: string; year: number };
    monthCalculation: { rawMonth: number };
};

export const explainHijriConversion = (adjustment: number, today: Date): HijriExplanation => {
    const result = kuwaiticalendar(adjustment, today);
    const yearsIntoCycle = result.islamicYear - 30 * result.cycleIndex;
    const safeMonthIndex = Math.min(
        Math.max(result.islamicMonthIndex, 0),
        islamicMonthNames.length - 1,
    );
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
        islamic: {
            day: result.islamicDay,
            monthIndex: result.islamicMonthIndex,
            monthName,
            year: result.islamicYear,
        },
        julianDayNumber: result.julianDayNumber,
        monthCalculation: { rawMonth: result.rawMonth },
        offsetFromEpoch: result.rawJulianDay - KUWAITI_EPOCH,
        weekdayName,
    };
};

export const writeIslamicDate = (adjustment: number, today: Date) => {
    const explained = explainHijriConversion(adjustment, today);
    return {
        date: explained.islamic.day,
        day: explained.weekdayName,
        month: explained.islamic.monthName,
        year: explained.islamic.year,
    };
};
