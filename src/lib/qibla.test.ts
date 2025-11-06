import { describe, expect, it } from 'bun:test';
import {
    calculateHeadingStability,
    calculateQibla,
    calculateRelativeRotation,
    formatDirectionInstruction,
    getIOSCompassQuality,
    isIOSDevice,
    isPointingAtQibla,
    KAABA_COORDINATES,
    normalizeAngle,
    smoothHeading,
    toDegrees,
    toRadians,
} from './qibla';

describe('qibla', () => {
    describe('toRadians', () => {
        it('should convert 0 degrees to 0 radians', () => {
            expect(toRadians(0)).toBe(0);
        });

        it('should convert 180 degrees to PI radians', () => {
            expect(toRadians(180)).toBeCloseTo(Math.PI, 10);
        });

        it('should convert 90 degrees to PI/2 radians', () => {
            expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 10);
        });

        it('should convert 360 degrees to 2*PI radians', () => {
            expect(toRadians(360)).toBeCloseTo(2 * Math.PI, 10);
        });

        it('should handle negative degrees', () => {
            expect(toRadians(-90)).toBeCloseTo(-Math.PI / 2, 10);
        });
    });

    describe('toDegrees', () => {
        it('should convert 0 radians to 0 degrees', () => {
            expect(toDegrees(0)).toBe(0);
        });

        it('should convert PI radians to 180 degrees', () => {
            expect(toDegrees(Math.PI)).toBeCloseTo(180, 10);
        });

        it('should convert PI/2 radians to 90 degrees', () => {
            expect(toDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
        });

        it('should convert 2*PI radians to 360 degrees', () => {
            expect(toDegrees(2 * Math.PI)).toBeCloseTo(360, 10);
        });

        it('should handle negative radians', () => {
            expect(toDegrees(-Math.PI / 2)).toBeCloseTo(-90, 10);
        });
    });

    describe('normalizeAngle', () => {
        it('should keep angle within 0-360 unchanged', () => {
            expect(normalizeAngle(45)).toBe(45);
            expect(normalizeAngle(180)).toBe(180);
            expect(normalizeAngle(359)).toBe(359);
        });

        it('should normalize 360 to 0', () => {
            expect(normalizeAngle(360)).toBe(0);
        });

        it('should normalize angles above 360', () => {
            expect(normalizeAngle(370)).toBe(10);
            expect(normalizeAngle(720)).toBe(0);
            expect(normalizeAngle(725)).toBe(5);
        });

        it('should normalize negative angles', () => {
            expect(normalizeAngle(-10)).toBe(350);
            expect(normalizeAngle(-90)).toBe(270);
            expect(normalizeAngle(-360)).toBe(0);
            expect(normalizeAngle(-370)).toBe(350);
        });
    });

    describe('calculateQibla', () => {
        it('should calculate Qibla for New York City (approximately 58° NE)', () => {
            const bearing = calculateQibla(40.7128, -74.006);
            expect(bearing).toBeGreaterThan(50);
            expect(bearing).toBeLessThan(65);
        });

        it('should calculate Qibla for London (approximately 118° ESE)', () => {
            const bearing = calculateQibla(51.5074, -0.1278);
            expect(bearing).toBeGreaterThan(110);
            expect(bearing).toBeLessThan(125);
        });

        it('should calculate Qibla for Sydney (approximately 277° W)', () => {
            const bearing = calculateQibla(-33.8688, 151.2093);
            expect(bearing).toBeGreaterThan(270);
            expect(bearing).toBeLessThan(285);
        });

        it('should calculate Qibla for Tokyo (approximately 293° WNW)', () => {
            const bearing = calculateQibla(35.6762, 139.6503);
            expect(bearing).toBeGreaterThan(285);
            expect(bearing).toBeLessThan(300);
        });

        it('should return value between 0 and 360', () => {
            const bearing = calculateQibla(0, 0);
            expect(bearing).toBeGreaterThanOrEqual(0);
            expect(bearing).toBeLessThan(360);
        });

        it('should calculate for location at Kaaba itself (should be stable)', () => {
            const bearing = calculateQibla(KAABA_COORDINATES.lat, KAABA_COORDINATES.lon);
            // At Kaaba, any direction is valid, but function should return a stable number
            expect(bearing).toBeGreaterThanOrEqual(0);
            expect(bearing).toBeLessThan(360);
        });
    });

    describe('smoothHeading', () => {
        it('should return target when current is null', () => {
            expect(smoothHeading(null, 100)).toBe(100);
            expect(smoothHeading(null, 0)).toBe(0);
            expect(smoothHeading(null, 359)).toBe(359);
        });

        it('should smooth heading with default smoothing factor', () => {
            const result = smoothHeading(100, 110, 0.3);
            expect(result).toBeGreaterThan(100);
            expect(result).toBeLessThan(110);
            expect(result).toBeCloseTo(103, 0); // 100 + (10 * 0.3) = 103
        });

        it('should smooth heading with custom smoothing factor', () => {
            const result = smoothHeading(100, 110, 0.5);
            expect(result).toBeCloseTo(105, 0); // 100 + (10 * 0.5) = 105
        });

        it('should handle wrap-around from 359 to 1', () => {
            const result = smoothHeading(359, 1, 0.5);
            expect(result).toBeCloseTo(0, 0); // Should go through 0, not backwards
        });

        it('should handle wrap-around from 1 to 359', () => {
            const result = smoothHeading(1, 359, 0.5);
            // Going from 1 to 359 = going backwards 2 degrees
            // diff = 359 - 1 = 358, but since > 180, diff = 358 - 360 = -2
            // result = 1 + (-2 * 0.5) = 1 - 1 = 0
            expect(result).toBeCloseTo(0, 0);
        });

        it('should normalize result to 0-360 range', () => {
            const result = smoothHeading(350, 10, 0.5);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(360);
        });

        it('should not change value when target equals current', () => {
            expect(smoothHeading(180, 180, 0.3)).toBeCloseTo(180, 0);
        });
    });

    describe('calculateRelativeRotation', () => {
        it('should return 0 when heading equals Qibla bearing', () => {
            expect(calculateRelativeRotation(90, 90)).toBe(0);
        });

        it('should calculate clockwise rotation', () => {
            expect(calculateRelativeRotation(90, 80)).toBe(10); // Turn 10° right
        });

        it('should calculate counter-clockwise rotation', () => {
            expect(calculateRelativeRotation(80, 90)).toBe(350); // Turn 10° left (350°)
        });

        it('should handle wrap-around at 0/360', () => {
            expect(calculateRelativeRotation(10, 350)).toBe(20); // Cross zero boundary
        });

        it('should return value in 0-360 range', () => {
            const result = calculateRelativeRotation(180, 270);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(360);
        });

        it('should handle 180-degree difference', () => {
            expect(calculateRelativeRotation(0, 180)).toBe(180);
            expect(calculateRelativeRotation(180, 0)).toBe(180);
        });
    });

    describe('isPointingAtQibla', () => {
        it('should return true when rotation is 0', () => {
            expect(isPointingAtQibla(0)).toBe(true);
        });

        it('should return true when within default tolerance (5°)', () => {
            expect(isPointingAtQibla(4)).toBe(true);
            expect(isPointingAtQibla(356)).toBe(true);
        });

        it('should return false when outside default tolerance', () => {
            expect(isPointingAtQibla(6)).toBe(false);
            expect(isPointingAtQibla(354)).toBe(false);
            expect(isPointingAtQibla(180)).toBe(false);
        });

        it('should respect custom tolerance', () => {
            expect(isPointingAtQibla(8, 10)).toBe(true);
            expect(isPointingAtQibla(352, 10)).toBe(true);
            expect(isPointingAtQibla(11, 10)).toBe(false);
            expect(isPointingAtQibla(349, 10)).toBe(false);
        });

        it('should handle edge cases at tolerance boundary', () => {
            expect(isPointingAtQibla(5, 5)).toBe(false); // Exactly at boundary
            expect(isPointingAtQibla(4.9, 5)).toBe(true);
            expect(isPointingAtQibla(355, 5)).toBe(false);
            expect(isPointingAtQibla(355.1, 5)).toBe(true);
        });
    });

    describe('calculateHeadingStability', () => {
        it('should return null when history has fewer than 5 readings', () => {
            expect(calculateHeadingStability([])).toBeNull();
            expect(calculateHeadingStability([10, 11, 12])).toBeNull();
            expect(calculateHeadingStability([10, 11, 12, 13])).toBeNull();
        });

        it('should return "Stable" for very small variance (< 2°)', () => {
            const history = [100, 100.5, 101, 100.8, 101.2];
            const result = calculateHeadingStability(history);
            expect(result?.text).toBe('Stable');
            expect(result?.color).toBe('text-green-400');
        });

        it('should return "Good" for small variance (2-5°)', () => {
            // Create history with variance between 2 and 5
            // differences: 4, 2, 4, 2 -> average = 3
            const history = [100, 104, 102, 106, 104];
            const result = calculateHeadingStability(history);
            expect(result?.text).toBe('Good');
            expect(result?.color).toBe('text-green-400');
        });

        it('should return "Fair" for medium variance (5-10°)', () => {
            const history = [100, 107, 103, 109, 105];
            const result = calculateHeadingStability(history);
            expect(result?.text).toBe('Fair');
            expect(result?.color).toBe('text-yellow-400');
        });

        it('should return "Unstable" for large variance (≥ 10°)', () => {
            const history = [100, 115, 105, 120, 110];
            const result = calculateHeadingStability(history);
            expect(result?.text).toBe('Unstable');
            expect(result?.color).toBe('text-red-400');
        });

        it('should handle wrap-around when calculating variance', () => {
            // differences: 2, 2, 3, 2 -> average = 2.25 (should be "Good")
            const history = [358, 0, 2, 359, 1];
            const result = calculateHeadingStability(history);
            expect(result?.text).toBe('Good');
        });

        it('should only use last 5 readings from longer history', () => {
            const history = [200, 210, 220, 100, 101, 102, 101.5, 102.5]; // Last 5 are stable
            const result = calculateHeadingStability(history);
            expect(result?.text).toBe('Stable');
        });
    });

    describe('getIOSCompassQuality', () => {
        it('should return "Excellent" for negative accuracy', () => {
            const result = getIOSCompassQuality(-1);
            expect(result.text).toBe('Excellent');
            expect(result.color).toBe('text-green-400');
        });

        it('should return "Good" for accuracy < 15', () => {
            expect(getIOSCompassQuality(0).text).toBe('Good');
            expect(getIOSCompassQuality(10).text).toBe('Good');
            expect(getIOSCompassQuality(14).text).toBe('Good');
        });

        it('should return "Fair" for accuracy 15-24', () => {
            expect(getIOSCompassQuality(15).text).toBe('Fair');
            expect(getIOSCompassQuality(20).text).toBe('Fair');
            expect(getIOSCompassQuality(24).text).toBe('Fair');
            expect(getIOSCompassQuality(15).color).toBe('text-yellow-400');
        });

        it('should return "Poor - Calibrate" for accuracy ≥ 25', () => {
            const result = getIOSCompassQuality(25);
            expect(result.text).toBe('Poor - Calibrate');
            expect(result.color).toBe('text-red-400');

            expect(getIOSCompassQuality(100).text).toBe('Poor - Calibrate');
        });
    });

    describe('formatDirectionInstruction', () => {
        it('should format clockwise rotations (< 180°) as "right"', () => {
            expect(formatDirectionInstruction(0)).toBe('0° right');
            expect(formatDirectionInstruction(45)).toBe('45° right');
            expect(formatDirectionInstruction(90)).toBe('90° right');
            expect(formatDirectionInstruction(179)).toBe('179° right');
        });

        it('should format counter-clockwise rotations (≥ 180°) as "left"', () => {
            expect(formatDirectionInstruction(180)).toBe('180° left');
            expect(formatDirectionInstruction(270)).toBe('90° left'); // 360-270 = 90
            expect(formatDirectionInstruction(315)).toBe('45° left'); // 360-315 = 45
            expect(formatDirectionInstruction(359)).toBe('1° left'); // 360-359 = 1
        });

        it('should round to nearest integer', () => {
            expect(formatDirectionInstruction(45.6)).toBe('46° right');
            expect(formatDirectionInstruction(45.4)).toBe('45° right');
            expect(formatDirectionInstruction(270.7)).toBe('89° left'); // 360-270.7 ≈ 89
        });
    });

    describe('isIOSDevice', () => {
        // Note: This test depends on the runtime environment
        // In bun test, navigator.userAgent will be present but not from iOS
        it('should return boolean', () => {
            const result = isIOSDevice();
            expect(typeof result).toBe('boolean');
        });

        it('should return false in Node/Bun environment', () => {
            // In test environment, should not detect as iOS
            expect(isIOSDevice()).toBe(false);
        });
    });
});
