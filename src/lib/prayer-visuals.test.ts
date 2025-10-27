import { describe, expect, it } from 'bun:test';
import { calculateRealTimeVisuals, calculateScrollBasedVisuals, getPrayerInfoFromScroll } from './prayer-visuals';

describe('getPrayerInfoFromScroll', () => {
    it('should return fajr for early progress', () => {
        const result = getPrayerInfoFromScroll(0.05);
        expect(result.event).toBe('fajr');
        expect(result.label).toBe('Fajr');
    });

    it('should return sunrise for 0.1-0.2 progress', () => {
        expect(getPrayerInfoFromScroll(0.15).event).toBe('sunrise');
    });

    it('should return dhuhr for 0.2-0.5 progress', () => {
        expect(getPrayerInfoFromScroll(0.25).event).toBe('dhuhr');
        expect(getPrayerInfoFromScroll(0.4).event).toBe('dhuhr');
    });

    it('should return asr for 0.5-0.65 progress', () => {
        expect(getPrayerInfoFromScroll(0.55).event).toBe('asr');
    });

    it('should return maghrib for 0.65-0.8 progress', () => {
        expect(getPrayerInfoFromScroll(0.7).event).toBe('maghrib');
    });

    it('should return isha for 0.8-0.87 progress', () => {
        expect(getPrayerInfoFromScroll(0.85).event).toBe('isha');
    });

    it('should return half night then last third for late progress', () => {
        expect(getPrayerInfoFromScroll(0.9).event).toBe('middleOfTheNight');
        expect(getPrayerInfoFromScroll(0.95).event).toBe('lastThirdOfTheNight');
        expect(getPrayerInfoFromScroll(1.0).event).toBe('lastThirdOfTheNight');
    });
});

describe('calculateScrollBasedVisuals', () => {
    it('sun starts rising at progress 0 (fajr)', () => {
        const result = calculateScrollBasedVisuals(0);
        expect(result.sunX).toBe(90);
        expect(result.sunY).toBe(80);
        expect(result.sunOpacity).toBe(0);
        expect(result.moonOpacity).toBe(0.8);
    });

    it('sun is visible after fajr at progress 0.1', () => {
        const result = calculateScrollBasedVisuals(0.1);
        expect(result.sunOpacity).toBe(1);
        expect(result.moonOpacity).toBe(0);
    });

    it('sun moves to center at progress 0.5', () => {
        const result = calculateScrollBasedVisuals(0.5);
        expect(result.sunX).toBe(50);
        expect(result.sunY).toBe(20); // Peak at noon
        expect(result.sunOpacity).toBe(1);
    });

    it('sun ends at left side at progress 1', () => {
        const result = calculateScrollBasedVisuals(1);
        expect(result.sunX).toBe(10);
        expect(result.sunY).toBe(80);
    });

    it('sun is yellow before 0.6 progress', () => {
        const result = calculateScrollBasedVisuals(0.5);
        expect(result.sunColor).toEqual({ b: 0, g: 215, r: 255 });
    });

    it('sun starts transitioning to orange at 0.6 progress', () => {
        const result = calculateScrollBasedVisuals(0.6);
        expect(result.sunColor.r).toBe(255);
        expect(result.sunColor.g).toBe(215); // Still yellow at start
        expect(result.sunColor.b).toBe(0);
    });

    it('sun is transitioning (gradient) at 0.615 progress', () => {
        const result = calculateScrollBasedVisuals(0.615);
        expect(result.sunColor.r).toBe(255);
        expect(result.sunColor.g).toBeCloseTo(178, 0); // Halfway: 215 - 0.5 * 75
        expect(result.sunColor.b).toBe(0);
    });

    it('sun is fully orange at 0.63+ progress', () => {
        const result = calculateScrollBasedVisuals(0.65);
        expect(result.sunColor).toEqual({ b: 0, g: 140, r: 255 });
    });

    it('sun fades out during maghrib transition (0.63-0.72)', () => {
        const result = calculateScrollBasedVisuals(0.67);
        expect(result.sunOpacity).toBeLessThan(1);
        expect(result.moonOpacity).toBeGreaterThan(0);
    });

    it('sun completely hidden after maghrib (0.72+)', () => {
        const result = calculateScrollBasedVisuals(0.75);
        expect(result.sunOpacity).toBe(0);
        expect(result.moonOpacity).toBe(0.8);
    });
});

