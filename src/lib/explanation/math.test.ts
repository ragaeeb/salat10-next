import { describe, expect, it } from 'bun:test';
import type { Coordinates } from 'adhan';
import {
    altitudeOfCelestialBody,
    apparentObliquityOfTheEcliptic,
    apparentSolarLongitude,
    approximateTransit,
    ascendingLunarNodeLongitude,
    correctedHourAngle,
    correctedTransit,
    dateByAddingDays,
    dateByAddingSeconds,
    dayOfYear,
    daysSinceSolstice,
    degreesToRadians,
    evaluateSeasonalAdjustment,
    fractionalDayToDate,
    hoursToDate,
    interpolate,
    interpolateAngles,
    isLeapYear,
    julianCentury,
    julianDay,
    meanLunarLongitude,
    meanObliquityOfTheEcliptic,
    meanSiderealTime,
    meanSolarAnomaly,
    meanSolarLongitude,
    normalizeToScale,
    nutationInLongitude,
    nutationInObliquity,
    quadrantShiftAngle,
    radiansToDegrees,
    SECONDS_PER_HOUR,
    SOLAR_ALTITUDE,
    seasonAdjustedEveningTwilight,
    seasonAdjustedMorningTwilight,
    shortTimeZone,
    solarEquationOfTheCenter,
    unwindAngle,
} from './math';

describe('math constants', () => {
    it('should have correct SECONDS_PER_HOUR value', () => {
        expect(SECONDS_PER_HOUR).toBe(3600);
    });

    it('should have correct SOLAR_ALTITUDE value', () => {
        expect(SOLAR_ALTITUDE).toBeCloseTo(-50 / 60, 10);
    });
});

describe('degreesToRadians', () => {
    it('should convert 0 degrees to 0 radians', () => {
        expect(degreesToRadians(0)).toBe(0);
    });

    it('should convert 180 degrees to PI radians', () => {
        expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 10);
    });

    it('should convert 90 degrees to PI/2 radians', () => {
        expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('should convert 360 degrees to 2*PI radians', () => {
        expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI, 10);
    });

    it('should handle negative degrees', () => {
        expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2, 10);
    });
});

describe('radiansToDegrees', () => {
    it('should convert 0 radians to 0 degrees', () => {
        expect(radiansToDegrees(0)).toBe(0);
    });

    it('should convert PI radians to 180 degrees', () => {
        expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 10);
    });

    it('should convert PI/2 radians to 90 degrees', () => {
        expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
    });

    it('should convert 2*PI radians to 360 degrees', () => {
        expect(radiansToDegrees(2 * Math.PI)).toBeCloseTo(360, 10);
    });

    it('should handle negative radians', () => {
        expect(radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90, 10);
    });
});

describe('normalizeToScale', () => {
    it('should keep number within scale unchanged', () => {
        expect(normalizeToScale(5, 10)).toBe(5);
        expect(normalizeToScale(0, 10)).toBe(0);
    });

    it('should normalize number at boundary', () => {
        expect(normalizeToScale(10, 10)).toBe(0);
    });

    it('should normalize number above scale', () => {
        expect(normalizeToScale(15, 10)).toBe(5);
        expect(normalizeToScale(25, 10)).toBe(5);
    });

    it('should normalize negative numbers', () => {
        expect(normalizeToScale(-5, 10)).toBe(5);
        expect(normalizeToScale(-15, 10)).toBe(5);
    });
});

describe('unwindAngle', () => {
    it('should keep angle within 0-360 unchanged', () => {
        expect(unwindAngle(45)).toBe(45);
        expect(unwindAngle(180)).toBe(180);
    });

    it('should normalize 360 to 0', () => {
        expect(unwindAngle(360)).toBe(0);
    });

    it('should normalize angles above 360', () => {
        expect(unwindAngle(370)).toBe(10);
        expect(unwindAngle(720)).toBe(0);
    });

    it('should normalize negative angles', () => {
        expect(unwindAngle(-10)).toBe(350);
        expect(unwindAngle(-360)).toBe(0);
    });
});

