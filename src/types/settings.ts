import type { CALCULATION_METHOD_OPTIONS } from '@/lib/constants';

export type MethodValue = (typeof CALCULATION_METHOD_OPTIONS)[number]['value'];

export type Settings = {
    address: string;
    fajrAngle: string;
    ishaAngle: string;
    ishaInterval: string;
    latitude: string;
    longitude: string;
    method: MethodValue;
    timeZone: string;
};
