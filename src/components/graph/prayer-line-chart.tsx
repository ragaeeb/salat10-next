import 'uplot/dist/uPlot.min.css';

import { usePrayerChart } from '@/hooks/use-prayer-chart';
import { cn } from '@/lib/utils';
import type { OptionsChangeHandler, Schedule } from '@/types/graph';

type PrayerLineChartProps = {
    schedule: Schedule | null;
    className?: string;
    selectedEvent?: string | null;
    onSelectedEventChange?: (event: string) => void;
    onOptionsChange?: OptionsChangeHandler;
};

export function PrayerLineChart({
    schedule,
    className,
    selectedEvent = null,
    onSelectedEventChange,
    onOptionsChange,
}: PrayerLineChartProps) {
    const { prepared, containerRef, activeEvent, chartConfig } = usePrayerChart(
        schedule,
        selectedEvent,
        onOptionsChange,
        onSelectedEventChange,
    );

    if (!prepared || !prepared.series.length || !activeEvent || !chartConfig) {
        return (
            <div className="rounded-lg border border-border/60 bg-background/60 p-6 text-center text-muted-foreground shadow">
                No timings available for this selection.
            </div>
        );
    }

    return <div ref={containerRef} className={cn('relative h-full w-full rounded-lg bg-white', className)} />;
}
