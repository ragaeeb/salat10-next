import { describe, expect, it } from 'bun:test';
import type { Timeline } from '@/types/timeline';
import { getCelestialPhase } from './celestial-phases';

const mockTimeline: Timeline = {
    asr: 0.6,
    dhuhr: 0.4,
    end: 1,
    fajr: 0,
    isha: 0.85,
    lastThird: 0.95,
    maghrib: 0.75,
    midNight: 0.9,
    sunrise: 0.15,
};

describe('celestial-phases', () => {
    it('should identify Fajr dawn before sunrise', () => {
        const phase = getCelestialPhase(0.05, mockTimeline);
        expect(phase.title).toContain('Fajr Dawn');
        expect(phase.emoji).toBe('🌅');
        expect(phase.isDay).toBe(false);
    });

    it('should identify Dhuhr zenith at midday', () => {
        const phase = getCelestialPhase(0.45, mockTimeline);
        expect(phase.title).toContain('Dhuhr (Zenith)');
        expect(phase.emoji).toBe('☀️');
        expect(phase.isDay).toBe(true);
    });

    it('should identify Asr afternoon', () => {
        const phase = getCelestialPhase(0.62, mockTimeline);
        expect(phase.title).toContain('ʿAṣr Afternoon');
        expect(phase.emoji).toBe('🌤️');
    });

    it('should identify Maghrib dusk', () => {
        const phase = getCelestialPhase(0.8, mockTimeline);
        expect(phase.title).toContain('Maġrib Dusk');
        expect(phase.isNight).toBe(true);
    });

    it('should identify Last 1/3 of Night and Tahajjud', () => {
        const phase = getCelestialPhase(0.955, mockTimeline);
        expect(phase.title).toContain('Last 1/3 of Night');
        expect(phase.isTahajjud).toBe(true);
        expect(phase.emoji).toBe('✨');
    });
});
