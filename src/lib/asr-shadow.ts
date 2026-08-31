/**
 * Asr Shadow & Astronomical Solar Calculation Utilities
 *
 * Implements the astronomical definition of ʿAṣr:
 * - Starting after Dhuhr (solar noon zenith), an object casts an increasing shadow to the east (right).
 * - At ʿAṣr time, the added shadow length equals exactly 1:1 with the original height of the object.
 * - Near Maghrib, the object smoothly sets with the sun by descending behind the horizon/container.
 */

export type AsrShadowMetrics = {
    /** Ratio of shadow at solar noon relative to object height (G0) */
    noonShadowRatio: number;
    /** Added shadow ratio since Dhuhr (ΔG). At Asr, this equals 1.0 (1:1 with object height) */
    addedShadowRatio: number;
    /** Total shadow ratio (G0 + ΔG) */
    totalShadowRatio: number;
};

export type AsrTransitionState = {
    /** Overall visibility opacity (0 to 1) */
    opacity: number;
    /** Vertical descent offset in pixels (0 when standing, ~65 when hidden/descended) */
    descendOffset: number;
};

/**
 * Calculates shadow metrics based on observer latitude, solar declination, and daylight progress.
 *
 * @param progress - Normalized day progress (0 to 1)
 * @param dhuhrProgress - Normalized progress at Dhuhr (solar noon)
 * @param asrProgress - Normalized progress at Asr (when added shadow ratio = 1.0)
 * @param latitude - Observer latitude in degrees (-90 to +90)
 * @param date - Date for calculating solar declination (defaults to today)
 * @returns ShadowMetrics containing noon, added, and total shadow ratios
 */
export function calculateAsrShadowMetrics(
    progress: number,
    dhuhrProgress: number,
    asrProgress: number,
    latitude: number,
    date: Date = new Date(),
): AsrShadowMetrics {
    const span = asrProgress - dhuhrProgress;
    const progressFromDhuhr =
        span > 0 ? Math.max((progress - dhuhrProgress) / span, 0) : progress >= asrProgress ? 1 : 0;

    // Day of year calculation for solar declination
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diffMs = date.getTime() - startOfYear.getTime();
    const day = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const isLeap = (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) || date.getFullYear() % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;

    const yearAngle = ((2 * Math.PI) / daysInYear) * (day - 1);
    const declination =
        0.006918 -
        0.399912 * Math.cos(yearAngle) +
        0.070257 * Math.sin(yearAngle) -
        0.006758 * Math.cos(2 * yearAngle) +
        0.000907 * Math.sin(2 * yearAngle) -
        0.002697 * Math.cos(3 * yearAngle) +
        0.00148 * Math.sin(3 * yearAngle);

    const observerLatitude = (Math.min(Math.max(latitude, -89.9), 89.9) * Math.PI) / 180;
    const noonAltitude = Math.max(Math.PI / 180, Math.PI / 2 - Math.abs(observerLatitude - declination));
    const noonShadowRatio = Math.max(0, 1 / Math.tan(noonAltitude));
    const targetAltitude = Math.atan(1 / (noonShadowRatio + 1));
    const denominator = Math.cos(observerLatitude) * Math.cos(declination);

    let addedShadowRatio: number;
    if (Math.abs(denominator) < 0.000001) {
        addedShadowRatio = progressFromDhuhr;
    } else {
        const targetHourAngleCosine = Math.min(
            Math.max((Math.sin(targetAltitude) - Math.sin(observerLatitude) * Math.sin(declination)) / denominator, -1),
            1,
        );
        const hourAngle = Math.acos(targetHourAngleCosine) * progressFromDhuhr;
        const altitudeSine = Math.min(
            Math.max(
                Math.sin(observerLatitude) * Math.sin(declination) +
                    Math.cos(observerLatitude) * Math.cos(declination) * Math.cos(hourAngle),
                -1,
            ),
            1,
        );
        const altitude = Math.max(Math.PI / 180, Math.asin(altitudeSine));
        addedShadowRatio = Math.max(1 / Math.tan(altitude) - noonShadowRatio, 0);
    }

    return { addedShadowRatio, noonShadowRatio, totalShadowRatio: noonShadowRatio + addedShadowRatio };
}

/**
 * Computes visibility opacity and vertical descent offset (rising after Dhuhr, descending near Maghrib).
 *
 * @param progress - Normalized day progress (0 to 1)
 * @param dhuhrProgress - Normalized progress at Dhuhr
 * @param maghribProgress - Normalized progress at Maghrib (sunset)
 * @returns AsrTransitionState with opacity and descendOffset in pixels
 */
export function calculateAsrTransitionState(
    progress: number,
    dhuhrProgress: number,
    maghribProgress: number,
): AsrTransitionState {
    if (progress < dhuhrProgress || progress > maghribProgress) {
        return { descendOffset: 65, opacity: 0 };
    }

    // 1. Fade in and translate upward smoothly after Dhuhr
    const fadeInSpan = 0.035;
    const fadeInFactor = Math.min(1.0, Math.max(0.0, (progress - dhuhrProgress) / fadeInSpan));
    const initialRiseOffset = 65 * (1 - fadeInFactor);

    // 2. Sunset descent ("setting with the sun") near Maghrib
    const sunsetDescentSpan = 0.06;
    const sunsetStart = maghribProgress - sunsetDescentSpan;

    if (progress <= sunsetStart) {
        return { descendOffset: initialRiseOffset, opacity: fadeInFactor };
    }

    const t = Math.min(1.0, Math.max(0.0, (progress - sunsetStart) / sunsetDescentSpan));
    const easeT = t ** 1.25;
    const descendOffset = 65.0 * easeT;

    const sunsetFadeFactor = t <= 0.6 ? 1.0 : Math.min(1.0, Math.max(0.0, (1.0 - t) / 0.4));
    const totalOpacity = fadeInFactor * sunsetFadeFactor;

    return { descendOffset, opacity: totalOpacity };
}
