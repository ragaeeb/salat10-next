import type uPlot from 'uplot';
import type { AlignedData } from 'uplot';
import type { ChartConfig, ChartSeries, PreparedChartData, Schedule, TimingEntry } from '@/types/graph';
import { getColorFor } from './colors';
import { IS_DEV, MINUTES_IN_DAY } from './constants';
import { formatMinutesLabel } from './formatting';

/**
 * Build canonical series order from schedule data
 * Ensures consistent ordering across different date ranges
 * Uses first day with timings as base, then adds any additional events
 *
 * @param schedule - Schedule with dates array
 * @returns Array of event names in display order
 */
export const buildSeriesOrder = (schedule: Schedule) => {
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

/**
 * Reduce array of values using a reducer function, skipping nulls
 * Used for calculating min/max from potentially sparse data
 *
 * @param values - Array of numbers or nulls
 * @param reducer - Reduction function (e.g., Math.min, Math.max)
 * @param initial - Initial accumulator value
 * @returns Reduced value, or initial if no valid values
 */
export const reduceValues = (
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

/**
 * Build uPlot configuration for prayer time chart
 * Creates axes, scales, series, and calculates appropriate padding
 *
 * @param prepared - Prepared chart data with series and values
 * @param selectedEvent - Currently selected event to display, or null for first
 * @returns Complete chart configuration, or null if insufficient data
 */
export const buildChartConfig = (
    prepared: PreparedChartData | null,
    selectedEvent: string | null,
): ChartConfig | null => {
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

    const rawRange = paddedMax - paddedMin;

    const yValues = activeSeries.values.map((value) => (value == null || Number.isNaN(value) ? Number.NaN : value));
    const data: AlignedData = [prepared.xValues, yValues];

    if (IS_DEV) {
        console.log('[PrayerLineChart] series', prepared.series);
        console.log('[PrayerLineChart] metrics', {
            paddedMax,
            paddedMin,
            padding,
            rawRange,
            selectedEvent: activeSeries.event,
        });
        console.log('[PrayerLineChart] data', data);
    }

    const axisColor = '#1e293b';
    const gridColor = 'rgba(30, 41, 59, 0.15)';
    const backgroundColor = '#ffffff';

    const options: uPlot.Options = {
        axes: [
            {
                font: `12px 'Inter', sans-serif`,
                grid: { stroke: gridColor },
                stroke: axisColor,
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
                font: `12px 'Inter', sans-serif`,
                grid: { stroke: gridColor },
                scale: 'y',
                stroke: axisColor,
                values: (_self, ticks) => ticks.map((tick) => formatMinutesLabel(tick as number)),
            },
        ],
        cursor: { focus: { prox: 24 } },
        height: 480,
        legend: { show: false },
        padding: [32, 24, 32, 80],
        scales: { x: { time: true }, y: { range: () => [paddedMin, paddedMax] } },
        series: [
            {},
            {
                label: activeSeries.label,
                points: { fill: backgroundColor, show: true, size: 5, stroke: activeSeries.color },
                stroke: activeSeries.color,
                value: (_self, value, idx) => {
                    if (value == null || !Number.isFinite(value)) {
                        return `${activeSeries.label}: —`;
                    }
                    const actualMinutes = value as number;
                    const timeLabel = activeSeries.timeLabels[idx] ?? formatMinutesLabel(actualMinutes);
                    return `${activeSeries.label}: ${timeLabel ?? '—'}`;
                },
                width: 2,
            },
        ],
        width: 800,
    };

    return {
        activeSeries,
        data,
        metrics: { paddedMax, paddedMin, padding, rawRange, selectedEvent: activeSeries.event },
        options,
    };
};

/**
 * Convert Date to minutes since midnight in local time
 * Avoids DST issues by using local time components directly
 *
 * @param value - Date object
 * @returns Minutes since midnight (0-1439.xxx)
 */
const minutesSinceMidnight = (value: Date) => {
    // Extract hours and minutes directly in local time to avoid DST issues
    const hours = value.getHours();
    const minutes = value.getMinutes();
    const seconds = value.getSeconds();
    const milliseconds = value.getMilliseconds();
    return hours * 60 + minutes + seconds / 60 + milliseconds / 60000;
};

/**
 * Find timing entry by event name
 *
 * @param timings - Array of timing entries
 * @param event - Event name to find
 * @returns Matching timing entry or undefined
 */
const findTiming = (timings: TimingEntry[], event: string) => timings.find((timing) => timing.event === event);

/**
 * Prepare chart data from schedule by normalizing times to minutes
 * Handles wraparound for night prayers by adding 1440 minutes (24 hours)
 *
 * @param schedule - Schedule with prayer times
 * @returns Prepared data ready for charting, or null if invalid
 */
export const prepareChartData = (schedule: Schedule | null): PreparedChartData | null => {
    if (!schedule || !schedule.dates.length) {
        return null;
    }

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
            values.push(minutes);
            timeLabels.push(timing.time);
        }
        return { color: getColorFor(event, index), event, label, timeLabels, values };
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

    return { baseFajrMin: Number.isFinite(baseFajrMin ?? NaN) ? (baseFajrMin as number) : null, series, xValues };
};

/**
 * Update chart cursor position and display tooltip
 * Handles tooltip positioning to stay within container bounds
 *
 * @param chart - uPlot chart instance
 * @param tooltip - Tooltip HTML element
 * @param chartConfig - Chart configuration with data
 * @param container - Container HTML element
 */
export const setChartCursor = (
    chart: uPlot,
    tooltip: HTMLDivElement,
    chartConfig: ChartConfig,
    container: HTMLDivElement,
) => {
    const index = chart.cursor.idx;
    if (index == null || index < 0) {
        tooltip.style.display = 'none';
        return;
    }

    const xSeries = chartConfig.data[0] as number[];
    const ySeries = chartConfig.data[1] as (number | null)[];
    const xValue = xSeries[index];
    const yValue = ySeries[index];

    if (typeof xValue !== 'number' || !Number.isFinite(xValue)) {
        tooltip.style.display = 'none';
        return;
    }

    if (typeof yValue !== 'number' || !Number.isFinite(yValue)) {
        tooltip.style.display = 'none';
        return;
    }

    const overlayRect = chart.over.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const plotX = chart.valToPos(xValue, 'x', true);
    const plotY = chart.valToPos(yValue, 'y', true);
    const plotLeft = overlayRect.left - containerRect.left + plotX;
    const plotTop = overlayRect.top - containerRect.top + plotY;

    const actualMinutes = yValue as number;
    const timeLabel = chartConfig.activeSeries.timeLabels[index] ?? formatMinutesLabel(actualMinutes);
    const dateLabel = new Date(xValue * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    tooltip.textContent = `${dateLabel} • ${chartConfig.activeSeries.label}: ${timeLabel ?? '—'}`;
    tooltip.style.display = 'block';
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const padding = 12;
    const containerWidth = container.clientWidth || containerRect.width;
    const containerHeight = container.clientHeight || containerRect.height || tooltipHeight;

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
};
