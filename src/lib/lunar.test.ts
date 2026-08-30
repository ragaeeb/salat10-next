import { describe, expect, it } from 'bun:test';
import { calculateLunarPhase, getLunarPhaseForCycle } from './lunar';

describe('lunar', () => {
    describe('getLunarPhaseForCycle', () => {
        it('should calculate new moon at cycle 0.0', () => {
            const phase = getLunarPhaseForCycle(0.0);
            expect(phase.name).toBe('New Moon');
            expect(phase.emoji).toBe('🌑');
            expect(phase.illuminatedFraction).toBeCloseTo(0.0, 2);
        });

        it('should calculate first quarter at cycle 0.25', () => {
            const phase = getLunarPhaseForCycle(0.25);
            expect(phase.name).toBe('First Quarter');
            expect(phase.emoji).toBe('🌓');
            expect(phase.illuminatedFraction).toBeCloseTo(0.5, 2);
        });

        it('should calculate full moon at cycle 0.5', () => {
            const phase = getLunarPhaseForCycle(0.5);
            expect(phase.name).toBe('Full Moon');
            expect(phase.emoji).toBe('🌕');
            expect(phase.illuminatedFraction).toBeCloseTo(1.0, 2);
        });

        it('should calculate last quarter at cycle 0.75', () => {
            const phase = getLunarPhaseForCycle(0.75);
            expect(phase.name).toBe('Last Quarter');
            expect(phase.emoji).toBe('🌗');
            expect(phase.illuminatedFraction).toBeCloseTo(0.5, 2);
        });
    });

    describe('calculateLunarPhase', () => {
        it('should calculate valid lunar phase for a given date', () => {
            const date = new Date('2026-06-15T12:00:00Z');
            const phase = calculateLunarPhase(date);

            expect(phase).toBeDefined();
            expect(phase.cycleFraction).toBeGreaterThanOrEqual(0);
            expect(phase.cycleFraction).toBeLessThan(1);
            expect(phase.illuminatedFraction).toBeGreaterThanOrEqual(0);
            expect(phase.illuminatedFraction).toBeLessThanOrEqual(1);
            expect(phase.name).toBeDefined();
            expect(phase.emoji).toBeDefined();
        });
    });
});
