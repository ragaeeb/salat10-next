'use client';

import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useId, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { PrayerTimetableTable } from '@/components/timetable/prayer-timetable-table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/constants';
import { useCalculationConfig } from '@/lib/prayer-utils';
import { formatDateRangeDisplay, generateScheduleLabel, updateDateRangeParams } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useSettings } from '@/store/usePrayerStore';

export type DateFormatOption = { value: string; label: string; format: Intl.DateTimeFormatOptions };

const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
    { format: { day: 'numeric', month: 'short', weekday: 'short' }, label: 'Short (Mon, Jan 1)', value: 'short' },
    {
        format: { day: 'numeric', month: 'short', weekday: 'short', year: 'numeric' },
        label: 'Short with Year (Mon, Jan 1, 2025)',
        value: 'short-year',
    },
    { format: { day: 'numeric', month: 'long', weekday: 'long' }, label: 'Long (Monday, January 1)', value: 'long' },
    {
        format: { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' },
        label: 'Long with Year (Monday, January 1, 2025)',
        value: 'long-year',
    },
    { format: { day: 'numeric', month: 'numeric', year: 'numeric' }, label: 'Numeric (1/1/2025)', value: 'numeric' },
    { format: { day: '2-digit', month: '2-digit', year: 'numeric' }, label: 'ISO (2025-01-01)', value: 'iso' },
];

export type TimetableClientProps = { initialFrom: Date; initialTo: Date };

export function TimetableClient({ initialFrom, initialTo }: TimetableClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const config = useCalculationConfig();
    const settings = useSettings();
    const dateFormatId = useId();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: initialFrom, to: initialTo });
    const [dateFormat, setDateFormat] = useState<string>(() => searchParams.get('dateFormat') ?? 'short');

    const schedule = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return null;
        }

        const times = [];
        const current = new Date(dateRange.from);
        const end = new Date(dateRange.to);

        while (current <= end) {
            const result = daily(salatLabels, config, current);
            times.push(result);
            current.setDate(current.getDate() + 1);
        }

        return { dates: times, label: generateScheduleLabel(dateRange.from, dateRange.to) };
    }, [config, dateRange]);

    const handleDateRangeChange = useCallback(
        (newRange: DateRange | undefined) => {
            if (!newRange?.from || !newRange?.to) {
                return;
            }

            setDateRange(newRange);

            const params = updateDateRangeParams(searchParams, newRange.from, newRange.to);
            router.replace(`/timetable?${params.toString()}`, { scroll: false });
        },
        [router, searchParams],
    );

    const handleDateFormatChange = useCallback(
        (format: string) => {
            setDateFormat(format);
            const params = new URLSearchParams(searchParams.toString());
            params.set('dateFormat', format);
            router.replace(`/timetable?${params.toString()}`, { scroll: false });
        },
        [router, searchParams],
    );

    const dateRangeDisplay = formatDateRangeDisplay(dateRange);

    const selectedFormatOption = DATE_FORMAT_OPTIONS.find((opt) => opt.value === dateFormat) ?? DATE_FORMAT_OPTIONS[0];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
                <Button asChild size="sm" variant="outline">
                    <Link href="/">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Home
                    </Link>
                </Button>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'min-w-[240px] justify-start text-left font-normal',
                                    !dateRange && 'text-muted-foreground',
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRangeDisplay}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                                autoFocus
                                mode="range"
                                defaultMonth={dateRange?.from ?? new Date()}
                                selected={dateRange}
                                onSelect={handleDateRangeChange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={dateFormatId}>
                        Date format
                    </label>
                    <select
                        id={dateFormatId}
                        value={dateFormat}
                        onChange={(e) => handleDateFormatChange(e.target.value)}
                        className="inline-flex h-9 min-w-[10rem] items-center rounded-md border border-input bg-background px-3 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        {DATE_FORMAT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <PrayerTimetableTable
                schedule={schedule}
                timeZone={settings.timeZone}
                dateFormat={selectedFormatOption!.format}
            />
        </div>
    );
}
