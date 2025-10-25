'use client';

import 'uplot/dist/uPlot.min.css';

import { useEffect, useMemo, useRef } from 'react';
import type uPlot, { AlignedData } from 'uplot';

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

type ChartConfig = {
    data: AlignedData;
    options: uPlot.Options;
    key: string;
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

const buildChartConfig = (schedule: Schedule | null): ChartConfig | null => {
    if (!schedule || !schedule.dates.length) {
        return null;
    }

    const baseTiming = schedule.dates[0]?.timings[0];
    if (!baseTiming) {
        return null;
    }
    const baseOffset = baseTiming.value.getTimezoneOffset();

    const xValues = schedule.dates.map((day) => {
        const reference = day.timings[0]?.value ?? new Date();
        return reference.getTime();
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

    const data: AlignedData = [xValues, ...series.map((entry) => entry.values)];

    const fajrSeries = series.find((entry) => entry.event === 'fajr');
    const lastThirdSeries =
        series.find((entry) => entry.event === 'lastThirdOfTheNight') ?? series.find((entry) => entry.event === 'isha');

    const valuesFor = (entry: ChartSeries | undefined, reducer: (acc: number, value: number) => number, initial: number) => {
        if (!entry) {
            return initial;
        }
        return entry.values.reduce((acc, value) => {
            if (value == null || Number.isNaN(value)) {
                return acc;
            }
            return reducer(acc, value);
        }, initial);
    };

    const yMin = valuesFor(fajrSeries, (acc, value) => Math.min(acc, value), Number.POSITIVE_INFINITY);
    const yMax = valuesFor(lastThirdSeries, (acc, value) => Math.max(acc, value), Number.NEGATIVE_INFINITY);

    const paddedMin = Number.isFinite(yMin) ? yMin - 20 : 0;
    const paddedMax = Number.isFinite(yMax) ? yMax + 20 : 24 * 60;

    const options: uPlot.Options = {
        width: 800,
        height: 420,
        legend: { show: true },
        scales: {
            x: { time: true },
            y: {
                range: [paddedMin, paddedMax],
            },
        },
        axes: [
            {
                stroke: 'rgba(148, 163, 184, 0.9)',
                grid: { stroke: 'rgba(148, 163, 184, 0.2)' },
            },
            {
                scale: 'y',
                stroke: 'rgba(148, 163, 184, 0.9)',
                grid: { stroke: 'rgba(148, 163, 184, 0.15)' },
                values: (_self, ticks) => ticks.map((tick) => formatMinutesLabel(tick)),
            },
        ],
        cursor: {
            focus: { prox: 24 },
        },
        series: [
            {},
            ...series.map((entry) => ({
                label: entry.label,
                stroke: entry.color,
                width: 2,
                value: (_self, value, idx) => {
                    if (value == null || !Number.isFinite(value)) {
                        return `${entry.label}: —`;
                    }
                    const timeLabel = entry.timeLabels[idx];
                    return `${entry.label}: ${timeLabel ?? '—'}`;
                },
            })),
        ],
    };

    const key = `${order.join('|')}::${xValues[0]}::${xValues[xValues.length - 1]}`;

    return { data, options, key };
};

export type PrayerLineChartProps = {
    schedule: Schedule | null;
};

export function PrayerLineChart({ schedule }: PrayerLineChartProps) {
    const chartConfig = useMemo(() => buildChartConfig(schedule), [schedule]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<uPlot | null>(null);

    useEffect(() => {
        if (!chartConfig || !containerRef.current) {
            return;
        }

        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }

        const opts: uPlot.Options = { ...chartConfig.options, width: containerRef.current.clientWidth };
        const chart = new uPlot(opts, chartConfig.data, containerRef.current);
        chartRef.current = chart;

        const observer = new ResizeObserver((entries) => {
            const [entry] = entries;
            if (!entry || !chartRef.current) {
                return;
            }
            chartRef.current.setSize({ width: entry.contentRect.width, height: opts.height ?? 420 });
        });
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
            chart.destroy();
            chartRef.current = null;
        };
    }, [chartConfig?.key]);

    if (!chartConfig) {
        return (
            <div className="rounded-lg border border-border/60 bg-background/60 p-6 text-center text-muted-foreground shadow">
                No timings available for this selection.
            </div>
        );
    }

    return <div ref={containerRef} className="h-[420px] w-full" />;
}
