import { useEffect, useRef, useState } from 'react';
import type uPlot from 'uplot';
import { buildChartConfig, prepareChartData, setChartCursor } from '@/lib/chart';
import { IS_DEV } from '@/lib/constants';

import type { ChartSelectorOption, OptionsChangeHandler, Schedule } from '@/types/graph';

type UPlotConstructor = new (...args: any[]) => uPlot;

/**
 * Hook to render and manage interactive prayer time charts using uPlot
 *
 * Creates high-performance line charts showing prayer time trends over the year.
 * Handles chart initialization, resizing, tooltips, and event selection.
 * Supports both controlled and uncontrolled modes for event selection.
 *
 * @param {Schedule | null} schedule - Year schedule with prayer times for each day
 * @param {string | null} selectedEvent - Currently selected prayer event (controlled mode), or null for uncontrolled
 * @param {OptionsChangeHandler} [onOptionsChange] - Callback when available events change
 * @param {(event: string) => void} [onSelectedEventChange] - Callback when selected event changes
 * @returns Chart state and refs
 * @property {React.RefObject<HTMLDivElement>} containerRef - Ref to attach to chart container div
 * @property {string | null} activeEvent - Currently active/selected prayer event
 * @property {object | null} chartConfig - Current chart configuration and data
 * @property {object | null} prepared - Prepared chart data from schedule
 *
 * @example
 * ```tsx
 * const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
 * const { containerRef, activeEvent } = usePrayerChart(
 *   schedule,
 *   selectedEvent,
 *   (options, defaultEvent) => console.log('Available:', options),
 *   setSelectedEvent
 * );
 *
 * return <div ref={containerRef} className="w-full h-96" />;
 * ```
 */
export const usePrayerChart = (
    schedule: Schedule | null,
    selectedEvent: string | null,
    onOptionsChange?: OptionsChangeHandler,
    onSelectedEventChange?: (event: string) => void,
) => {
    const prepared = prepareChartData(schedule);
    const [internalSelectedEvent, setInternalSelectedEvent] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<uPlot | null>(null);
    const uplotCtorRef = useRef<UPlotConstructor | null>(null);

    const isControlled = selectedEvent != null;

    useEffect(() => {
        if (!prepared?.series.length) {
            onOptionsChange?.([], null);
            if (!isControlled && internalSelectedEvent !== null) {
                setInternalSelectedEvent(null);
            }
            return;
        }

        const options = prepared.series.map<ChartSelectorOption>((entry) => ({
            event: entry.event,
            label: entry.label,
        }));
        const defaultEvent = options[0]?.event ?? null;
        onOptionsChange?.(options, defaultEvent);

        const currentSelection = (isControlled ? selectedEvent : internalSelectedEvent) ?? null;
        if (currentSelection && options.some((option) => option.event === currentSelection)) {
            return;
        }

        if (!isControlled) {
            setInternalSelectedEvent(defaultEvent);
        }
        if (!isControlled && defaultEvent && selectedEvent !== defaultEvent) {
            onSelectedEventChange?.(defaultEvent);
        }
    }, [prepared, isControlled, internalSelectedEvent, selectedEvent, onOptionsChange, onSelectedEventChange]);

    const activeEvent = (() => {
        if (!prepared?.series.length) {
            return null;
        }
        const resolved = (isControlled ? selectedEvent : internalSelectedEvent) ?? null;
        if (resolved && prepared.series.some((entry) => entry.event === resolved)) {
            return resolved;
        }
        return prepared.series[0]?.event ?? null;
    })();

    const chartConfig = buildChartConfig(prepared, activeEvent);

    useEffect(() => {
        // In SSR / non-DOM test environments we can't render a chart.
        if (typeof document === 'undefined') {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            return;
        }

        if (!chartConfig) {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
            container.replaceChildren();
            return;
        }

        let disposed = false;
        let tooltip: HTMLDivElement | null = null;
        let observer: ResizeObserver | null = null;
        let handleMouseLeave: (() => void) | null = null;

        const destroyCurrent = () => {
            observer?.disconnect();
            observer = null;

            if (chartRef.current) {
                if (handleMouseLeave) {
                    try {
                        chartRef.current.root.removeEventListener('mouseleave', handleMouseLeave);
                    } catch {
                        // ignore
                    }
                }
                chartRef.current.destroy();
                chartRef.current = null;
            }

            tooltip?.remove();
            tooltip = null;

            try {
                container.replaceChildren();
            } catch {
                // ignore
            }
        };

        destroyCurrent();

        const renderChart = async () => {
            if (!uplotCtorRef.current) {
                const mod = await import('uplot');
                // uPlot is published as CJS; depending on bundler/runtime, dynamic import
                // can return either the constructor directly or a namespace with `.default`.
                const resolved = (mod as any).default ?? mod;
                uplotCtorRef.current = resolved as UPlotConstructor;
            }

            if (disposed) {
                return;
            }

            const UPlotCtor = uplotCtorRef.current;
            if (!UPlotCtor) {
                return;
            }

            tooltip = document.createElement('div');
            tooltip.className =
                'pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-900 shadow-lg';
            tooltip.style.display = 'none';
            container.appendChild(tooltip);

            const tooltipPlugin: uPlot.Plugin = {
                hooks: {
                    setCursor: (chart) => {
                        if (!tooltip) {
                            return;
                        }
                        setChartCursor(chart, tooltip, chartConfig, container);
                    },
                },
            };

            const rect = container.getBoundingClientRect();
            const width =
                Math.max(Math.floor(rect.width || container.clientWidth), 0) || chartConfig.options.width || 800;
            const height =
                Math.max(Math.floor(rect.height || container.clientHeight), 0) || chartConfig.options.height || 480;
            const basePlugins = chartConfig.options.plugins ?? [];
            const opts: uPlot.Options = {
                ...chartConfig.options,
                height,
                plugins: [...basePlugins, tooltipPlugin],
                width,
            };
            const chart = new UPlotCtor(opts, chartConfig.data, container);
            chartRef.current = chart;

            handleMouseLeave = () => {
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            };
            chart.root.addEventListener('mouseleave', handleMouseLeave);

            if (typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver((entries) => {
                    const [entry] = entries;
                    if (!entry || !chartRef.current) {
                        return;
                    }
                    const nextWidth = entry.contentRect.width;
                    const nextHeight = entry.contentRect.height || opts.height || height;
                    chartRef.current.setSize({ height: nextHeight, width: nextWidth });
                });
                observer.observe(container);
            }
        };

        void renderChart();

        return () => {
            disposed = true;
            destroyCurrent();
        };
    }, [chartConfig]);

    useEffect(() => {
        if (!chartConfig) {
            return;
        }
        if (IS_DEV) {
            console.log('[PrayerLineChart] activeMetrics', chartConfig.metrics);
        }
    }, [chartConfig]);

    return { activeEvent, chartConfig, containerRef, prepared };
};
