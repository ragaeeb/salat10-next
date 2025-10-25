'use client';

import { useMemo } from 'react';

import { useSettings, type MethodValue } from '@/lib/settings';

export type CalculationConfig = {
    fajrAngle: number;
    ishaAngle: number;
    ishaInterval: number;
    latitude: string;
    longitude: string;
    method: MethodValue;
    timeZone: string;
};

export const useCalculationConfig = () => {
    const { hydrated, numeric, settings } = useSettings();

    const timeZone = settings.timeZone?.trim() || 'UTC';

    const config = useMemo<CalculationConfig>(
        () => ({
            fajrAngle: Number.isFinite(numeric.fajrAngle) ? numeric.fajrAngle : 0,
            ishaAngle: Number.isFinite(numeric.ishaAngle) ? numeric.ishaAngle : 0,
            ishaInterval: Number.isFinite(numeric.ishaInterval) ? numeric.ishaInterval : 0,
            latitude: settings.latitude || '0',
            longitude: settings.longitude || '0',
            method: settings.method,
            timeZone,
        }),
        [
            numeric.fajrAngle,
            numeric.ishaAngle,
            numeric.ishaInterval,
            settings.latitude,
            settings.longitude,
            settings.method,
            timeZone,
        ],
    );

    return { config, hydrated, settings };
};
