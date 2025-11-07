import type { CALCULATION_METHOD_OPTIONS } from '@/lib/constants';

/**
 * Calculation method value type derived from available options
 */
export type MethodValue = (typeof CALCULATION_METHOD_OPTIONS)[number]['value'];

/**
 * Application settings for prayer time calculations and location
 */
export type Settings = {
    /** User-provided address or location label */
    address: string;

    /** Fajr angle in degrees (as string for form input) */
    fajrAngle: string;

    /** Isha angle in degrees (as string for form input) */
    ishaAngle: string;

    /** Isha interval in minutes (as string for form input) */
    ishaInterval: string;

    /** Latitude coordinate (as string for form input) */
    latitude: string;

    /** Longitude coordinate (as string for form input) */
    longitude: string;

    /** Selected calculation method */
    method: MethodValue;

    /** IANA timezone identifier */
    timeZone: string;

    /** City name for location (optional, from geocoding) */
    city?: string;

    /** State or region name (optional, from geocoding) */
    state?: string;

    /** Country name (optional, from geocoding) */
    country?: string;
};
