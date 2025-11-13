export const CALCULATION_METHOD_OPTIONS = [
    { label: 'Nautical Twilight (12°, 12°)', value: 'Other' },
    { label: 'Muslim World League (18°, 17°)', value: 'MuslimWorldLeague' },
    { label: 'Egyptian General Authority (19.5°, 17.5°)', value: 'Egyptian' },
    { label: 'Karachi - University of Islamic Sciences (18°, 18°)', value: 'Karachi' },
    { label: 'Umm al-Qura - Makkah (18.5°, 90 min)', value: 'UmmAlQura' },
    { label: 'Dubai (18.2°, 18.2°)', value: 'Dubai' },
    { label: 'Moonsighting Committee Worldwide (18°, 18°)', value: 'MoonsightingCommittee' },
    { label: 'North America - ISNA (15°, 15°)', value: 'NorthAmerica' },
    { label: 'Kuwait (18°, 17.5°)', value: 'Kuwait' },
    { label: 'Qatar (18°, 90 min)', value: 'Qatar' },
    { label: 'Singapore (20°, 18°)', value: 'Singapore' },
    { label: 'Turkey - Diyanet (18°, 17°)', value: 'Turkey' },
] as const;

export const defaultSettings = {
    address: '',
    fajrAngle: '12',
    ishaAngle: '12',
    ishaInterval: '0',
    latitude: '',
    longitude: '',
    method: 'Other',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    userId: '', // Will be initialized in store
} as const;

/* ================================
   Data-driven layout (no brittle constants)
================================= */

export const DISTANCE_FROM_TOP_BOTTOM = 2000;
export const DAY_HEIGHT_PX = 10000;
export const MAX_BUFFERED_DAYS = 5;

/** Screen-space positions */
export const POS = { EAST_X: 85, LOW_Y: 80, MOON_Y: 76, SUN_PEAK_Y_DELTA: 40, WEST_X: 15 } as const;

/** Seam band for inter-day crossfades (expressed as fraction of the day height) */
export const SEAM_FRAC = 0.015;

/** Transition fractions are relative to the *intervals* they act on */
export const FRAC = {
    FAJR_GLOW_TAIL_OF_SUNRISE: 0.25, // tail after sunrise (% of [fajr->sunrise] interval)
    MOON_PRE_MAGHRIB_APPEAR: 0.2, // start moon this % before maghrib (within [asr->maghrib])
    SUN_FADE_PRE_MAGHRIB: 0.25, // last % of [asr->maghrib] to fade the sun
    SUNSET_FADE_BEFORE_ISHA: 0.25, // fade sunset gradient in last % of [maghrib->isha]
    SUNSET_HOLD_AFTER_MAGHRIB: 0.25, // hold max dusk gradient for this % before fading to isha
} as const;

export const FALLBACK_TIMELINE_VALUES = {
    asr: 0.65,
    // Dhuhr at true midday between sunrise and maghrib
    dhuhr: (0.1 + 0.8) / 2,
    end: 1,
    fajr: 0,
    isha: 0.87,
    lastThird: 0.95,
    maghrib: 0.8,
    midNight: 0.93,
    sunrise: 0.1,
};

export const MINUTES_IN_DAY = 24 * 60;

export const SERIES_COLORS: Record<string, string> = {
    asr: '#22c55e',
    dhuhr: '#3b82f6',
    fajr: '#60a5fa',
    isha: '#a855f7',
    lastThirdOfTheNight: '#ef4444',
    maghrib: '#f97316',
    middleOfTheNight: '#10b981',
    sunrise: '#eab308',
};

export const FALLBACK_COLORS = ['#60a5fa', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#3b82f6', '#f97316', '#ef4444'];

export const IS_DEV = process.env.NODE_ENV === 'development';
export const salatLabels = {
    asr: 'ʿAṣr',
    dhuhr: 'Dhuhr',
    fajr: 'Fajr',
    isha: 'ʿIshāʾ',
    lastThirdOfTheNight: 'Last 1/3 Night Begins',
    maghrib: 'Maġrib',
    middleOfTheNight: '1/2 Night Begins',
    sunrise: 'Sunrise',
} as const;
export type SalatEvent = keyof typeof salatLabels;