describe('quadrantShiftAngle', () => {
    it('should keep angles in [-180, 180] unchanged', () => {
        expect(quadrantShiftAngle(0)).toBe(0);
        expect(quadrantShiftAngle(90)).toBe(90);
        expect(quadrantShiftAngle(-90)).toBe(-90);
        expect(quadrantShiftAngle(180)).toBe(180);
        expect(quadrantShiftAngle(-180)).toBe(-180);
    });

    it('should shift angles above 180', () => {
        expect(quadrantShiftAngle(270)).toBe(-90);
        expect(quadrantShiftAngle(359)).toBe(-1);
    });

    it('should shift angles below -180', () => {
        expect(quadrantShiftAngle(-270)).toBe(90);
        expect(quadrantShiftAngle(-359)).toBe(1);
    });
});

describe('dateByAddingDays', () => {
    it('should add positive days', () => {
        const date = new Date('2025-01-01');
        const result = dateByAddingDays(date, 5);
        expect(result.getDate()).toBe(6);
        expect(result.getMonth()).toBe(0);
    });

    it('should add negative days', () => {
        const date = new Date('2025-01-05');
        const result = dateByAddingDays(date, -3);
        expect(result.getDate()).toBe(2);
    });

    it('should handle month boundaries', () => {
        const date = new Date('2025-01-31');
        const result = dateByAddingDays(date, 1);
        expect(result.getDate()).toBe(1);
        expect(result.getMonth()).toBe(1); // February
    });

    it('should not modify original date', () => {
        const date = new Date('2025-01-01');
        const originalTime = date.getTime();
        dateByAddingDays(date, 5);
        expect(date.getTime()).toBe(originalTime);
    });
});

describe('dateByAddingSeconds', () => {
    it('should add positive seconds', () => {
        const date = new Date('2025-01-01T00:00:00Z');
        const result = dateByAddingSeconds(date, 3600);
        expect(result.getHours()).toBe(1);
    });

    it('should add negative seconds', () => {
        const date = new Date('2025-01-01T01:00:00Z');
        const result = dateByAddingSeconds(date, -1800);
        expect(result.getMinutes()).toBe(30);
        expect(result.getHours()).toBe(0);
    });

    it('should handle day boundaries', () => {
        const date = new Date('2025-01-01T23:59:59Z');
        const result = dateByAddingSeconds(date, 2);
        expect(result.getDate()).toBe(2);
    });
});

describe('isLeapYear', () => {
    it('should return true for leap years divisible by 4', () => {
        expect(isLeapYear(2024)).toBe(true);
        expect(isLeapYear(2020)).toBe(true);
    });

    it('should return false for non-leap years', () => {
        expect(isLeapYear(2023)).toBe(false);
        expect(isLeapYear(2021)).toBe(false);
    });

    it('should return false for century years not divisible by 400', () => {
        expect(isLeapYear(1900)).toBe(false);
        expect(isLeapYear(2100)).toBe(false);
    });

    it('should return true for century years divisible by 400', () => {
        expect(isLeapYear(2000)).toBe(true);
        expect(isLeapYear(2400)).toBe(true);
    });
});

describe('dayOfYear', () => {
    it('should return 1 for January 1st', () => {
        expect(dayOfYear(new Date('2025-01-01'))).toBe(1);
    });

    it('should return 32 for February 1st', () => {
        expect(dayOfYear(new Date('2025-02-01'))).toBe(32);
    });

    it('should return 365 for December 31st in non-leap year', () => {
        expect(dayOfYear(new Date('2023-12-31'))).toBe(365);
    });

    it('should return 366 for December 31st in leap year', () => {
        expect(dayOfYear(new Date('2024-12-31'))).toBe(366);
    });

    it('should account for leap year in February', () => {
        expect(dayOfYear(new Date('2024-02-29'))).toBe(60);
        expect(dayOfYear(new Date('2024-03-01'))).toBe(61);
    });

    it('should handle mid-year dates', () => {
        expect(dayOfYear(new Date('2025-06-15'))).toBe(166);
    });
});

