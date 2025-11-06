import type uPlot from 'uplot';
import type { AlignedData } from 'uplot';
import type { monthly, yearly } from '@/lib/calculator';

export type Schedule = ReturnType<typeof monthly> | ReturnType<typeof yearly>;

export type TimingEntry = Schedule['dates'][number]['timings'][number];

export type ChartSeries = {
    event: string;
    label: string;
    values: (number | null)[];
    timeLabels: (string | null)[];
    color: string;
};

export type PreparedChartData = { xValues: number[]; series: ChartSeries[]; baseFajrMin: number | null };

export type ChartSelectorOption = { event: string; label: string };

export type OptionsChangeHandler = (options: ChartSelectorOption[], defaultEvent: string | null) => void;

export type ChartConfig = {
    data: AlignedData;
    options: uPlot.Options;
    activeSeries: ChartSeries;
    metrics: { selectedEvent: string; paddedMin: number; paddedMax: number; rawRange: number; padding: number };
};
