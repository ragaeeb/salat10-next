import { describe, expect, it } from 'bun:test';
import { createParameters, methodLabelMap, methodPresets } from './settings';

describe('settings', () => {
    describe('methodPresets', () => {
        it('should have Muslim World League preset', () => {
            expect(methodPresets.MuslimWorldLeague).toEqual({ fajrAngle: 18, ishaAngle: 17, ishaInterval: 0 });
        });

        it('should have North America preset', () => {
            expect(methodPresets.NorthAmerica).toEqual({ fajrAngle: 15, ishaAngle: 15, ishaInterval: 0 });
        });

        it('should have all method values', () => {
            const methods = Object.keys(methodPresets);
            expect(methods.length).toBeGreaterThan(0);
            expect(methods).toContain('MuslimWorldLeague');
            expect(methods).toContain('NorthAmerica');
        });
    });

    describe('methodLabelMap', () => {
        it('should map method values to labels', () => {
            expect(methodLabelMap.MuslimWorldLeague).toInclude('Muslim World League');
            expect(methodLabelMap.NorthAmerica).toInclude('North America - ISNA');
        });

        it('should have labels for all presets', () => {
            const presetKeys = Object.keys(methodPresets);
            const labelKeys = Object.keys(methodLabelMap);
            expect(labelKeys.length).toBe(presetKeys.length);
        });
    });

    describe('createParameters', () => {
        it('should create parameters from method preset', () => {
            const params = createParameters({ method: 'MuslimWorldLeague' });
            expect(params).toBeDefined();
        });

        it('should create parameters with custom angles', () => {
            const params = createParameters({
                fajrAngle: 18,
                ishaAngle: 17,
                ishaInterval: 0,
                method: 'MuslimWorldLeague',
            });
            expect(params).toBeDefined();
        });

        it('should handle isha interval', () => {
            const params = createParameters({ fajrAngle: 18, ishaAngle: 0, ishaInterval: 90, method: 'Karachi' });
            expect(params).toBeDefined();
        });
    });
});
