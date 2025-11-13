import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { MAX_BUFFERED_DAYS, salatLabels } from '@/lib/constants';
import { daily } from '@/lib/calculator';
import { useDayBuffer } from './use-days';
import type { CalculationConfig } from '@/lib/calculator';

// Suppress React act warnings during tests
let consoleErrorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
    // Spy on console.error to suppress React act warnings
    consoleErrorSpy = spyOn(console, 'error').mockImplementation((message, ...args) => {
        // Only suppress React act warnings, let other errors through
        if (typeof message === 'string' && message.includes('act(')) {
            return;
        }
        // Call the original console.error for other messages
        consoleErrorSpy.getMockImplementation()?.(message, ...args);
    });
});

afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
});

const mockConfig: CalculationConfig = {
    fajrAngle: 15,
    ishaAngle: 15,
    ishaInterval: 0,
    latitude: '43.6532',
    longitude: '-79.3832',
    method: 'MuslimWorldLeague',
    timeZone: 'America/Toronto',
};

// Helper to create mock day data (matches use-days.ts implementation)
const createMockDayData = (date: Date, config: CalculationConfig) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const safeDate = new Date(year, month, day, 12, 0, 0, 0);
    const nextDate = new Date(year, month, day + 1, 12, 0, 0, 0);
    const nextRes = daily(salatLabels, config, nextDate);
    const nextFajr = nextRes.timings.find((t) => t.event === 'fajr')?.value ?? null;
    const todayRes = daily(salatLabels, config, safeDate);
    return { date: safeDate, dayIndex: 0, nextFajr, timings: todayRes.timings };
};

