'use client';

import { useMemo } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { monthly, yearly } from '@/lib/calculator';

type Schedule = ReturnType<typeof monthly> | ReturnType<typeof yearly>;

type TimingEntry = Schedule['dates'][number]['timings'][number];

type PrayerTimetableTableProps = {
    schedule: Schedule | null;
    timeZone: string;
};

type Column = {
    event: TimingEntry['event'];
    label: string;
};

const formatDateLabel = (timings: TimingEntry[], timeZone: string) => {
    if (!timings.length) {
        return '';
    }
    const base = timings[0]?.value ?? new Date();
    return base.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone,
    });
};

const buildColumns = (schedule: Schedule | null) => {
    if (!schedule?.dates.length) {
        return [] as Column[];
    }
    const firstDay = schedule.dates.find((day) => day.timings.length);
    if (!firstDay) {
        return [] as Column[];
    }
    return firstDay.timings.map<Column>((timing) => ({ event: timing.event, label: timing.label }));
};

const findTiming = (timings: TimingEntry[], event: string) => timings.find((timing) => timing.event === event);

export function PrayerTimetableTable({ schedule, timeZone }: PrayerTimetableTableProps) {
    const columns = useMemo(() => buildColumns(schedule), [schedule]);

    if (!schedule) {
        return null;
    }

    return (
        <div className="rounded-lg border border-border/60 bg-background/60 shadow">
            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead className="min-w-[140px]">Date</TableHead>
                        {columns.map((column) => (
                            <TableHead key={column.event}>{column.label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {schedule.dates.map((day) => {
                        const dateLabel = formatDateLabel(day.timings, timeZone);
                        const isoKey = day.timings[0]?.value.toISOString() ?? dateLabel;
                        return (
                            <TableRow key={isoKey}>
                                <TableCell className="font-medium text-foreground">{dateLabel}</TableCell>
                                {columns.map((column) => {
                                    const timing = findTiming(day.timings, column.event);
                                    return <TableCell key={column.event}>{timing?.time ?? '—'}</TableCell>;
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