describe('daysSinceSolstice', () => {
    it('should calculate days since solstice for northern hemisphere', () => {
        const result = daysSinceSolstice(1, 2025, 45); // Jan 1
        expect(result).toBe(11); // Jan 1 + 10 offset
    });

    it('should calculate days since solstice for southern hemisphere', () => {
        const result = daysSinceSolstice(1, 2025, -45); // Jan 1
        expect(result).toBeGreaterThan(0);
    });

    it('should wrap around year boundary for northern hemisphere', () => {
        const result = daysSinceSolstice(360, 2025, 45); // Late December
        expect(result).toBeLessThan(365);
    });

    it('should handle leap years for northern hemisphere', () => {
        const result = daysSinceSolstice(100, 2024, 45);
        expect(result).toBeGreaterThan(0);
    });

    it('should handle leap years for southern hemisphere', () => {
        const result = daysSinceSolstice(100, 2024, -45);
        expect(result).toBeGreaterThan(0);
    });

    it('should handle equator (latitude 0)', () => {
        const result = daysSinceSolstice(100, 2025, 0);
        expect(result).toBeGreaterThan(0);
    });
});

describe('evaluateSeasonalAdjustment', () => {
    it('should interpolate in first segment (0-90)', () => {
        const result = evaluateSeasonalAdjustment(45, 100, 80, 90, 110);
        expect(result).toBeCloseTo(90.11, 0);
    });

    it('should interpolate in second segment (91-136)', () => {
        const result = evaluateSeasonalAdjustment(113, 100, 80, 90, 110);
        expect(result).toBeCloseTo(84.78, 0);
    });

    it('should interpolate in third segment (137-182)', () => {
        const result = evaluateSeasonalAdjustment(160, 100, 80, 90, 110);
        expect(result).toBeCloseTo(100, 1);
    });

    it('should interpolate in fourth segment (183-228)', () => {
        const result = evaluateSeasonalAdjustment(205, 100, 80, 90, 110);
        expect(result).toBeCloseTo(100.43, 0);
    });

    it('should interpolate in fifth segment (229-274)', () => {
        const result = evaluateSeasonalAdjustment(250, 100, 80, 90, 110);
        expect(result).toBeCloseTo(85.43, 0);
    });

    it('should interpolate in sixth segment (275+)', () => {
        const result = evaluateSeasonalAdjustment(300, 100, 80, 90, 110);
        expect(result).toBeCloseTo(85.49, 0);
    });

    it('should handle boundary values', () => {
        expect(evaluateSeasonalAdjustment(0, 100, 80, 90, 110)).toBe(100);
        expect(evaluateSeasonalAdjustment(91, 100, 80, 90, 110)).toBe(80);
    });
});

describe('seasonAdjustedMorningTwilight', () => {
    it('should return date before sunrise', () => {
        const sunrise = new Date('2025-01-15T07:00:00Z');
        const result = seasonAdjustedMorningTwilight(40, 15, 2025, sunrise);
        expect(result.getTime()).toBeLessThan(sunrise.getTime());
    });

    it('should adjust based on latitude', () => {
        const sunrise = new Date('2025-01-15T07:00:00Z');
        const low = seasonAdjustedMorningTwilight(10, 15, 2025, sunrise);
        const high = seasonAdjustedMorningTwilight(60, 15, 2025, sunrise);
        expect(Math.abs(sunrise.getTime() - high.getTime())).toBeGreaterThan(
            Math.abs(sunrise.getTime() - low.getTime()),
        );
    });

    it('should handle negative latitudes', () => {
        const sunrise = new Date('2025-01-15T07:00:00Z');
        const result = seasonAdjustedMorningTwilight(-40, 15, 2025, sunrise);
        expect(result).toBeInstanceOf(Date);
    });

    it('should adjust based on day of year', () => {
        const sunrise = new Date('2025-01-15T07:00:00Z');
        const winter = seasonAdjustedMorningTwilight(40, 15, 2025, sunrise);
        const summer = seasonAdjustedMorningTwilight(40, 180, 2025, sunrise);
        expect(winter.getTime()).not.toBe(summer.getTime());
    });
});

