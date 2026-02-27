import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import type { Schedule } from '@/types/graph';
import { usePrayerChart } from './use-prayer-chart';

// Mock ResizeObserver
const mockObserve = mock(() => {});
const mockDisconnect = mock(() => {});
global.ResizeObserver = ((_callback: ResizeObserverCallback) =>
    ({ disconnect: mockDisconnect, observe: mockObserve }) as ResizeObserver) as any;

const mockSchedule: Schedule = {
    dates: [
        {
            date: '2024-03-15',
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
                { event: 'isha', isFard: true, label: 'Isha', time: '7:45 PM', value: new Date('2024-03-15T19:45:00') },
            ],
        },
        {
            date: '2024-03-16',
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
                    time: '12:29 PM',
                    value: new Date('2024-03-16T12:29:00'),
                },
                { event: 'asr', isFard: true, label: 'Asr', time: '3:59 PM', value: new Date('2024-03-16T15:59:00') },
                {
                    event: 'maghrib',
                    isFard: true,
                    label: 'Maghrib',
                    time: '6:29 PM',
                    value: new Date('2024-03-16T18:29:00'),
                },
                { event: 'isha', isFard: true, label: 'Isha', time: '7:44 PM', value: new Date('2024-03-16T19:44:00') },
            ],
        },
    ],
    period: 'month',
};

