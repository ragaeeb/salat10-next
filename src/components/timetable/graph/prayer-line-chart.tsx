'use client';

import 'uplot/dist/uPlot.min.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import uPlot, { type AlignedData } from 'uplot';

import type { monthly, yearly } from '@/lib/calculator';
import { cn } from '@/lib/utils';

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

type ChartSelectorOption = { event: string; label: string };

type OptionsChangeHandler = (options: ChartSelectorOption[], defaultEvent: string | null) => void;

type ChartConfig = {
    data: AlignedData;
    options: uPlot.Options;
    activeSeries: ChartSeries;
    metrics: {
        selectedEvent: string;
        paddedMin: number;
        paddedMax: number;
        scaleFactor: number;
        rawRange: number;
        padding: number;
        yOffset: number;
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

    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
        return null;
    }

    const concreteMin = minVal as number;
    const concreteMax = maxVal as number;
    const rawSpan = Math.max(concreteMax - concreteMin, 0);
    const padding = Math.max(5, rawSpan * 0.15);

    let paddedMin = concreteMin - padding;
    let paddedMax = concreteMax + padding;

    if (paddedMin < 0) {
        paddedMin = 0;
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
            padding,
            yOffset,
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

    return {
        data,
        options,
        activeSeries,
        metrics: {
            selectedEvent: activeSeries.event,
            paddedMin,
            paddedMax,
            scaleFactor,
            rawRange,
            padding,
            yOffset,
        },
    };
};

export type PrayerLineChartProps = {
    schedule: Schedule | null;
    className?: string;
    selectedEvent?: string | null;
    onSelectedEventChange?: (event: string) => void;
    onOptionsChange?: OptionsChangeHandler;
};

export function PrayerLineChart({
    schedule,
    className,
    selectedEvent: selectedEventProp = null,
    onSelectedEventChange,
    onOptionsChange,
}: PrayerLineChartProps) {
    const prepared = useMemo(() => prepareChartData(schedule), [schedule]);
    const [internalSelectedEvent, setInternalSelectedEvent] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<uPlot | null>(null);
    const containerClassName = cn('relative h-full min-h-[320px] w-full', className);

    const isControlled = selectedEventProp !== null && selectedEventProp !== undefined;

    useEffect(() => {
        if (!prepared?.series.length) {
            onOptionsChange?.([], null);
            if (!isControlled && internalSelectedEvent !== null) {
                setInternalSelectedEvent(null);
            }
            return;
        }

        const options = prepared.series.map<ChartSelectorOption>((entry) => ({ event: entry.event, label: entry.label }));
        const defaultEvent = options[0]?.event ?? null;
        onOptionsChange?.(options, defaultEvent);

        const currentSelection = (isControlled ? selectedEventProp : internalSelectedEvent) ?? null;
        if (currentSelection && options.some((option) => option.event === currentSelection)) {
            return;
        }

        if (!isControlled) {
            setInternalSelectedEvent(defaultEvent);
        }
        if (defaultEvent && selectedEventProp !== defaultEvent) {
            onSelectedEventChange?.(defaultEvent);
        }
    }, [
        prepared,
        isControlled,
        internalSelectedEvent,
        selectedEventProp,
        onOptionsChange,
        onSelectedEventChange,
    ]);

    const activeEvent = useMemo(() => {
        if (!prepared?.series.length) {
            return null;
        }
        const resolved = (isControlled ? selectedEventProp : internalSelectedEvent) ?? null;
        if (resolved && prepared.series.some((entry) => entry.event === resolved)) {
            return resolved;
        }
        return prepared.series[0].event;
    }, [prepared, selectedEventProp, internalSelectedEvent, isControlled]);

    const chartConfig = useMemo(() => buildChartConfig(prepared, activeEvent), [prepared, activeEvent]);

    useEffect(() => {
        const container = containerRef.current;
        if (!chartConfig || !container) {
            return;
        }

        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }

        const tooltip = document.createElement('div');
        tooltip.className =
            'pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border/70 bg-background/95 px-2 py-1 text-xs font-medium text-foreground shadow';
        tooltip.style.display = 'none';
        container.appendChild(tooltip);

        const tooltipPlugin: uPlot.Plugin = {
            hooks: {
                setCursor: (chart) => {
                    const index = chart.cursor.idx;
                    if (index == null || index < 0) {
                        tooltip.style.display = 'none';
                        return;
                    }

                    const xSeries = chartConfig.data[0] as number[];
                    const ySeries = chartConfig.data[1] as (number | null)[];
                    const xValue = xSeries[index];
                    const yValue = ySeries[index];

                    if (!Number.isFinite(xValue) || yValue == null || !Number.isFinite(yValue)) {
                        tooltip.style.display = 'none';
                        return;
                    }

                    const plotLeft = chart.bbox.left + chart.valToPos(xValue, 'x', true);
                    const plotTop = chart.bbox.top + chart.valToPos(yValue, 'y', true);

                    const actualMinutes = yValue * chartConfig.metrics.scaleFactor + chartConfig.metrics.yOffset;
                    const timeLabel =
                        chartConfig.activeSeries.timeLabels[index] ?? formatMinutesLabel(actualMinutes);
                    const dateLabel = new Date(xValue * 1000).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    });

                    tooltip.textContent = `${dateLabel} • ${chartConfig.activeSeries.label}: ${timeLabel ?? '—'}`;
                    tooltip.style.display = 'block';
                    tooltip.style.transform = 'none';

                    const tooltipWidth = tooltip.offsetWidth;
                    const tooltipHeight = tooltip.offsetHeight;
                    const padding = 12;
                    const containerWidth = container.clientWidth;
                    const containerHeight = container.clientHeight || tooltipHeight;

                    const clampedLeft = Math.min(
                        Math.max(plotLeft - tooltipWidth / 2, padding),
                        containerWidth - tooltipWidth - padding,
                    );
                    const clampedTop = Math.min(
                        Math.max(plotTop - tooltipHeight - padding, padding),
                        containerHeight - tooltipHeight - padding,
                    );

                    tooltip.style.left = `${clampedLeft}px`;
                    tooltip.style.top = `${clampedTop}px`;
                },
            },
        };

        const width = container.clientWidth;
        const height = container.clientHeight || chartConfig.options.height || 480;
        const basePlugins = chartConfig.options.plugins ?? [];
        const opts: uPlot.Options = {
            ...chartConfig.options,
            width,
            height,
            plugins: [...basePlugins, tooltipPlugin],
        };
        const chart = new uPlot(opts, chartConfig.data, container);
        chartRef.current = chart;

        const handleMouseLeave = () => {
            tooltip.style.display = 'none';
        };
        chart.root.addEventListener('mouseleave', handleMouseLeave);

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
            observer.observe(container);
        }

        return () => {
            observer?.disconnect();
            chart.root.removeEventListener('mouseleave', handleMouseLeave);
            tooltip.remove();
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

    return <div ref={containerRef} className={containerClassName} />;
}
