export const formatCoordinate = (value: number, positiveLabel: string, negativeLabel: string) => {
    return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positiveLabel : negativeLabel}`;
};
