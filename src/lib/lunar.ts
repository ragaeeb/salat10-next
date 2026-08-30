/**
 * Lunar Phase Calculator
 *
 * Lightweight astronomical lunar phase calculation using a mean synodic month
 * of 29.530588853 days from the J2000 epoch new moon (2000-01-06 18:14 UTC).
 * Matches the algorithm in salat10-ios LunarPhaseCalculator.swift.
 */

export const MEAN_SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_MS = 947182440000; // 2000-01-06 18:14:00 UTC
const MS_PER_DAY = 86400000;

export type LunarPhaseName =
    | 'New Moon'
    | 'Waxing Crescent'
    | 'First Quarter'
    | 'Waxing Gibbous'
    | 'Full Moon'
    | 'Waning Gibbous'
    | 'Last Quarter'
    | 'Waning Crescent';

export type LunarPhase = {
    /** 0.0 to 1.0 cycle fraction (0=New, 0.5=Full, 1.0=Next New) */
    cycleFraction: number;
    /** Emoji symbol representing the lunar phase */
    emoji: string;
    /** 0.0 (dark) to 1.0 (fully lit) */
    illuminatedFraction: number;
    /** Standard English name of the phase */
    name: LunarPhaseName;
};

const PHASE_NAMES: { emoji: string; name: LunarPhaseName }[] = [
    { emoji: '🌑', name: 'New Moon' },
    { emoji: '🌒', name: 'Waxing Crescent' },
    { emoji: '🌓', name: 'First Quarter' },
    { emoji: '🌔', name: 'Waxing Gibbous' },
    { emoji: '🌕', name: 'Full Moon' },
    { emoji: '🌖', name: 'Waning Gibbous' },
    { emoji: '🌗', name: 'Last Quarter' },
    { emoji: '🌘', name: 'Waning Crescent' },
];

/**
 * Get lunar phase details from a normalized cycle fraction (0.0 to 1.0)
 *
 * @param cycleFraction - Cycle fraction (0.0=New, 0.5=Full, 1.0=Next New)
 * @returns LunarPhase with name, emoji, and illuminated fraction
 */
export function getLunarPhaseForCycle(cycleFraction: number): LunarPhase {
    const normalized = cycleFraction % 1.0;
    const safeFraction = normalized >= 0 ? normalized : normalized + 1.0;
    const illumination = (1.0 - Math.cos(2.0 * Math.PI * safeFraction)) / 2.0;

    const phaseIndex = Math.floor(safeFraction * 8.0 + 0.5) % 8;
    const { emoji, name } = PHASE_NAMES[phaseIndex] ?? PHASE_NAMES[0]!;

    return {
        cycleFraction: safeFraction,
        emoji,
        illuminatedFraction: Math.min(Math.max(illumination, 0.0), 1.0),
        name,
    };
}

/**
 * Calculate lunar phase for any given Gregorian Date
 *
 * @param date - Date to calculate lunar phase for
 * @returns LunarPhase info at that date
 */
export function calculateLunarPhase(date: Date): LunarPhase {
    const elapsedDays = (date.getTime() - REFERENCE_NEW_MOON_MS) / MS_PER_DAY;
    const elapsedCycles = elapsedDays / MEAN_SYNODIC_MONTH_DAYS;
    const cycleFraction = elapsedCycles - Math.floor(elapsedCycles);
    return getLunarPhaseForCycle(cycleFraction);
}
