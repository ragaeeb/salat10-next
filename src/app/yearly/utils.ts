export const parseInteger = (value: string | null | undefined) => {
    if (!value) {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
};

type SearchParams = Record<string, string | string[] | undefined> | undefined;

const readFirst = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export const resolveInitialYear = (searchParams: SearchParams) => {
    const now = new Date();
    const defaultYear = now.getFullYear();
    const yearParam = readFirst(searchParams?.year);
    const parsedYear = parseInteger(yearParam);
    return parsedYear ?? defaultYear;
};
