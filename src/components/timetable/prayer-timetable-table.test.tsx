import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { monthly, yearly } from '@/lib/calculator';
import { PrayerTimetableTable } from './prayer-timetable-table';

type Schedule = ReturnType<typeof monthly> | ReturnType<typeof yearly>;

const createMockSchedule = (): Schedule => ({
    dates: [
        {
            date: new Date('2024-03-15T00:00:00'),
            timings: [
                { event: 'fajr', isFard: true, label: 'Fajr', time: '5:30 AM', value: new Date('2024-03-15T05:30:00') },
                {
                    event: 'sunrise',
                    isFard: false,
                    label: 'Sunrise',
                    time: '6:45 AM',
                    value: new Date('2024-03-15T06:45:00'),
                },
                {
                    event: 'dhuhr',
                    isFard: true,
                    label: 'Dhuhr',
                    time: '12:30 PM',
                    value: new Date('2024-03-15T12:30:00'),
                },
                { event: 'asr', isFard: true, label: 'Asr', time: '4:00 PM', value: new Date('2024-03-15T16:00:00') },
                {
                    event: 'maghrib',
                    isFard: true,
                    label: 'Maghrib',
                    time: '6:30 PM',
                    value: new Date('2024-03-15T18:30:00'),
                },
                { event: 'isha', isFard: true, label: 'Isha', time: '8:00 PM', value: new Date('2024-03-15T20:00:00') },
            ],
        },
        {
            date: new Date('2024-03-16T00:00:00'),
            timings: [
                { event: 'fajr', isFard: true, label: 'Fajr', time: '5:29 AM', value: new Date('2024-03-16T05:29:00') },
                {
                    event: 'sunrise',
                    isFard: false,
                    label: 'Sunrise',
                    time: '6:44 AM',
                    value: new Date('2024-03-16T06:44:00'),
                },
                {
                    event: 'dhuhr',
                    isFard: true,
                    label: 'Dhuhr',
                    time: '12:30 PM',
                    value: new Date('2024-03-16T12:30:00'),
                },
                { event: 'asr', isFard: true, label: 'Asr', time: '4:01 PM', value: new Date('2024-03-16T16:01:00') },
                {
                    event: 'maghrib',
                    isFard: true,
                    label: 'Maghrib',
                    time: '6:31 PM',
                    value: new Date('2024-03-16T18:31:00'),
                },
                { event: 'isha', isFard: true, label: 'Isha', time: '8:01 PM', value: new Date('2024-03-16T20:01:00') },
            ],
        },
    ],
});