describe('calculateRealTimeVisuals', () => {
    const mockTimings = {
        asr: new Date('2025-01-15T15:00:00').getTime(),
        dhuhr: new Date('2025-01-15T12:00:00').getTime(),
        fajr: new Date('2025-01-15T05:00:00').getTime(),
        isha: new Date('2025-01-15T19:00:00').getTime(),
        maghrib: new Date('2025-01-15T17:30:00').getTime(),
        sunrise: new Date('2025-01-15T06:30:00').getTime(),
    };

    it('before fajr shows moon', () => {
        const now = new Date('2025-01-15T04:00:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunOpacity).toBe(0);
        expect(result.moonOpacity).toBe(0.8);
    });

    it('during fajr to sunrise transition', () => {
        const now = new Date('2025-01-15T05:45:00').getTime(); // Halfway
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunX).toBeCloseTo(77.5, 1);
        expect(result.sunOpacity).toBe(1);
    });

    it('during sunrise to dhuhr', () => {
        const now = new Date('2025-01-15T09:15:00').getTime(); // Halfway
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunX).toBeCloseTo(60, 1);
        expect(result.sunY).toBeCloseTo(50, 1);
    });

    it('sun at peak during dhuhr to asr', () => {
        const now = new Date('2025-01-15T13:30:00').getTime(); // Halfway
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunX).toBeCloseTo(40, 1);
        expect(result.sunY).toBeCloseTo(35, 1);
    });

    it('sun starts transitioning to orange at start of last 20% before maghrib', () => {
        // Exactly at orangeStartTime (last 20% = last 30 minutes)
        const now = new Date('2025-01-15T17:00:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunColor.r).toBe(255);
        expect(result.sunColor.g).toBe(215); // Still yellow at transition start
        expect(result.sunColor.b).toBe(0);
    });

    it('sun is transitioning (gradient) halfway through orange period', () => {
        // 15 minutes into the 30-minute orange period
        const now = new Date('2025-01-15T17:15:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunColor.r).toBe(255);
        expect(result.sunColor.g).toBeCloseTo(178, 0); // Halfway: 215 - 0.5 * 75
        expect(result.sunColor.b).toBe(0);
    });

    it('sun is fully orange just before maghrib', () => {
        // 1 minute before maghrib
        const now = new Date('2025-01-15T17:29:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunColor.r).toBe(255);
        expect(result.sunColor.g).toBeCloseTo(143, 1); // Nearly full orange
        expect(result.sunColor.b).toBe(0);
    });

    it('sun fades in last 10% before maghrib', () => {
        // Last 10% = last 15 minutes before maghrib
        const now = new Date('2025-01-15T17:20:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunOpacity).toBeLessThan(1);
        expect(result.moonOpacity).toBeGreaterThan(0);
    });

    it('after maghrib shows moon', () => {
        const now = new Date('2025-01-15T18:00:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunOpacity).toBe(0);
        expect(result.moonOpacity).toBe(0.8);
    });

    it('after isha shows moon', () => {
        const now = new Date('2025-01-15T20:00:00').getTime();
        const result = calculateRealTimeVisuals(now, mockTimings);
        expect(result.sunOpacity).toBe(0);
        expect(result.moonOpacity).toBe(0.8);
    });

    it('handles missing timings gracefully', () => {
        const now = new Date('2025-01-15T12:00:00').getTime();
        const result = calculateRealTimeVisuals(now, {});
        expect(result.sunX).toBe(50);
        expect(result.sunY).toBe(80);
    });
});