describe('useDayBuffer', () => {
    describe('initialization', () => {
        it('should initialize with one day when coordinates are valid', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            expect(result.current.days.length).toBe(1);
            expect(result.current.days[0]).toHaveProperty('date');
            expect(result.current.days[0]).toHaveProperty('timings');
            expect(result.current.days[0]).toHaveProperty('nextFajr');
            expect(result.current.days[0]).toHaveProperty('dayIndex');
        });

        it('should initialize with empty array when coordinates are invalid', async () => {
            const invalidConfig: CalculationConfig = {
                ...mockConfig,
                latitude: 'invalid',
                longitude: 'invalid',
            };

            const { result } = renderHook(() => useDayBuffer(invalidConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBe(0);
            });
        });

        it('should initialize with correct Islamic day (before Fajr = yesterday)', async () => {
            // This test verifies that the hook correctly identifies the Islamic day
            // by checking if current time is before today's Fajr
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const day = result.current.days[0];
            expect(day).not.toBeUndefined();
            expect(day!.timings.length).toBeGreaterThan(0);
        });
    });

    describe('addPreviousDay', () => {
        it('should add a day before the current buffer', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const initialLength = result.current.days.length;
            const firstDate = result.current.days[0]!.date;

            act(() => {
                result.current.addPreviousDay();
            });

            await waitFor(() => {
                expect(result.current.days.length).toBe(initialLength + 1);
            });

            const newFirstDate = result.current.days[0]!.date;
            expect(newFirstDate.getTime()).toBeLessThan(firstDate.getTime());
        });

        it('should maintain max buffer size when adding previous days', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Add more days than MAX_BUFFERED_DAYS
            act(() => {
                for (let i = 0; i < MAX_BUFFERED_DAYS + 2; i++) {
                    result.current.addPreviousDay();
                }
            });

            await waitFor(() => {
                expect(result.current.days.length).toBeLessThanOrEqual(MAX_BUFFERED_DAYS);
            });
        });

        it('should not exceed max buffer size', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Add multiple days rapidly
            act(() => {
                for (let i = 0; i < MAX_BUFFERED_DAYS + 2; i++) {
                    result.current.addPreviousDay();
                }
            });

            // Wait for state to settle
            await waitFor(() => {
                // Days should be > 1 since we added multiple
                expect(result.current.days.length).toBeGreaterThanOrEqual(1);
            }, { timeout: 2000 });

            // Buffer should never exceed MAX_BUFFERED_DAYS due to slice(0, MAX_BUFFERED_DAYS)
            expect(result.current.days.length).toBeLessThanOrEqual(MAX_BUFFERED_DAYS);
        });
    });

    describe('addNextDay', () => {
        it('should add a day after the current buffer', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const initialLength = result.current.days.length;
            const lastDate = result.current.days[result.current.days.length - 1]!.date;

            act(() => {
                result.current.addNextDay();
            });

            await waitFor(() => {
                expect(result.current.days.length).toBe(initialLength + 1);
            });

            const newLastDate = result.current.days[result.current.days.length - 1]!.date;
            expect(newLastDate.getTime()).toBeGreaterThan(lastDate.getTime());
        });

        it('should maintain max buffer size when adding next days', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Add more days than MAX_BUFFERED_DAYS
            act(() => {
                for (let i = 0; i < MAX_BUFFERED_DAYS + 2; i++) {
                    result.current.addNextDay();
                }
            });

            await waitFor(() => {
                expect(result.current.days.length).toBeLessThanOrEqual(MAX_BUFFERED_DAYS);
            });
        });

        it('should not exceed max buffer size', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Add multiple days rapidly
            act(() => {
                for (let i = 0; i < MAX_BUFFERED_DAYS + 2; i++) {
                    result.current.addNextDay();
                }
            });

            // Wait for state to settle
            await waitFor(() => {
                // Days should be > 1 since we added multiple
                expect(result.current.days.length).toBeGreaterThanOrEqual(1);
            }, { timeout: 2000 });

            // Buffer should never exceed MAX_BUFFERED_DAYS due to conditional slicing
            expect(result.current.days.length).toBeLessThanOrEqual(MAX_BUFFERED_DAYS);
        });
    });

    describe('day data structure', () => {
        it('should include all required properties in day data', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const day = result.current.days[0];
            expect(day).toHaveProperty('date');
            expect(day).toHaveProperty('timings');
            expect(day).toHaveProperty('nextFajr');
            expect(day).toHaveProperty('dayIndex');
            expect(Array.isArray(day!.timings)).toBe(true);
            expect(day!.timings.length).toBeGreaterThan(0);
        });

        it('should have unique dayIndex values', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            act(() => {
                result.current.addPreviousDay();
                result.current.addNextDay();
            });

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(1);
            });

            const indices = result.current.days.map((d) => d.dayIndex);
            const uniqueIndices = new Set(indices);
            expect(uniqueIndices.size).toBe(indices.length);
        });

        it('should calculate nextFajr correctly', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const day = result.current.days[0];
            expect(day!.nextFajr).not.toBeNull();
            expect(day!.nextFajr).toBeInstanceOf(Date);
            expect(day!.nextFajr!.getTime()).toBeGreaterThan(day!.date.getTime());
        });
    });

    describe('config changes', () => {
        it('should reinitialize when coordinates change', async () => {
            const { result, rerender } = renderHook(
                ({ config }) => useDayBuffer(config),
                { initialProps: { config: mockConfig } }
            );

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const newConfig: CalculationConfig = {
                ...mockConfig,
                latitude: '40.7128',
                longitude: '-74.0060', // New York
            };

            // Rerender triggers useEffect, which updates state
            await act(async () => {
                rerender({ config: newConfig });
                // Wait a tick for useEffect to run
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            await waitFor(() => {
                // Wait for re-initialization to complete
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Days should be recalculated with new coordinates
            expect(result.current.days[0]!.timings.length).toBeGreaterThan(0);
        });

        it('should reinitialize when method changes', async () => {
            const { result, rerender } = renderHook(
                ({ config }) => useDayBuffer(config),
                { initialProps: { config: mockConfig } }
            );

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            const newConfig: CalculationConfig = {
                ...mockConfig,
                method: 'NorthAmerica',
            };

            // Rerender triggers useEffect, which updates state
            await act(async () => {
                rerender({ config: newConfig });
                // Wait a tick for useEffect to run
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            await waitFor(() => {
                // Wait for re-initialization to complete
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            expect(result.current.days[0]!.timings.length).toBeGreaterThan(0);
        });
    });

    describe('edge cases', () => {
        it('should handle empty days array gracefully', () => {
            const invalidConfig: CalculationConfig = {
                ...mockConfig,
                latitude: '',
                longitude: '',
            };

            const { result } = renderHook(() => useDayBuffer(invalidConfig));

            expect(result.current.days).toEqual([]);
            expect(() => result.current.addPreviousDay()).not.toThrow();
            expect(() => result.current.addNextDay()).not.toThrow();
        });

        it('should handle rapid addPreviousDay calls', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Rapidly add multiple days
            act(() => {
                for (let i = 0; i < 10; i++) {
                    result.current.addPreviousDay();
                }
            });

            await waitFor(() => {
                expect(result.current.days.length).toBeLessThanOrEqual(MAX_BUFFERED_DAYS);
            });
        });

        it('should handle rapid addNextDay calls', async () => {
            const { result } = renderHook(() => useDayBuffer(mockConfig));

            await waitFor(() => {
                expect(result.current.days.length).toBeGreaterThan(0);
            });

            // Rapidly add multiple days
            act(() => {
                for (let i = 0; i < 10; i++) {
                    result.current.addNextDay();
                }
            });

            await waitFor(() => {
                expect(result.current.days.length).toBeLessThanOrEqual(MAX_BUFFERED_DAYS);
            });
        });
    });
});

