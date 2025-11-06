export type Quote = {
    author: string;
    body: string;
    title: string;
    part_number?: number;
    part_page?: number;
    url?: string;
    hijri_dates?: number[];
    hijri_months?: number[];
    days?: number[];
    after?: { events: string[] };
    before?: { diff?: string; events: string[] };
};
