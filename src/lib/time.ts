import type { DateRange } from 'react-day-picker';

/**
 * Formats a date as ISO date string (YYYY-MM-DD)
 */
export const formatDateParam = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parses initial date range from search params or returns defaults
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
 * Formats a date range for display
 */
export const formatDateRangeDisplay = (dateRange: DateRange | undefined): string => {
    if (!dateRange?.from) {
        return 'Pick a date range';
    }
    if (!dateRange.to) {
        return dateRange.from.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return `${dateRange.from.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - ${dateRange.to.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/**
 * Generates a schedule label from a date range
 */
export const generateScheduleLabel = (from: Date, to: Date): string => {
    const fromStr = from.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const toStr = to.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fromStr} - ${toStr}`;
};

/**
 * Updates URL with new date range parameters
 */
export const updateDateRangeParams = (searchParams: URLSearchParams, from: Date, to: Date): URLSearchParams => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', formatDateParam(from));
    params.set('to', formatDateParam(to));
    return params;
};