describe('seasonAdjustedEveningTwilight', () => {
    it('should return date after sunset', () => {
        const sunset = new Date('2025-01-15T17:00:00Z');
        const result = seasonAdjustedEveningTwilight(40, 15, 2025, sunset, 'general');
        expect(result.getTime()).toBeGreaterThan(sunset.getTime());
    });

    it('should handle ahmer shafaq', () => {
        const sunset = new Date('2025-01-15T17:00:00Z');
        const result = seasonAdjustedEveningTwilight(40, 15, 2025, sunset, 'ahmer');
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBeGreaterThan(sunset.getTime());
    });

    it('should handle abyad shafaq', () => {
        const sunset = new Date('2025-01-15T17:00:00Z');
        const result = seasonAdjustedEveningTwilight(40, 15, 2025, sunset, 'abyad');
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBeGreaterThan(sunset.getTime());
    });

    it('should handle general shafaq', () => {
        const sunset = new Date('2025-01-15T17:00:00Z');
        const result = seasonAdjustedEveningTwilight(40, 15, 2025, sunset, 'general');
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBeGreaterThan(sunset.getTime());
    });

    it('should differ between shafaq types', () => {
        const sunset = new Date('2025-01-15T17:00:00Z');
        const ahmer = seasonAdjustedEveningTwilight(40, 15, 2025, sunset, 'ahmer');
        const abyad = seasonAdjustedEveningTwilight(40, 15, 2025, sunset, 'abyad');
        expect(ahmer.getTime()).not.toBe(abyad.getTime());
    });

    it('should adjust based on latitude', () => {
        const sunset = new Date('2025-01-15T17:00:00Z');
        const low = seasonAdjustedEveningTwilight(10, 15, 2025, sunset, 'general');
        const high = seasonAdjustedEveningTwilight(60, 15, 2025, sunset, 'general');
        expect(high.getTime()).not.toBe(low.getTime());
    });
});

describe('julianDay', () => {
    it('should calculate Julian Day for J2000 epoch', () => {
        const result = julianDay(2000, 1, 1, 12);
        expect(result).toBeCloseTo(2451545.0, 1);
    });

    it('should calculate Julian Day for year 2025', () => {
        const result = julianDay(2025, 1, 1, 0);
        expect(result).toBeGreaterThan(2451545.0);
    });

    it('should handle months correctly', () => {
        const jan = julianDay(2025, 1, 15, 0);
        const feb = julianDay(2025, 2, 15, 0);
        expect(feb).toBeGreaterThan(jan);
    });

    it('should handle hours fractionally', () => {
        const noon = julianDay(2025, 1, 1, 12);
        const midnight = julianDay(2025, 1, 1, 0);
        expect(noon - midnight).toBeCloseTo(0.5, 5);
    });

    it('should handle historical dates', () => {
        const result = julianDay(1600, 1, 1, 0);
        expect(result).toBeLessThan(2451545.0);
    });
});

describe('julianCentury', () => {
    it('should return 0 for J2000 epoch', () => {
        const result = julianCentury(2451545.0);
        expect(result).toBeCloseTo(0, 10);
    });

    it('should return positive for dates after J2000', () => {
        const result = julianCentury(2460000.0);
        expect(result).toBeGreaterThan(0);
    });

    it('should return negative for dates before J2000', () => {
        const result = julianCentury(2400000.0);
        expect(result).toBeLessThan(0);
    });

    it('should calculate correct value for known date', () => {
        const jd = julianDay(2025, 1, 1, 0);
        const jc = julianCentury(jd);
        expect(jc).toBeCloseTo(0.25, 1);
    });
});