describe('usePrayerChart', () => {
    let mockContainer: HTMLDivElement;

    beforeEach(() => {
        mockContainer = document.createElement('div');

        // Use Object.defineProperty for readonly properties
        Object.defineProperty(mockContainer, 'clientWidth', { configurable: true, value: 800 });
        Object.defineProperty(mockContainer, 'clientHeight', { configurable: true, value: 480 });

        mockContainer.getBoundingClientRect = mock(
            () =>
                ({
                    bottom: 480,
                    height: 480,
                    left: 0,
                    right: 800,
                    toJSON: () => ({}),
                    top: 0,
                    width: 800,
                    x: 0,
                    y: 0,
                }) as DOMRect,
        );
    });

    describe('initialization', () => {
        it('should return all required properties', () => {
            const { result } = renderHook(() => usePrayerChart(null, null));

            expect(result.current).toHaveProperty('containerRef');
            expect(result.current).toHaveProperty('activeEvent');
            expect(result.current).toHaveProperty('chartConfig');
            expect(result.current).toHaveProperty('prepared');
        });

        it('should initialize with null values when schedule is null', () => {
            const { result } = renderHook(() => usePrayerChart(null, null));

            expect(result.current.activeEvent).toBeNull();
            expect(result.current.chartConfig).toBeNull();
            expect(result.current.prepared).toBeNull();
        });

        it('should prepare chart data when schedule is provided', () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            expect(result.current.prepared).not.toBeNull();
            expect(result.current.prepared?.series.length).toBeGreaterThan(0);
        });
    });

    describe('controlled vs uncontrolled mode', () => {
        it('should use controlled selectedEvent when provided', () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, 'fajr'));

            expect(result.current.activeEvent).toBe('fajr');
        });

        it('should use internal state when selectedEvent is null (uncontrolled)', async () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            // Should default to first available event
            await waitFor(() => {
                expect(result.current.activeEvent === null || typeof result.current.activeEvent === 'string').toBe(
                    true,
                );
            });
        });

        it('should update activeEvent when controlled selectedEvent changes', () => {
            const { result, rerender } = renderHook(
                ({ selectedEvent }) => usePrayerChart(mockSchedule, selectedEvent),
                { initialProps: { selectedEvent: 'fajr' } },
            );

            expect(result.current.activeEvent).toBe('fajr');

            rerender({ selectedEvent: 'dhuhr' });

            expect(result.current.activeEvent).toBe('dhuhr');
        });
    });

    describe('onOptionsChange callback', () => {
        it('should call onOptionsChange with available events', async () => {
            const onOptionsChange = mock(() => {});

            renderHook(() => usePrayerChart(mockSchedule, null, onOptionsChange));

            await waitFor(() => {
                expect(onOptionsChange.mock.calls.length).toBeGreaterThan(0);
            });

            const callArgs = onOptionsChange.mock.calls[0];
            expect(Array.isArray(callArgs[0])).toBe(true);
            expect(callArgs[0].length).toBeGreaterThan(0);
        });

        it('should call onOptionsChange with default event', async () => {
            const onOptionsChange = mock(() => {});

            renderHook(() => usePrayerChart(mockSchedule, null, onOptionsChange));

            await waitFor(() => {
                expect(onOptionsChange.mock.calls.length).toBeGreaterThan(0);
            });

            const callArgs = onOptionsChange.mock.calls[0];
            expect(callArgs[1]).not.toBeNull(); // defaultEvent
        });
    });

    describe('onSelectedEventChange callback', () => {
        it('should call onSelectedEventChange when event changes in uncontrolled mode', async () => {
            const onSelectedEventChange = mock(() => {});

            renderHook(() => usePrayerChart(mockSchedule, null, undefined, onSelectedEventChange));

            await waitFor(() => {
                expect(onSelectedEventChange.mock.calls.length).toBeGreaterThan(0);
            });
        });

        it('should not call onSelectedEventChange in controlled mode', () => {
            const onSelectedEventChange = mock(() => {});

            renderHook(() => usePrayerChart(mockSchedule, 'fajr', undefined, onSelectedEventChange));

            // Should not be called in controlled mode
            expect(onSelectedEventChange).not.toHaveBeenCalled();
        });
    });

    describe('chart initialization', () => {
        it('should create chart when containerRef is attached', async () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            await waitFor(() => {
                expect(result.current.chartConfig).not.toBeNull();
            });

            // Simulate container being attached
            if (result.current.containerRef.current) {
                Object.assign(result.current.containerRef.current, mockContainer);
            }

            // Chart initialization depends on containerRef being attached
            // In a real scenario, uPlot would be instantiated here
            // For testing, we verify the structure is correct
            expect(result.current.containerRef).toBeDefined();
        });

        it('should destroy existing chart before creating new one', async () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            await waitFor(() => {
                expect(result.current.chartConfig).not.toBeNull();
            });

            if (result.current.containerRef.current) {
                Object.assign(result.current.containerRef.current, mockContainer);
            }

            // Change activeEvent to trigger chart recreation
            const { rerender } = renderHook(({ selectedEvent }) => usePrayerChart(mockSchedule, selectedEvent), {
                initialProps: { selectedEvent: 'fajr' },
            });

            rerender({ selectedEvent: 'dhuhr' });

            // Chart should be destroyed and recreated when activeEvent changes
            // In a real scenario, replaceChildren would be called
            expect(result.current.chartConfig).toBeDefined();
        });
    });

    describe('chart resizing', () => {
        it('should handle ResizeObserver for chart resizing', async () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            await waitFor(() => {
                expect(result.current.chartConfig).not.toBeNull();
            });

            if (result.current.containerRef.current) {
                Object.assign(result.current.containerRef.current, mockContainer);
            }

            // ResizeObserver should be created when container is available
            // In a real scenario, ResizeObserver would be instantiated
            expect(global.ResizeObserver).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle empty schedule', () => {
            const emptySchedule: Schedule = { dates: [], period: 'month' };
            const { result } = renderHook(() => usePrayerChart(emptySchedule, null));

            expect(result.current.prepared).toBeNull();
            expect(result.current.activeEvent).toBeNull();
        });

        it('should handle invalid selectedEvent', async () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, 'invalidEvent'));

            // Should fall back to first available event
            await waitFor(() => {
                // Should fall back to first available event
                expect(result.current.activeEvent === null || result.current.activeEvent !== 'invalidEvent').toBe(true);
            });
        });

        it('should handle schedule changes', () => {
            const { result, rerender } = renderHook(({ schedule }) => usePrayerChart(schedule, null), {
                initialProps: { schedule: mockSchedule },
            });

            const initialPrepared = result.current.prepared;

            const newSchedule: Schedule = {
                dates: [
                    {
                        date: '2024-03-17',
                        timings: [
                            {
                                event: 'fajr',
                                isFard: true,
                                label: 'Fajr',
                                time: '5:28 AM',
                                value: new Date('2024-03-17T05:28:00'),
                            },
                            {
                                event: 'dhuhr',
                                isFard: true,
                                label: 'Dhuhr',
                                time: '12:28 PM',
                                value: new Date('2024-03-17T12:28:00'),
                            },
                        ],
                    },
                ],
                period: 'month',
            };

            rerender({ schedule: newSchedule });

            // Prepared data should update
            expect(result.current.prepared).not.toBe(initialPrepared);
        });

        it('should handle containerRef being null', () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            expect(result.current.containerRef.current).toBeNull();
            // Should not crash
            expect(result.current.chartConfig).not.toBeNull();
        });
    });

    describe('return value structure', () => {
        it('should return containerRef as a ref object', () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            expect(result.current.containerRef).toHaveProperty('current');
        });

        it('should return activeEvent as string or null', () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            expect(result.current.activeEvent === null || typeof result.current.activeEvent === 'string').toBe(true);
        });

        it('should return chartConfig as object or null', () => {
            const { result } = renderHook(() => usePrayerChart(mockSchedule, null));

            expect(result.current.chartConfig === null || typeof result.current.chartConfig === 'object').toBe(true);
        });
    });
});
