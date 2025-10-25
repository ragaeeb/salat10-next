export const clampMonth = (month: number | null) => {
    if (month == null || !Number.isFinite(month)) {
        return null;
    }
    if (month < 1 || month > 12) {
        return null;
    }
    return month;
};

export const parseInteger = (value: string | null | undefined) => {
    if (!value) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
};

type SearchParams = Record<string, string | string[] | undefined> | undefined;

const readFirst = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export const resolveInitialMonthYear = (searchParams: SearchParams) => {
    const now = new Date();
    const defaultMonth = now.getMonth() + 1;
    const defaultYear = now.getFullYear();

    const monthParam = readFirst(searchParams?.month);
    const yearParam = readFirst(searchParams?.year);

    const parsedMonth = clampMonth(parseInteger(monthParam));
    const parsedYear = parseInteger(yearParam);

    return { month: parsedMonth ?? defaultMonth, year: parsedYear ?? defaultYear };
};
