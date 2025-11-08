import { describe, expect, it } from 'bun:test';
import {
    formatCoordinate,
    formatDate,
    formatHijriDate,
    formatMinutesLabel,
    formatTime,
    phaseLabelAndTime,
} from '@/lib/formatting';
import type { HijriDate } from '@/types/hijri';
import type { DayData, Timeline } from '@/types/timeline';

describe('formatTime', () => {
    it('should format time in 12-hour format', () => {
        const date = new Date('2025-01-01T14:30:00Z'); // UTC
        const result = formatTime(date, 'America/New_York');
        expect(result).toContain('9:30'); // 14:30 UTC = 9:30 EST
        expect(result).toContain('AM');
    });

    it('should handle morning times', () => {
        const date = new Date('2025-01-01T10:15:00Z'); // UTC
        const result = formatTime(date, 'America/New_York');
        expect(result).toContain('5:15'); // 10:15 UTC = 5:15 EST
        expect(result).toContain('AM');
    });

    it('should handle midnight', () => {
        const date = new Date('2025-01-01T05:00:00Z'); // UTC
        const result = formatTime(date, 'America/New_York');
        expect(result).toContain('12:00'); // 5:00 UTC = 12:00 EST (midnight)
        expect(result).toContain('AM');
    });

    it('should handle noon', () => {
        const date = new Date('2025-01-01T17:00:00Z'); // UTC
        const result = formatTime(date, 'America/New_York');
        expect(result).toContain('12:00'); // 17:00 UTC = 12:00 EST (noon)
        expect(result).toContain('PM');
    });
});

describe('formatDate', () => {
    it('should format date with full details', () => {
        const date = new Date('2025-01-15');
        const result = formatDate(date);
        expect(result).toContain('January');
        expect(result).toContain('15');
        expect(result).toContain('2025');
    });

    it('should include weekday', () => {
        const date = new Date('2025-01-01'); // Wednesday
        const result = formatDate(date);
        expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    });
});

describe('formatMinutesLabel', () => {
    it('should return empty string for non-finite values', () => {
        expect(formatMinutesLabel(NaN)).toBe('');
        expect(formatMinutesLabel(Number.POSITIVE_INFINITY)).toBe('');
        expect(formatMinutesLabel(Number.NEGATIVE_INFINITY)).toBe('');
    });

    it('should format midnight', () => {
        expect(formatMinutesLabel(0)).toBe('12:00 AM');
    });

    it('should format morning times', () => {
        expect(formatMinutesLabel(300)).toBe('5:00 AM'); // 5 hours * 60 minutes
        expect(formatMinutesLabel(315)).toBe('5:15 AM');
    });

    it('should format noon', () => {
        expect(formatMinutesLabel(720)).toBe('12:00 PM');
    });

    it('should format afternoon times', () => {
        expect(formatMinutesLabel(870)).toBe('2:30 PM'); // 14.5 hours * 60
    });

    it('should format evening times', () => {
        expect(formatMinutesLabel(1200)).toBe('8:00 PM'); // 20 hours * 60
    });

    it('should handle values over 24 hours', () => {
        expect(formatMinutesLabel(1500)).toBe('1:00 AM'); // 25 hours wraps to 1 AM
    });

    it('should handle negative values', () => {
        expect(formatMinutesLabel(-60)).toBe('11:00 PM'); // -1 hour wraps to 11 PM
    });

    it('should pad minutes with zero', () => {
        expect(formatMinutesLabel(305)).toBe('5:05 AM');
    });
});

describe('formatHijriDate', () => {
    it('should format Hijri date correctly', () => {
        const hijri: HijriDate = { date: 15, day: 'Monday', month: 'Ramadan', monthIndex: 8, year: 1446 };
        const result = formatHijriDate(hijri);
        expect(result).toBe('Monday, 15 Ramadan 1446 AH');
    });

    it('should handle single digit dates', () => {
        const hijri: HijriDate = { date: 1, day: 'Friday', month: 'Muharram', monthIndex: 0, year: 1446 };
        const result = formatHijriDate(hijri);
        expect(result).toBe('Friday, 1 Muharram 1446 AH');
    });
});

