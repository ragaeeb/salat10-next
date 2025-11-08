import type { DateRange } from 'react-day-picker';

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * Used for URL parameters
 *
 * @param date - Date to format
 * @returns ISO date string
 */
export const formatDateParam = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parse initial date range from search params or return defaults
 * Defaults to current month (first day to last day)
 *
 * @param searchParams - URL search parameters object
 * @returns Object with from and to dates
 */
export const parseInitialDateRange = (
    searchParams: Record<string, string | string[] | undefined> | undefined,
): { from: Date; to: Date } => {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fromParam = searchParams?.from;
    const toParam = searchParams?.to;

    const fromStr = Array.isArray(fromParam) ? fromParam[0] : fromParam;
    const toStr = Array.isArray(toParam) ? toParam[0] : toParam;

    const from = fromStr ? new Date(fromStr) : defaultFrom;
    const to = toStr ? new Date(toStr) : defaultTo;

    return { from, to };
};

/**
 * Format a date range for human-readable display
 *
 * @param dateRange - React Day Picker date range
 * @returns Formatted string or placeholder text
 */
export const formatDateRangeDisplay = (dateRange: DateRange | undefined): string => {
    if (!dateRange?.from) {
        return 'Pick a date range';
    }
    if (!dateRange.to) {
        return dateRange.from.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return `${dateRange.from.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })} - ${dateRange.to.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/**
 * Generate a schedule label from a date range
 * Used for displaying range in timetable header
 *
 * @param from - Start date
 * @param to - End date
 * @returns Formatted range string like "Jan 1, 2024 - Jan 31, 2024"
 */
export const generateScheduleLabel = (from: Date, to: Date): string => {
    const fromStr = from.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const toStr = to.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fromStr} - ${toStr}`;
};

/**
 * Update URL search params with new date range
 * Returns new URLSearchParams object for router navigation
 *
 * @param searchParams - Current search params
 * @param from - New start date
 * @param to - New end date
 * @returns Updated URLSearchParams with date range
 */
export const updateDateRangeParams = (searchParams: URLSearchParams, from: Date, to: Date): URLSearchParams => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', formatDateParam(from));
    params.set('to', formatDateParam(to));
    return params;
};
