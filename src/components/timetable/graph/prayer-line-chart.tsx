'use client';

import 'uplot/dist/uPlot.min.css';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import uPlot, { type AlignedData } from 'uplot';

import type { monthly, yearly } from '@/lib/calculator';

const MINUTES_IN_DAY = 24 * 60;

const SERIES_COLORS: Record<string, string> = {
    fajr: '#2563eb',
    sunrise: '#f59e0b',
    dhuhr: '#0ea5e9',
    asr: '#14b8a6',
    maghrib: '#f97316',
    isha: '#a855f7',
    middleOfTheNight: '#22c55e',
    lastThirdOfTheNight: '#ef4444',
    tarawih: '#f472b6',
};

const FALLBACK_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#06b6d4', '#f97316', '#a855f7'];

type Schedule = ReturnType<typeof monthly> | ReturnType<typeof yearly>;

type TimingEntry = Schedule['dates'][number]['timings'][number];

type ChartSeries = {
    event: string;
    label: string;
    values: (number | null)[];
    timeLabels: (string | null)[];
    color: string;
};

type PreparedChartData = {
    xValues: number[];
    series: ChartSeries[];
    baseFajrMin: number | null;
};

type ChartConfig = {
    data: AlignedData;
    options: uPlot.Options;
    metrics: {
        selectedEvent: string;
        paddedMin: number;
        paddedMax: number;
        scaleFactor: number;
    };
};

const minutesSinceMidnight = (value: Date) => {
    const midnight = new Date(value);
    midnight.setHours(0, 0, 0, 0);
    return (value.getTime() - midnight.getTime()) / 60000;
};

const normalizeMinutes = (minutes: number, currentOffset: number, baseOffset: number) => minutes + (baseOffset - currentOffset);

