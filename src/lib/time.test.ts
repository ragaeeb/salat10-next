import { describe, expect, it } from 'bun:test';
import type { DateRange } from 'react-day-picker';
import {
    formatDateParam,
    formatDateRangeDisplay,
    generateScheduleLabel,
    parseInitialDateRange,
    updateDateRangeParams,
} from '@/lib/time';

describe('formatDateParam', () => {
    it('should format date as YYYY-MM-DD', () => {
        const date = new Date('2025-01-15');
        expect(formatDateParam(date)).toBe('2025-01-15');
    });

    it('should pad single digit month', () => {
        const date = new Date('2025-03-05');
        expect(formatDateParam(date)).toBe('2025-03-05');
    });

    it('should pad single digit day', () => {
        const date = new Date('2025-12-01');
        expect(formatDateParam(date)).toBe('2025-12-01');
    });

    it('should handle year boundaries', () => {
        const date = new Date('2025-12-31');
        expect(formatDateParam(date)).toBe('2025-12-31');
    });
});

describe('parseInitialDateRange', () => {
    it('should return current month as default when no params', () => {
        const result = parseInitialDateRange(undefined);
        const now = new Date();

        expect(result.from.getMonth()).toBe(now.getMonth());
        expect(result.from.getDate()).toBe(1);
        expect(result.to.getMonth()).toBe(now.getMonth() + 1 === 12 ? 0 : now.getMonth());
    });

    it('should parse from and to params', () => {
        const params = { from: '2025-01-01', to: '2025-01-31' };
        const result = parseInitialDateRange(params);

        expect(result.from.getFullYear()).toBe(2025);
        expect(result.from.getMonth()).toBe(0);
        expect(result.from.getDate()).toBe(1);
        expect(result.to.getDate()).toBe(31);
    });

    it('should handle array params', () => {
        const params = { from: ['2025-02-01'], to: ['2025-02-28'] };
        const result = parseInitialDateRange(params);

        expect(result.from.getMonth()).toBe(1);
        expect(result.to.getDate()).toBe(28);
    });

    it('should use default if from is missing', () => {
        const params = { to: '2025-03-31' };
        const result = parseInitialDateRange(params);
        const now = new Date();

        expect(result.from.getMonth()).toBe(now.getMonth());
        expect(result.from.getDate()).toBe(1);
    });

    it('should use default if to is missing', () => {
        const params = { from: '2025-01-01' };
        const result = parseInitialDateRange(params);
        const now = new Date();

        expect(result.from.getFullYear()).toBe(2025);
        expect(result.to.getMonth()).toBe(now.getMonth());
    });
});

describe('formatDateRangeDisplay', () => {
    it('should return placeholder when no from date', () => {
        expect(formatDateRangeDisplay(undefined)).toBe('Pick a date range');
        expect(formatDateRangeDisplay({} as DateRange)).toBe('Pick a date range');
    });

    it('should format single date when no to date', () => {
        const range: DateRange = { from: new Date('2025-01-15') };
        const result = formatDateRangeDisplay(range);

        expect(result).toContain('Jan');
        expect(result).toContain('15');
        expect(result).toContain('2025');
    });

    it('should format date range with from and to', () => {
        const range: DateRange = { from: new Date('2025-01-01'), to: new Date('2025-01-31') };
        const result = formatDateRangeDisplay(range);

        expect(result).toContain('Jan 1, 2025');
        expect(result).toContain('Jan 31, 2025');
        expect(result).toContain('-');
    });

    it('should handle cross-month range', () => {
        const range: DateRange = { from: new Date('2025-01-15'), to: new Date('2025-02-15') };
        const result = formatDateRangeDisplay(range);

        expect(result).toContain('Jan');
        expect(result).toContain('Feb');
    });
});

describe('generateScheduleLabel', () => {
    it('should generate label from date range', () => {
        const from = new Date('2025-01-01');
        const to = new Date('2025-01-31');
        const result = generateScheduleLabel(from, to);

        expect(result).toContain('Jan 1, 2025');
        expect(result).toContain('Jan 31, 2025');
        expect(result).toContain('-');
    });

    it('should handle same day range', () => {
        const date = new Date('2025-03-15');
        const result = generateScheduleLabel(date, date);

        expect(result).toContain('Mar 15, 2025');
    });
});

describe('updateDateRangeParams', () => {
    it('should add from and to params to empty URLSearchParams', () => {
        const params = new URLSearchParams();
        const from = new Date('2025-01-01');
        const to = new Date('2025-01-31');

        const result = updateDateRangeParams(params, from, to);

        expect(result.get('from')).toBe('2025-01-01');
        expect(result.get('to')).toBe('2025-01-31');
    });

    it('should update existing params', () => {
        const params = new URLSearchParams('from=2024-12-01&to=2024-12-31');
        const from = new Date('2025-01-01');
        const to = new Date('2025-01-31');

        const result = updateDateRangeParams(params, from, to);

        expect(result.get('from')).toBe('2025-01-01');
        expect(result.get('to')).toBe('2025-01-31');
    });

    it('should preserve other params', () => {
        const params = new URLSearchParams('from=2024-12-01&to=2024-12-31&other=value');
        const from = new Date('2025-01-01');
        const to = new Date('2025-01-31');

        const result = updateDateRangeParams(params, from, to);

        expect(result.get('other')).toBe('value');
    });

    it('should create new URLSearchParams instance', () => {
        const params = new URLSearchParams();
        const from = new Date('2025-01-01');
        const to = new Date('2025-01-31');

        const result = updateDateRangeParams(params, from, to);

        expect(result).not.toBe(params);
    });
});