describe('formatCoordinate', () => {
    it('should format positive latitude', () => {
        expect(formatCoordinate(40.7128, 'N', 'S')).toBe('40.7128° N');
    });

    it('should format negative latitude', () => {
        expect(formatCoordinate(-33.8688, 'N', 'S')).toBe('33.8688° S');
    });

    it('should format positive longitude', () => {
        expect(formatCoordinate(74.006, 'E', 'W')).toBe('74.0060° E');
    });

    it('should format negative longitude', () => {
        expect(formatCoordinate(-122.4194, 'E', 'W')).toBe('122.4194° W');
    });

    it('should handle zero', () => {
        expect(formatCoordinate(0, 'N', 'S')).toBe('0.0000° N');
    });

    it('should format to 4 decimal places', () => {
        expect(formatCoordinate(12.3456789, 'N', 'S')).toBe('12.3457° N');
    });
});

describe('phaseLabelAndTime', () => {
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

    const mockTimings: DayData['timings'] = [
        { event: 'fajr', label: 'Fajr', time: '5:00 AM', value: new Date('2025-01-01T10:00:00Z') },
        { event: 'sunrise', label: 'Sunrise', time: '6:30 AM', value: new Date('2025-01-01T11:30:00Z') },
        { event: 'dhuhr', label: 'Dhuhr', time: '12:00 PM', value: new Date('2025-01-01T17:00:00Z') },
        { event: 'asr', label: 'Asr', time: '3:00 PM', value: new Date('2025-01-01T20:00:00Z') },
        { event: 'maghrib', label: 'Maghrib', time: '5:30 PM', value: new Date('2025-01-01T22:30:00Z') },
        { event: 'isha', label: 'Isha', time: '7:00 PM', value: new Date('2025-01-02T00:00:00Z') },
        { event: 'middleOfTheNight', label: 'Half Night', time: '12:15 AM', value: new Date('2025-01-02T05:15:00Z') },
        { event: 'lastThirdOfTheNight', label: 'Last Third', time: '2:30 AM', value: new Date('2025-01-02T07:30:00Z') },
    ];

    it('should return Fajr before sunrise', () => {
        const result = phaseLabelAndTime(0.1, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('Fajr');
        expect(result.time).toContain('5:00');
    });

    it('should return Sunrise between sunrise and dhuhr', () => {
        const result = phaseLabelAndTime(0.2, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('Sunrise');
        expect(result.time).toContain('6:30');
    });

    it('should return Dhuhr between dhuhr and asr', () => {
        const result = phaseLabelAndTime(0.5, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('Dhuhr');
        expect(result.time).toContain('12:00');
    });

    it('should return Asr between asr and maghrib', () => {
        const result = phaseLabelAndTime(0.65, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('ʿAṣr');
        expect(result.time).toContain('3:00');
    });

    it('should return Maghrib between maghrib and isha', () => {
        const result = phaseLabelAndTime(0.8, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('Maġrib');
        expect(result.time).toContain('5:30');
    });

    it('should return Isha between isha and midnight', () => {
        const result = phaseLabelAndTime(0.87, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('ʿIshāʾ');
        expect(result.time).toContain('7:00');
    });

    it('should return Half the Night between midnight and last third', () => {
        const result = phaseLabelAndTime(0.92, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('1/2 Night Begins');
        expect(result.time).toContain('12:15');
    });

    it('should return Last 1/3 after last third', () => {
        const result = phaseLabelAndTime(0.97, mockTimeline, mockTimings, 'America/New_York');
        expect(result.label).toBe('Last 1/3 Night Begins');
        expect(result.time).toContain('2:30');
    });
});
