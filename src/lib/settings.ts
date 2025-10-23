'use client';

import { CalculationMethod, CalculationParameters } from 'adhan';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const STORAGE_KEY = 'salat10-next:settings';

const methodFactories = {
    Dubai: CalculationMethod.Dubai,
    Egyptian: CalculationMethod.Egyptian,
    Karachi: CalculationMethod.Karachi,
    Kuwait: CalculationMethod.Kuwait,
    MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
    MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
    NorthAmerica: CalculationMethod.NorthAmerica,
    Qatar: CalculationMethod.Qatar,
    Singapore: CalculationMethod.Singapore,
    Tehran: CalculationMethod.Tehran,
    Turkey: CalculationMethod.Turkey,
    UmmAlQura: CalculationMethod.UmmAlQura,
} as const;

type MethodFactoryKey = keyof typeof methodFactories;

export const methodOptions = [
    { label: 'Custom (Other)', value: 'Other' },
    { label: 'Muslim World League', value: 'MuslimWorldLeague' },
    { label: 'Egyptian General Authority', value: 'Egyptian' },
    { label: 'Karachi (University of Islamic Sciences)', value: 'Karachi' },
    { label: 'Umm al-Qura (Makkah)', value: 'UmmAlQura' },
    { label: 'Dubai', value: 'Dubai' },
    { label: 'Moonsighting Committee Worldwide', value: 'MoonsightingCommittee' },
    { label: 'North America (ISNA)', value: 'NorthAmerica' },
    { label: 'Kuwait', value: 'Kuwait' },
    { label: 'Qatar', value: 'Qatar' },
    { label: 'Singapore', value: 'Singapore' },
    { label: 'Tehran', value: 'Tehran' },
    { label: 'Turkey (Diyanet)', value: 'Turkey' },
] as const;

export type MethodValue = (typeof methodOptions)[number]['value'];

type MethodPreset = { fajrAngle: number; ishaAngle: number; ishaInterval: number };

const buildPreset = (method: MethodValue): MethodPreset => {
    if (method === 'Other') {
        return { fajrAngle: 0, ishaAngle: 0, ishaInterval: 0 };
    }

    const factory = methodFactories[method as MethodFactoryKey];
    if (!factory) {
        return { fajrAngle: 0, ishaAngle: 0, ishaInterval: 0 };
    }
    const params = factory();
    return { fajrAngle: params.fajrAngle, ishaAngle: params.ishaAngle, ishaInterval: params.ishaInterval ?? 0 };
};

const buildMethodPresets = () => {
    const presets = {} as Record<MethodValue, MethodPreset>;
    for (const option of methodOptions) {
        presets[option.value] = buildPreset(option.value);
    }
    return presets;
};

export const methodPresets: Record<MethodValue, MethodPreset> = buildMethodPresets();

const METHOD_TOLERANCE = 0.01;

export const detectMethodFor = (preset: MethodPreset): MethodValue => {
    const candidates = Object.entries(methodPresets) as [MethodValue, MethodPreset][];
    for (const [method, values] of candidates) {
        if (method === 'Other') {
            continue;
        }
        const intervalMatches = Math.abs(values.ishaInterval - preset.ishaInterval) < METHOD_TOLERANCE;
        const fajrMatches = Math.abs(values.fajrAngle - preset.fajrAngle) < METHOD_TOLERANCE;
        const ishaMatches = Math.abs(values.ishaAngle - preset.ishaAngle) < METHOD_TOLERANCE;
        if (intervalMatches && fajrMatches && ishaMatches) {
            return method;
        }
    }
    return 'Other';
};

export const methodLabelMap = methodOptions.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

export const getDefaultTimeZone = () => {
    if (typeof Intl !== 'undefined') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    }
    return 'UTC';
};

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

export const defaultSettings: Settings = {
    address: 'Ottawa, Canada',
    fajrAngle: '15',
    ishaAngle: '15',
    ishaInterval: '0',
    latitude: '45.3506',
    longitude: '-75.7930',
    method: 'NorthAmerica',
    timeZone: getDefaultTimeZone(),
};

const mergeSettings = (stored: Partial<Settings> | null): Settings => ({
    ...defaultSettings,
    ...stored,
    ishaInterval: stored?.ishaInterval ?? defaultSettings.ishaInterval,
});

export const hydrateParameters = (settings: Settings): CalculationParameters => {
    const preset = methodPresets[settings.method] ?? methodPresets.Other;
    const factory = settings.method === 'Other' ? null : methodFactories[settings.method as MethodFactoryKey];
    const params = factory ? factory() : new CalculationParameters('Other', 0, 0);
    const parsedFajr = Number.parseFloat(settings.fajrAngle);
    const parsedIsha = Number.parseFloat(settings.ishaAngle);
    const parsedInterval = Number.parseFloat(settings.ishaInterval);
    params.fajrAngle = Number.isFinite(parsedFajr) ? parsedFajr : preset.fajrAngle;
    params.ishaAngle = Number.isFinite(parsedIsha) ? parsedIsha : preset.ishaAngle;
    params.ishaInterval = Number.isFinite(parsedInterval) ? parsedInterval : preset.ishaInterval;
    if (params.ishaInterval > 0) {
        // Interval methods ignore the angle by definition.
        params.ishaAngle = preset.ishaAngle;
    }
    return params;
};

export const createParameters = ({
    method,
    fajrAngle,
    ishaAngle,
    ishaInterval,
}: {
    method: MethodValue;
    fajrAngle: number;
    ishaAngle: number;
    ishaInterval: number;
}) =>
    hydrateParameters({
        ...defaultSettings,
        fajrAngle: Number.isFinite(fajrAngle) ? fajrAngle.toString() : defaultSettings.fajrAngle,
        ishaAngle: Number.isFinite(ishaAngle) ? ishaAngle.toString() : defaultSettings.ishaAngle,
        ishaInterval: Number.isFinite(ishaInterval) ? ishaInterval.toString() : defaultSettings.ishaInterval,
        method,
    });

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<Settings>;
                setSettings(mergeSettings(parsed));
            } else {
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.warn('Failed to read stored settings', error);
            setSettings(defaultSettings);
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated || typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [hydrated, settings]);

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateSettings = useCallback((updater: Settings | ((prev: Settings) => Settings)) => {
        setSettings((prev) =>
            typeof updater === 'function' ? (updater as (prev: Settings) => Settings)(prev) : updater,
        );
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, []);

    const numeric = useMemo(
        () => ({
            fajrAngle: Number.parseFloat(settings.fajrAngle),
            ishaAngle: Number.parseFloat(settings.ishaAngle),
            ishaInterval: Number.parseFloat(settings.ishaInterval),
            latitude: Number.parseFloat(settings.latitude),
            longitude: Number.parseFloat(settings.longitude),
        }),
        [settings.fajrAngle, settings.ishaAngle, settings.ishaInterval, settings.latitude, settings.longitude],
    );

    return { hydrated, numeric, resetSettings, setSettings: updateSettings, settings, updateSetting };
};
