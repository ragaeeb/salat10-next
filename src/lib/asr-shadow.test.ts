import { describe, expect, it } from 'bun:test';
import { calculateAsrShadowMetrics, calculateAsrTransitionState } from './asr-shadow';

describe('asr-shadow', () => {
    const dhuhrProgress = 0.5;
    const asrProgress = 0.65;
    const maghribProgress = 0.78;
    const latitude = 43.65; // Toronto
    const testDate = new Date('2025-06-21T12:00:00Z');

    describe('calculateAsrShadowMetrics', () => {
        it('should return 0 added shadow ratio before/at Dhuhr', () => {
            const metricsAtDhuhr = calculateAsrShadowMetrics(
                dhuhrProgress,
                dhuhrProgress,
                asrProgress,
                latitude,
                testDate,
            );
            expect(metricsAtDhuhr.addedShadowRatio).toBe(0);
            expect(metricsAtDhuhr.noonShadowRatio).toBeGreaterThan(0);
        });

        it('should return approximately 1.0 added shadow ratio at Asr time (1:1 with object height)', () => {
            const metricsAtAsr = calculateAsrShadowMetrics(asrProgress, dhuhrProgress, asrProgress, latitude, testDate);
            expect(metricsAtAsr.addedShadowRatio).toBeCloseTo(1.0, 1);
        });

        it('should return > 1.0 added shadow ratio after Asr', () => {
            const metricsAfterAsr = calculateAsrShadowMetrics(0.72, dhuhrProgress, asrProgress, latitude, testDate);
            expect(metricsAfterAsr.addedShadowRatio).toBeGreaterThan(1.0);
        });
    });

    describe('calculateAsrTransitionState', () => {
        it('should be hidden before Dhuhr', () => {
            const state = calculateAsrTransitionState(0.4, dhuhrProgress, maghribProgress);
            expect(state.opacity).toBe(0);
            expect(state.descendOffset).toBe(65);
        });

        it('should fade in and rise after Dhuhr', () => {
            const state = calculateAsrTransitionState(0.55, dhuhrProgress, maghribProgress);
            expect(state.opacity).toBe(1.0);
            expect(state.descendOffset).toBe(0);
        });

        it('should descend and fade out near Maghrib', () => {
            const state = calculateAsrTransitionState(maghribProgress - 0.01, dhuhrProgress, maghribProgress);
            expect(state.descendOffset).toBeGreaterThan(30);
            expect(state.opacity).toBeLessThan(1.0);
        });

        it('should be completely hidden after Maghrib', () => {
            const state = calculateAsrTransitionState(0.85, dhuhrProgress, maghribProgress);
            expect(state.opacity).toBe(0);
            expect(state.descendOffset).toBe(65);
        });
    });
});
