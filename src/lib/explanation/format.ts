const getTimeFormatter = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true, minute: '2-digit', timeZone });

const getDateFormatter = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', timeZone, weekday: 'long', year: 'numeric' });

export const formatTimeInZone = (date: Date, timeZone: string) => {
    try {
        return getTimeFormatter(timeZone).format(date);
    } catch (error) {
        console.warn('Failed to format time', error);
        return date.toLocaleTimeString();
    }
};

export const formatDateInZone = (date: Date, timeZone: string) => {
    try {
        return getDateFormatter(timeZone).format(date);
    } catch (error) {
        console.warn('Failed to format date', error);
        return date.toDateString();
    }
};

export const formatNumber = (value: number, fractionDigits = 2) =>
    Number.isFinite(value) ? value.toFixed(fractionDigits) : '—';

export const formatAngle = (value: number, fractionDigits = 2) => `${formatNumber(value, fractionDigits)}°`;

export const formatMinutes = (minutes: number, fractionDigits = 1) =>
    `${formatNumber(minutes, fractionDigits)} minutes`;

export const describeNightFraction = (portion: number) => `${formatNumber(portion * 100, 2)}% of the night`;
