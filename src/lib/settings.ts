'use client';

import { CalculationMethod, CalculationParameters } from 'adhan';
import type { MethodValue, Settings } from '@/types/settings';
import { CALCULATION_METHOD_OPTIONS, defaultSettings } from './constants';

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
    Turkey: CalculationMethod.Turkey,
    UmmAlQura: CalculationMethod.UmmAlQura,
} as const;

type MethodFactoryKey = keyof typeof methodFactories;

type MethodPreset = { fajrAngle: number; ishaAngle: number; ishaInterval: number };

const buildPreset = (method: MethodValue): MethodPreset => {
    if (method === 'Other') {
        return {
            fajrAngle: Number.parseFloat(defaultSettings.fajrAngle),
            ishaAngle: Number.parseFloat(defaultSettings.ishaAngle),
            ishaInterval: Number.parseFloat(defaultSettings.ishaInterval),
        };
    }

    const factory = methodFactories[method as MethodFactoryKey];
    if (!factory) {
        return {
            fajrAngle: Number.parseFloat(defaultSettings.fajrAngle),
            ishaAngle: Number.parseFloat(defaultSettings.ishaAngle),
            ishaInterval: Number.parseFloat(defaultSettings.ishaInterval),
        };
    }
    const params = factory();
    return { fajrAngle: params.fajrAngle, ishaAngle: params.ishaAngle, ishaInterval: params.ishaInterval ?? 0 };
};

const buildMethodPresets = () => {
    const presets = {} as Record<MethodValue, MethodPreset>;
    for (const option of CALCULATION_METHOD_OPTIONS) {
        presets[option.value] = buildPreset(option.value);
    }
    return presets;
};

export const methodPresets: Record<MethodValue, MethodPreset> = buildMethodPresets();

const METHOD_TOLERANCE = 0.01;

export const detectMethodFor = (preset: MethodPreset): MethodValue => {
    const candidates = Object.entries(methodPresets) as [MethodValue, MethodPreset][];
    for (const [method, values] of candidates) {
        const intervalMatches = Math.abs(values.ishaInterval - preset.ishaInterval) < METHOD_TOLERANCE;
        const fajrMatches = Math.abs(values.fajrAngle - preset.fajrAngle) < METHOD_TOLERANCE;
        const ishaMatches = Math.abs(values.ishaAngle - preset.ishaAngle) < METHOD_TOLERANCE;
        if (intervalMatches && fajrMatches && ishaMatches) {
            return method;
        }
    }
    return 'Other';
};

export const methodLabelMap = CALCULATION_METHOD_OPTIONS.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

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
}) => {
    return hydrateParameters({
        ...defaultSettings,
        fajrAngle: Number.isFinite(fajrAngle) ? fajrAngle.toString() : defaultSettings.fajrAngle,
        ishaAngle: Number.isFinite(ishaAngle) ? ishaAngle.toString() : defaultSettings.ishaAngle,
        ishaInterval: Number.isFinite(ishaInterval) ? ishaInterval.toString() : defaultSettings.ishaInterval,
        method,
    });
};
