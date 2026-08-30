import type { Timeline } from '@/types/timeline';

export type CelestialPhaseInfo = {
    badge: string;
    detail: string;
    emoji: string;
    iconName: string;
    isDay: boolean;
    isNight: boolean;
    isTahajjud: boolean;
    title: string;
};

/**
 * Returns descriptive astronomical and Islamic phase information for normalized progress p.
 * Matches the rich descriptions from salat10-ios CelestialTimeline.swift.
 *
 * @param rawProgress - Progress value (0.0 to 2.0)
 * @param timeline - Normalized prayer timeline
 * @returns CelestialPhaseInfo
 */
export function getCelestialPhase(rawProgress: number, timeline: Timeline): CelestialPhaseInfo {
    const clampedRaw = Math.max(0, rawProgress);
    const dayIndex = Math.floor(clampedRaw);
    const p = clampedRaw % 1.0;
    const dayPrefix = `Day ${dayIndex + 1}`;

    if (p < timeline.sunrise) {
        return {
            badge: `${dayPrefix} · Dawn`,
            detail: 'Subh Sadiq — Dawn breaking in the East',
            emoji: '🌅',
            iconName: 'sun.haze',
            isDay: false,
            isNight: false,
            isTahajjud: false,
            title: `${dayPrefix} · Fajr Dawn`,
        };
    }
    if (p < timeline.dhuhr) {
        return {
            badge: `${dayPrefix} · Morning`,
            detail: 'Shurūq — Sun ascending across eastern sky',
            emoji: '🌄',
            iconName: 'sunrise',
            isDay: true,
            isNight: false,
            isTahajjud: false,
            title: `${dayPrefix} · Morning / Shurūq`,
        };
    }
    if (p < timeline.asr) {
        return {
            badge: `${dayPrefix} · Zenith`,
            detail: 'Zawāl — Sun has crossed the zenith meridian',
            emoji: '☀️',
            iconName: 'sun.max',
            isDay: true,
            isNight: false,
            isTahajjud: false,
            title: `${dayPrefix} · Dhuhr (Zenith)`,
        };
    }
    const sunsetTransitionStart = (timeline.asr + timeline.maghrib) * 0.5;
    if (p < sunsetTransitionStart) {
        return {
            badge: `${dayPrefix} · Afternoon`,
            detail: 'ʿAṣr — Sun descending into golden afternoon',
            emoji: '🌤️',
            iconName: 'sun.and.horizon',
            isDay: true,
            isNight: false,
            isTahajjud: false,
            title: `${dayPrefix} · ʿAṣr Afternoon`,
        };
    }
    if (p < timeline.maghrib) {
        return {
            badge: `${dayPrefix} · Sunset Shift`,
            detail: 'Sun setting in the West, Moon emerging',
            emoji: '🌇',
            iconName: 'arrow.triangle.swap',
            isDay: false,
            isNight: false,
            isTahajjud: false,
            title: `${dayPrefix} · Sunset Transition`,
        };
    }
    if (p < timeline.isha) {
        return {
            badge: `${dayPrefix} · Dusk`,
            detail: 'Twilight afterglow fading into night',
            emoji: '🌆',
            iconName: 'sunset',
            isDay: false,
            isNight: true,
            isTahajjud: false,
            title: `${dayPrefix} · Maġrib Dusk`,
        };
    }
    if (p < timeline.midNight) {
        return {
            badge: `${dayPrefix} · Night`,
            detail: 'Night sky deepening, stars appearing',
            emoji: '🌌',
            iconName: 'moon.stars',
            isDay: false,
            isNight: true,
            isTahajjud: false,
            title: `${dayPrefix} · ʿIshāʾ Night`,
        };
    }
    if (p < timeline.lastThird) {
        return {
            badge: `${dayPrefix} · Midnight`,
            detail: 'Half of the night — Stars at full clarity',
            emoji: '🌕',
            iconName: 'moon',
            isDay: false,
            isNight: true,
            isTahajjud: false,
            title: `${dayPrefix} · Midnight`,
        };
    }
    if (p < 0.96) {
        return {
            badge: `${dayPrefix} · Tahajjud`,
            detail: 'Blessed Qiyam / Tahajjud time — Shooting stars active',
            emoji: '✨',
            iconName: 'sparkles',
            isDay: false,
            isNight: true,
            isTahajjud: true,
            title: `${dayPrefix} · Last 1/3 of Night`,
        };
    }
    return {
        badge: 'Pre-Dawn Bridge',
        detail: 'Pre-dawn twilight emerging into the next morning',
        emoji: '✨',
        iconName: 'arrow.right.circle',
        isDay: false,
        isNight: true,
        isTahajjud: true,
        title: `Last 1/3 → Day ${dayIndex + 2} Fajr Dawn`,
    };
}