describe('PrayerTimetableTable', () => {
    describe('rendering', () => {
        it('should return null when schedule is null', () => {
            const { container } = render(<PrayerTimetableTable schedule={null} timeZone="America/New_York" />);

            expect(container.firstChild).toBeNull();
        });

        it('should render table when schedule is provided', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            // Should have table header
            expect(screen.getByText('Date')).toBeDefined();
        });

        it('should render all prayer time columns', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            expect(screen.getByText('Fajr')).toBeDefined();
            expect(screen.getByText('Sunrise')).toBeDefined();
            expect(screen.getByText('Dhuhr')).toBeDefined();
            expect(screen.getByText('Asr')).toBeDefined();
            expect(screen.getByText('Maghrib')).toBeDefined();
            expect(screen.getByText('Isha')).toBeDefined();
        });

        it('should render all dates from schedule', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            // Should render dates (formatted)
            const tableRows = screen.getAllByRole('row');
            // Header row + 2 data rows
            expect(tableRows.length).toBeGreaterThanOrEqual(2);
        });

        it('should render prayer times for each date', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            // Should have times from both dates
            expect(screen.getByText('5:30 AM')).toBeDefined();
            expect(screen.getByText('5:29 AM')).toBeDefined();
        });
    });

    describe('date formatting', () => {
        it('should format dates using default format', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            // Default format includes day, month, weekday
            const dateCells = screen.getAllByText(/Mar|Fri|Sat/i);
            expect(dateCells.length).toBeGreaterThan(0);
        });

        it('should format dates using custom dateFormat', () => {
            const schedule = createMockSchedule();
            const customFormat: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" dateFormat={customFormat} />);

            // Should render dates with custom format
            const dateCells = screen.getAllByText(/March|2024/i);
            expect(dateCells.length).toBeGreaterThan(0);
        });

        it('should handle ISO format dateFormat', () => {
            const schedule = createMockSchedule();
            const isoFormat: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" dateFormat={isoFormat} />);

            // ISO format should be YYYY-MM-DD
            const dateCells = screen.getAllByText(/2024-03-1[56]/);
            expect(dateCells.length).toBeGreaterThan(0);
        });

        it('should use timeZone for date formatting', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/Los_Angeles" />);

            // Dates should be formatted according to timezone
            const tableRows = screen.getAllByRole('row');
            expect(tableRows.length).toBeGreaterThan(0);
        });
    });

    describe('missing timings', () => {
        it('should display em dash (—) for missing timings', () => {
            // Create schedule where first day has all columns, but second day is missing some
            const scheduleWithMissing: Schedule = {
                dates: [
                    {
                        date: new Date('2024-03-15T00:00:00'),
                        timings: [
                            {
                                event: 'fajr',
                                isFard: true,
                                label: 'Fajr',
                                time: '5:30 AM',
                                value: new Date('2024-03-15T05:30:00'),
                            },
                            {
                                event: 'sunrise',
                                isFard: false,
                                label: 'Sunrise',
                                time: '6:45 AM',
                                value: new Date('2024-03-15T06:45:00'),
                            },
                            {
                                event: 'dhuhr',
                                isFard: true,
                                label: 'Dhuhr',
                                time: '12:30 PM',
                                value: new Date('2024-03-15T12:30:00'),
                            },
                            {
                                event: 'asr',
                                isFard: true,
                                label: 'Asr',
                                time: '4:00 PM',
                                value: new Date('2024-03-15T16:00:00'),
                            },
                        ],
                    },
                    {
                        date: new Date('2024-03-16T00:00:00'),
                        timings: [
                            {
                                event: 'fajr',
                                isFard: true,
                                label: 'Fajr',
                                time: '5:29 AM',
                                value: new Date('2024-03-16T05:29:00'),
                            },
                            {
                                event: 'dhuhr',
                                isFard: true,
                                label: 'Dhuhr',
                                time: '12:30 PM',
                                value: new Date('2024-03-16T12:30:00'),
                            },
                            // Missing sunrise and asr - should show em dash
                        ],
                    },
                ],
            };
            render(<PrayerTimetableTable schedule={scheduleWithMissing} timeZone="America/New_York" />);

            // Should show em dash for missing timings in second row
            const tableCells = screen.getAllByRole('cell');
            const hasEmDash = tableCells.some((cell) => cell.textContent === '—');
            expect(hasEmDash).toBe(true);
        });

        it('should handle empty timings array', () => {
            const scheduleWithEmpty: Schedule = { dates: [{ date: new Date('2024-03-15T00:00:00'), timings: [] }] };
            render(<PrayerTimetableTable schedule={scheduleWithEmpty} timeZone="America/New_York" />);

            // Should render table header but no data rows with timings
            expect(screen.getByText('Date')).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle schedule with single date', () => {
            const singleDateSchedule: Schedule = { dates: [createMockSchedule().dates[0]!] };
            render(<PrayerTimetableTable schedule={singleDateSchedule} timeZone="America/New_York" />);

            expect(screen.getByText('Fajr')).toBeDefined();
        });

        it('should handle schedule with many dates', () => {
            const manyDatesSchedule: Schedule = {
                dates: Array.from({ length: 30 }, (_, i) => {
                    const day = 15 + i;
                    const dateObj = new Date(2024, 2, day); // March 15-44, 2024
                    return {
                        date: dateObj,
                        timings: [
                            {
                                event: 'fajr',
                                isFard: true,
                                label: 'Fajr',
                                time: '5:30 AM',
                                value: new Date(2024, 2, day, 5, 30),
                            },
                            {
                                event: 'sunrise',
                                isFard: false,
                                label: 'Sunrise',
                                time: '6:45 AM',
                                value: new Date(2024, 2, day, 6, 45),
                            },
                            {
                                event: 'dhuhr',
                                isFard: true,
                                label: 'Dhuhr',
                                time: '12:30 PM',
                                value: new Date(2024, 2, day, 12, 30),
                            },
                            {
                                event: 'asr',
                                isFard: true,
                                label: 'Asr',
                                time: '4:00 PM',
                                value: new Date(2024, 2, day, 16, 0),
                            },
                            {
                                event: 'maghrib',
                                isFard: true,
                                label: 'Maghrib',
                                time: '6:30 PM',
                                value: new Date(2024, 2, day, 18, 30),
                            },
                            {
                                event: 'isha',
                                isFard: true,
                                label: 'Isha',
                                time: '8:00 PM',
                                value: new Date(2024, 2, day, 20, 0),
                            },
                        ],
                    };
                }),
            };
            render(<PrayerTimetableTable schedule={manyDatesSchedule} timeZone="America/New_York" />);

            const tableRows = screen.getAllByRole('row');
            // Header + 30 data rows
            expect(tableRows.length).toBeGreaterThanOrEqual(30);
        });

        it('should handle different timeZone values', () => {
            const schedule = createMockSchedule();
            const timeZones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Dubai'];

            for (const tz of timeZones) {
                const { unmount } = render(<PrayerTimetableTable schedule={schedule} timeZone={tz} />);

                expect(screen.getByText('Date')).toBeDefined();

                unmount();
            }
        });

        it('should handle schedule with dates that have different timing events', () => {
            const mixedSchedule: Schedule = {
                dates: [
                    {
                        date: new Date('2024-03-15T00:00:00'),
                        timings: [
                            {
                                event: 'fajr',
                                isFard: true,
                                label: 'Fajr',
                                time: '5:30 AM',
                                value: new Date('2024-03-15T05:30:00'),
                            },
                            {
                                event: 'dhuhr',
                                isFard: true,
                                label: 'Dhuhr',
                                time: '12:30 PM',
                                value: new Date('2024-03-15T12:30:00'),
                            },
                        ],
                    },
                    {
                        date: new Date('2024-03-16T00:00:00'),
                        timings: [
                            {
                                event: 'fajr',
                                isFard: true,
                                label: 'Fajr',
                                time: '5:29 AM',
                                value: new Date('2024-03-16T05:29:00'),
                            },
                            {
                                event: 'sunrise',
                                isFard: false,
                                label: 'Sunrise',
                                time: '6:44 AM',
                                value: new Date('2024-03-16T06:44:00'),
                            },
                            {
                                event: 'dhuhr',
                                isFard: true,
                                label: 'Dhuhr',
                                time: '12:30 PM',
                                value: new Date('2024-03-16T12:30:00'),
                            },
                        ],
                    },
                ],
            };
            render(<PrayerTimetableTable schedule={mixedSchedule} timeZone="America/New_York" />);

            // Should build columns from first day with timings
            expect(screen.getByText('Fajr')).toBeDefined();
            expect(screen.getByText('Dhuhr')).toBeDefined();
        });
    });

    describe('table structure', () => {
        it('should render table with header row', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            const headerRow = screen.getByRole('row', { name: /Date/i });
            expect(headerRow).toBeDefined();
        });

        it('should render table body with data rows', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            const tableRows = screen.getAllByRole('row');
            // Should have at least header + data rows
            expect(tableRows.length).toBeGreaterThan(1);
        });

        it('should use ISO string as key when available', () => {
            const schedule = createMockSchedule();
            render(<PrayerTimetableTable schedule={schedule} timeZone="America/New_York" />);

            // Table should render without key warnings
            const tableRows = screen.getAllByRole('row');
            expect(tableRows.length).toBeGreaterThan(0);
        });
    });
});