const formatMinutesLabel = (value: number) => {
    if (!Number.isFinite(value)) {
        return '';
    }
    const normalized = ((Math.round(value) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHour = ((hours + 11) % 12) + 1;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
};

const findTiming = (timings: TimingEntry[], event: string) => timings.find((timing) => timing.event === event);

const getColorFor = (event: string, index: number) => SERIES_COLORS[event] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

const buildSeriesOrder = (schedule: Schedule) => {
    const firstWithTimings = schedule.dates.find((day) => day.timings.length);
    if (!firstWithTimings) {
        return [] as TimingEntry['event'][];
    }
    const baseOrder = firstWithTimings.timings.map((timing) => timing.event);
    const seen = new Set(baseOrder);
    for (const day of schedule.dates) {
        for (const timing of day.timings) {
            if (!seen.has(timing.event)) {
                baseOrder.push(timing.event);
                seen.add(timing.event);
            }
        }
    }
    return baseOrder;
};

const reduceValues = (
    values: (number | null)[],
    reducer: (acc: number, value: number) => number,
    initial: number,
) => {
    let acc = initial;
    let used = false;
    for (const value of values) {
        if (value == null || Number.isNaN(value)) {
            continue;
        }
        if (!used) {
            acc = value;
            used = true;
            continue;
        }
        acc = reducer(acc, value);
    }
    return used ? acc : initial;
};

const TARGET_VISIBLE_RANGE_MINUTES = 600;

const isDev = process.env.NODE_ENV !== 'production';

const prepareChartData = (schedule: Schedule | null): PreparedChartData | null => {
    if (!schedule || !schedule.dates.length) {
        return null;
    }

    const baseTiming = schedule.dates[0]?.timings[0];
    if (!baseTiming) {
        return null;
    }

    const baseOffset = baseTiming.value.getTimezoneOffset();

    const xValues = schedule.dates.map((day) => {
        const reference = day.timings[0]?.value;
        if (!reference) {
            return Number.NaN;
        }
        const midnight = new Date(reference);
        midnight.setHours(0, 0, 0, 0);
        return midnight.getTime() / 1000;
    });

    const order = buildSeriesOrder(schedule);

    const series: ChartSeries[] = order.map((event, index) => {
        const label = schedule.dates[0]?.timings.find((timing) => timing.event === event)?.label ?? event;
        const values: (number | null)[] = [];
        const timeLabels: (string | null)[] = [];
        for (const day of schedule.dates) {
            const timing = findTiming(day.timings, event);
            if (!timing) {
                values.push(null);
                timeLabels.push(null);
                continue;
            }
            const minutes = minutesSinceMidnight(timing.value);
            const normalized = normalizeMinutes(minutes, timing.value.getTimezoneOffset(), baseOffset);
            values.push(normalized);
            timeLabels.push(timing.time);
        }
        return { event, label, values, timeLabels, color: getColorFor(event, index) };
    });

    const fajrSeries = series.find((entry) => entry.event === 'fajr');
    const baseFajrMin = fajrSeries ? reduceValues(fajrSeries.values, Math.min, Number.POSITIVE_INFINITY) : null;

    if (typeof baseFajrMin === 'number' && Number.isFinite(baseFajrMin)) {
        for (const entry of series) {
            entry.values = entry.values.map((value) => {
                if (value == null || Number.isNaN(value)) {
                    return value;
                }
                return value < baseFajrMin ? value + MINUTES_IN_DAY : value;
            });
        }
    }

    return { xValues, series, baseFajrMin: Number.isFinite(baseFajrMin ?? NaN) ? (baseFajrMin as number) : null };
};

const buildChartConfig = (prepared: PreparedChartData | null, selectedEvent: string | null): ChartConfig | null => {
    if (!prepared || !prepared.series.length) {
        return null;
    }

    const activeSeries = selectedEvent
        ? prepared.series.find((entry) => entry.event === selectedEvent)
        : prepared.series[0];

    if (!activeSeries) {
        return null;
    }

    const minVal = reduceValues(activeSeries.values, Math.min, Number.POSITIVE_INFINITY);
    const maxVal = reduceValues(activeSeries.values, Math.max, Number.NEGATIVE_INFINITY);

    let paddedMin = Number.isFinite(minVal) ? (minVal as number) - 10 : 0;
    let paddedMax = Number.isFinite(maxVal) ? (maxVal as number) + 10 : paddedMin + 60;

    if (Number.isFinite(prepared.baseFajrMin ?? NaN)) {
        paddedMin = Math.min(paddedMin, (prepared.baseFajrMin as number) - 20);
    }

    if (!Number.isFinite(paddedMin)) {
        paddedMin = 0;
    }
    if (!Number.isFinite(paddedMax)) {
        paddedMax = paddedMin + 60;
    }

    if (paddedMax <= paddedMin) {
        paddedMax = paddedMin + 30;
    }

    const yOffset = paddedMin;
    const rawRange = paddedMax - paddedMin;
    const scaleFactor = rawRange > TARGET_VISIBLE_RANGE_MINUTES ? rawRange / TARGET_VISIBLE_RANGE_MINUTES : 1;
    const inverseScale = 1 / scaleFactor;
    const safeMax = rawRange * inverseScale;

    const normalizedValues = activeSeries.values.map((value) => {
        if (value == null || Number.isNaN(value)) {
            return value;
        }
        return (value - yOffset) * inverseScale;
    });

    const data: AlignedData = [prepared.xValues, normalizedValues];

    if (isDev) {
        // eslint-disable-next-line no-console -- debug helper requested by maintainers
        console.log('[PrayerLineChart] series', prepared.series);
        // eslint-disable-next-line no-console -- debug helper requested by maintainers
        console.log('[PrayerLineChart] metrics', {
            selectedEvent: activeSeries.event,
            paddedMin,
            paddedMax,
            rawRange,
            scaleFactor,
            safeMax,
        });
        // eslint-disable-next-line no-console -- debug helper requested by maintainers
        console.log('[PrayerLineChart] data', data);
    }

    const options: uPlot.Options = {
        width: 800,
        height: 480,
        legend: { show: false },
        padding: [32, 24, 16, 80],
        scales: {
            x: { time: true },
            y: {
                range: () => [0, safeMax],
            },
        },
        axes: [
            {
                stroke: 'rgba(148, 163, 184, 0.9)',
                grid: { stroke: 'rgba(148, 163, 184, 0.2)' },
                values: (_self, ticks) =>
                    ticks.map((tick) => {
                        if (!Number.isFinite(tick)) {
                            return '';
                        }
                        const date = new Date(tick * 1000);
                        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    }),
            },
            {
                scale: 'y',
                stroke: 'rgba(148, 163, 184, 0.9)',
                grid: { stroke: 'rgba(148, 163, 184, 0.15)' },
                values: (_self, ticks) => ticks.map((tick) => formatMinutesLabel(tick * scaleFactor + yOffset)),
            },
        ],
        cursor: {
            focus: { prox: 24 },
        },
        series: [
            {},
            {
                label: activeSeries.label,
                stroke: activeSeries.color,
                width: 2,
                points: {
                    show: true,
                    size: 4,
                },
                value: (_self, value, idx) => {
                    if (value == null || !Number.isFinite(value)) {
                        return `${activeSeries.label}: —`;
                    }
                    const actualMinutes = value * scaleFactor + yOffset;
                    const timeLabel = activeSeries.timeLabels[idx] ?? formatMinutesLabel(actualMinutes);
                    return `${activeSeries.label}: ${timeLabel ?? '—'}`;
                },
            },
        ],
    };

    return { data, options, metrics: { selectedEvent: activeSeries.event, paddedMin, paddedMax, scaleFactor } };
};

export type PrayerLineChartProps = {
    schedule: Schedule | null;
};

export function PrayerLineChart({ schedule }: PrayerLineChartProps) {
    const prepared = useMemo(() => prepareChartData(schedule), [schedule]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<uPlot | null>(null);
    const selectId = useId();

    useEffect(() => {
        if (!prepared?.series.length) {
            if (selectedEvent !== null) {
                setSelectedEvent(null);
            }
            return;
        }
        if (!selectedEvent || !prepared.series.some((entry) => entry.event === selectedEvent)) {
            setSelectedEvent(prepared.series[0].event);
        }
    }, [prepared, selectedEvent]);

    const activeEvent = useMemo(() => {
        if (!prepared?.series.length) {
            return null;
        }
        if (selectedEvent && prepared.series.some((entry) => entry.event === selectedEvent)) {
            return selectedEvent;
        }
        return prepared.series[0].event;
    }, [prepared, selectedEvent]);

    const chartConfig = useMemo(() => buildChartConfig(prepared, activeEvent), [prepared, activeEvent]);

    useEffect(() => {
        if (!chartConfig || !containerRef.current) {
            return;
        }

        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight || chartConfig.options.height || 480;
        const opts: uPlot.Options = { ...chartConfig.options, width, height };
        const chart = new uPlot(opts, chartConfig.data, containerRef.current);
        chartRef.current = chart;

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver((entries) => {
                const [entry] = entries;
                if (!entry || !chartRef.current) {
                    return;
                }
                const nextWidth = entry.contentRect.width;
                const nextHeight = entry.contentRect.height || opts.height || 480;
                chartRef.current.setSize({ width: nextWidth, height: nextHeight });
            });
            observer.observe(containerRef.current);
        }

        return () => {
            observer?.disconnect();
            chart.destroy();
            chartRef.current = null;
        };
    }, [chartConfig]);

    useEffect(() => {
        if (!chartConfig) {
            return;
        }
        if (isDev) {
            // eslint-disable-next-line no-console -- debug helper requested by maintainers
            console.log('[PrayerLineChart] activeMetrics', chartConfig.metrics);
        }
    }, [chartConfig]);

    if (!prepared || !prepared.series.length || !activeEvent || !chartConfig) {
        return (
            <div className="rounded-lg border border-border/60 bg-background/60 p-6 text-center text-muted-foreground shadow">
                No timings available for this selection.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <label htmlFor={selectId} className="text-sm font-medium text-muted-foreground">
                    Prayer / Event
                </label>
                <select
                    id={selectId}
                    value={activeEvent}
                    onChange={(event) => setSelectedEvent(event.target.value)}
                    className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    {prepared.series.map((entry) => (
                        <option key={entry.event} value={entry.event}>
                            {entry.label}
                        </option>
                    ))}
                </select>
            </div>
            <div ref={containerRef} className="h-[55vh] min-h-[320px] max-h-[520px] w-full" />
        </div>
    );
}