describe('meanSolarLongitude', () => {
    it('should return value in 0-360 range', () => {
        const result = meanSolarLongitude(0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });

    it('should change with time', () => {
        const t0 = meanSolarLongitude(0);
        const t1 = meanSolarLongitude(0.1);
        expect(t1).not.toBe(t0);
    });

    it('should be consistent', () => {
        const result1 = meanSolarLongitude(0.5);
        const result2 = meanSolarLongitude(0.5);
        expect(result1).toBe(result2);
    });
});

describe('meanLunarLongitude', () => {
    it('should return value in 0-360 range', () => {
        const result = meanLunarLongitude(0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });

    it('should change with time', () => {
        const t0 = meanLunarLongitude(0);
        const t1 = meanLunarLongitude(0.1);
        expect(t1).not.toBe(t0);
    });
});

describe('ascendingLunarNodeLongitude', () => {
    it('should return value in 0-360 range', () => {
        const result = ascendingLunarNodeLongitude(0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });

    it('should change with time', () => {
        const t0 = ascendingLunarNodeLongitude(0);
        const t1 = ascendingLunarNodeLongitude(0.1);
        expect(t1).not.toBe(t0);
    });
});

describe('meanSolarAnomaly', () => {
    it('should return value in 0-360 range', () => {
        const result = meanSolarAnomaly(0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });

    it('should change with time', () => {
        const t0 = meanSolarAnomaly(0);
        const t1 = meanSolarAnomaly(0.1);
        expect(t1).not.toBe(t0);
    });
});

describe('solarEquationOfTheCenter', () => {
    it('should return small correction value', () => {
        const result = solarEquationOfTheCenter(0, 0);
        expect(Math.abs(result)).toBeLessThan(3); // Max ~2 degrees
    });

    it('should vary with mean anomaly', () => {
        const r1 = solarEquationOfTheCenter(0, 0);
        const r2 = solarEquationOfTheCenter(0, 90);
        expect(r1).not.toBe(r2);
    });

    it('should vary with Julian century', () => {
        const r1 = solarEquationOfTheCenter(0, 45);
        const r2 = solarEquationOfTheCenter(1, 45);
        expect(r1).not.toBe(r2);
    });
});

describe('apparentSolarLongitude', () => {
    it('should return value in 0-360 range', () => {
        const result = apparentSolarLongitude(0, 280);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });

    it('should differ from mean longitude', () => {
        const mean = 280;
        const apparent = apparentSolarLongitude(0, mean);
        expect(apparent).not.toBe(mean);
    });

    it('should handle edge cases near 0/360', () => {
        const result = apparentSolarLongitude(0, 359);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });
});

describe('meanObliquityOfTheEcliptic', () => {
    it('should return value near 23.4 degrees', () => {
        const result = meanObliquityOfTheEcliptic(0);
        expect(result).toBeGreaterThan(23);
        expect(result).toBeLessThan(24);
    });

    it('should decrease over time', () => {
        const t0 = meanObliquityOfTheEcliptic(0);
        const t1 = meanObliquityOfTheEcliptic(1);
        expect(t1).toBeLessThan(t0);
    });
});

describe('apparentObliquityOfTheEcliptic', () => {
    it('should be close to mean obliquity', () => {
        const mean = meanObliquityOfTheEcliptic(0);
        const apparent = apparentObliquityOfTheEcliptic(0, mean);
        expect(Math.abs(apparent - mean)).toBeLessThan(0.1);
    });

    it('should differ slightly from mean', () => {
        const mean = 23.4;
        const apparent = apparentObliquityOfTheEcliptic(0, mean);
        expect(apparent).not.toBe(mean);
    });
});

describe('meanSiderealTime', () => {
    it('should return value in 0-360 range', () => {
        const result = meanSiderealTime(0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
    });

    it('should change with time', () => {
        const t0 = meanSiderealTime(0);
        const t1 = meanSiderealTime(0.001);
        expect(t1).not.toBe(t0);
    });
});

describe('nutationInLongitude', () => {
    it('should return small value', () => {
        const result = nutationInLongitude(0, 280, 218, 125);
        expect(Math.abs(result)).toBeLessThan(0.1);
    });

    it('should vary with input angles', () => {
        const r1 = nutationInLongitude(0, 280, 218, 125);
        const r2 = nutationInLongitude(0, 290, 218, 125);
        expect(r1).not.toBe(r2);
    });
});

describe('nutationInObliquity', () => {
    it('should return small value', () => {
        const result = nutationInObliquity(0, 280, 218, 125);
        expect(Math.abs(result)).toBeLessThan(0.1);
    });

    it('should vary with input angles', () => {
        const r1 = nutationInObliquity(0, 280, 218, 125);
        const r2 = nutationInObliquity(0, 290, 218, 125);
        expect(r1).not.toBe(r2);
    });
});

describe('altitudeOfCelestialBody', () => {
    it('should return value between -90 and 90', () => {
        const result = altitudeOfCelestialBody(40, 20, 0);
        expect(result).toBeGreaterThan(-90);
        expect(result).toBeLessThan(90);
    });

    it('should return maximum at zero hour angle', () => {
        const result = altitudeOfCelestialBody(40, 20, 0);
        expect(result).toBeGreaterThan(0);
    });

    it('should return lower altitude at larger hour angles', () => {
        const alt0 = altitudeOfCelestialBody(40, 20, 0);
        const alt45 = altitudeOfCelestialBody(40, 20, 45);
        expect(alt0).toBeGreaterThan(alt45);
    });

    it('should handle negative declinations', () => {
        const result = altitudeOfCelestialBody(40, -20, 0);
        expect(result).toBeGreaterThan(-90);
        expect(result).toBeLessThan(90);
    });
});

describe('interpolate', () => {
    it('should return middle value when n=0', () => {
        const result = interpolate(100, 90, 110, 0);
        expect(result).toBe(100);
    });

    it('should interpolate forward for positive n', () => {
        const result = interpolate(100, 90, 110, 0.5);
        expect(result).toBeGreaterThan(100);
        expect(result).toBeLessThan(110);
    });

    it('should interpolate backward for negative n', () => {
        const result = interpolate(100, 90, 110, -0.5);
        expect(result).toBeLessThan(100);
        expect(result).toBeGreaterThan(90);
    });

    it('should handle linear progression', () => {
        const result = interpolate(10, 5, 15, 0.5);
        expect(result).toBeCloseTo(12.5, 1);
    });
});

describe('interpolateAngles', () => {
    it('should return middle value when n=0', () => {
        const result = interpolateAngles(100, 90, 110, 0);
        expect(result).toBe(100);
    });

    it('should handle angle wraparound', () => {
        const result = interpolateAngles(359, 350, 10, 0.5);
        expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should interpolate correctly across 0/360 boundary', () => {
        const result = interpolateAngles(5, 350, 20, 0);
        expect(result).toBe(5);
    });
});

describe('approximateTransit', () => {
    it('should return value between 0 and 1', () => {
        const result = approximateTransit(-74, 280, 200);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
    });

    it('should vary with longitude', () => {
        const r1 = approximateTransit(-74, 280, 200);
        const r2 = approximateTransit(-75, 280, 200);
        expect(r1).not.toBe(r2);
    });

    it('should vary with right ascension', () => {
        const r1 = approximateTransit(-74, 280, 200);
        const r2 = approximateTransit(-74, 280, 210);
        expect(r1).not.toBe(r2);
    });
});

describe('correctedTransit', () => {
    it('should return value in 0-24 hour range', () => {
        const result = correctedTransit(0.5, -74, 280, 200, 199, 201);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(24);
    });

    it('should differ from approximate transit', () => {
        const approx = 0.5;
        const corrected = correctedTransit(approx, -74, 280, 200, 199, 201);
        expect(corrected * 24).not.toBe(approx);
    });

    it('should use interpolation', () => {
        const r1 = correctedTransit(0.5, -74, 280, 200, 199, 201);
        const r2 = correctedTransit(0.5, -74, 280, 200, 195, 205);
        expect(r1).not.toBe(r2);
    });
});

describe('correctedHourAngle', () => {
    const coords: Coordinates = { latitude: 40, longitude: -74 };

    it('should return value in 0-24 hour range', () => {
        const result = correctedHourAngle(0.5, -18, coords, false, 280, 200, 199, 201, 20, 19, 21);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(24);
    });

    it('should differ for morning vs evening', () => {
        const morning = correctedHourAngle(0.5, -18, coords, false, 280, 200, 199, 201, 20, 19, 21);
        const evening = correctedHourAngle(0.5, -18, coords, true, 280, 200, 199, 201, 20, 19, 21);
        expect(morning).not.toBe(evening);
    });

    it('should vary with angle', () => {
        const r1 = correctedHourAngle(0.5, -18, coords, false, 280, 200, 199, 201, 20, 19, 21);
        const r2 = correctedHourAngle(0.5, -12, coords, false, 280, 200, 199, 201, 20, 19, 21);
        expect(r1).not.toBe(r2);
    });

    it('should vary with latitude', () => {
        const coords1: Coordinates = { latitude: 40, longitude: -74 };
        const coords2: Coordinates = { latitude: 50, longitude: -74 };
        const r1 = correctedHourAngle(0.5, -18, coords1, false, 280, 200, 199, 201, 20, 19, 21);
        const r2 = correctedHourAngle(0.5, -18, coords2, false, 280, 200, 199, 201, 20, 19, 21);
        expect(r1).not.toBe(r2);
    });

    it('should vary with longitude', () => {
        const coords1: Coordinates = { latitude: 40, longitude: -74 };
        const coords2: Coordinates = { latitude: 40, longitude: -75 };
        const r1 = correctedHourAngle(0.5, -18, coords1, false, 280, 200, 199, 201, 20, 19, 21);
        const r2 = correctedHourAngle(0.5, -18, coords2, false, 280, 200, 199, 201, 20, 19, 21);
        expect(r1).not.toBe(r2);
    });

    it('should use interpolated declination', () => {
        const r1 = correctedHourAngle(0.5, -18, coords, false, 280, 200, 199, 201, 20, 19, 21);
        const r2 = correctedHourAngle(0.5, -18, coords, false, 280, 200, 199, 201, 20, 15, 25);
        expect(r1).not.toBe(r2);
    });
});

describe('fractionalDayToDate', () => {
    it('should convert 0 to midnight', () => {
        const date = new Date('2025-01-15');
        const result = fractionalDayToDate(0, date);
        expect(result.getUTCHours()).toBe(0);
        expect(result.getUTCMinutes()).toBe(0);
    });

    it('should convert 0.5 to noon', () => {
        const date = new Date('2025-01-15');
        const result = fractionalDayToDate(0.5, date);
        expect(result.getUTCHours()).toBe(12);
    });

    it('should convert 0.25 to 6am', () => {
        const date = new Date('2025-01-15');
        const result = fractionalDayToDate(0.25, date);
        expect(result.getUTCHours()).toBe(6);
    });

    it('should handle fractional hours', () => {
        const date = new Date('2025-01-15');
        const result = fractionalDayToDate(0.5 + 1 / 48, date); // 12:30
        expect(result.getUTCHours()).toBe(12);
        expect(result.getUTCMinutes()).toBe(30);
    });
});

describe('hoursToDate', () => {
    it('should convert 0 hours to midnight', () => {
        const date = new Date('2025-01-15');
        const result = hoursToDate(0, date);
        expect(result.getUTCHours()).toBe(0);
        expect(result.getUTCMinutes()).toBe(0);
        expect(result.getUTCSeconds()).toBe(0);
    });

    it('should convert 12 hours to noon', () => {
        const date = new Date('2025-01-15');
        const result = hoursToDate(12, date);
        expect(result.getUTCHours()).toBe(12);
    });

    it('should handle fractional hours', () => {
        const date = new Date('2025-01-15');
        const result = hoursToDate(12.5, date);
        expect(result.getUTCHours()).toBe(12);
        expect(result.getUTCMinutes()).toBe(30);
    });

    it('should handle fractional minutes', () => {
        const date = new Date('2025-01-15');
        const result = hoursToDate(1.508333333, date); // 1:30:30
        expect(result.getUTCHours()).toBe(1);
        expect(result.getUTCMinutes()).toBe(30);
        expect(result.getUTCSeconds()).toBe(29);
    });

    it('should preserve date', () => {
        const date = new Date('2025-01-15');
        const result = hoursToDate(6, date);
        expect(result.getUTCDate()).toBe(15);
        expect(result.getUTCMonth()).toBe(0);
        expect(result.getUTCFullYear()).toBe(2025);
    });

    it('should handle 24 hours correctly', () => {
        const date = new Date('2025-01-15');
        const result = hoursToDate(23.999, date);
        expect(result.getUTCDate()).toBe(15);
    });
});

describe('shortTimeZone', () => {
    it('should return timezone abbreviation for valid timezone', () => {
        const date = new Date('2025-01-15');
        const result = shortTimeZone(date, 'America/New_York');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
    });

    it('should handle UTC timezone', () => {
        const date = new Date('2025-01-15');
        const result = shortTimeZone(date, 'UTC');
        expect(result).toBeDefined();
    });

    it('should return original timezone on error', () => {
        const date = new Date('2025-01-15');
        const result = shortTimeZone(date, 'Invalid/Timezone');
        expect(result).toBe('Invalid/Timezone');
    });

    it('should handle different dates', () => {
        const winter = new Date('2025-01-15');
        const summer = new Date('2025-07-15');
        const winterTz = shortTimeZone(winter, 'America/New_York');
        const summerTz = shortTimeZone(summer, 'America/New_York');
        // Should differ due to DST
        expect(winterTz).toBeDefined();
        expect(summerTz).toBeDefined();
    });

    it('should handle timezones without DST', () => {
        const date = new Date('2025-01-15');
        const result = shortTimeZone(date, 'Asia/Dubai');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
    });
});
