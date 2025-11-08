'use client';

import { CalculationMethod, CalculationParameters } from 'adhan';
import type { MethodValue, Settings } from '@/types/settings';
import { CALCULATION_METHOD_OPTIONS, defaultSettings } from './constants';

/**
 * Factory functions for built-in calculation methods from Adhan library
 * Maps method names to their factory functions
 */
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

/** Type helper for method factory keys */
type MethodFactoryKey = keyof typeof methodFactories;

/**
 * Prayer calculation method preset with angles
 */
type MethodPreset = {
    /** Fajr angle below horizon in degrees */
    fajrAngle: number;
    /** Isha angle below horizon in degrees */
    ishaAngle: number;
    /** Fixed interval after Maghrib for Isha (minutes), 0 for angle-based */
    ishaInterval: number;
};

/**
 * Build a method preset from method name
 * Extracts angles from Adhan library factory or uses defaults
 *
 * @param method - Method name
 * @returns Preset with angles and interval
 */
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

/**
 * Build complete method presets map for all calculation methods
 * Pre-computes all presets for fast lookup
 *
 * @returns Record mapping method names to their presets
 */
const buildMethodPresets = () => {
    const presets = {} as Record<MethodValue, MethodPreset>;
    for (const option of CALCULATION_METHOD_OPTIONS) {
        presets[option.value] = buildPreset(option.value);
    }
    return presets;
};

/**
 * Pre-computed method presets for all calculation methods
 * Contains Fajr/Isha angles and intervals for each method
 */
export const methodPresets: Record<MethodValue, MethodPreset> = buildMethodPresets();

/** Tolerance for floating point comparison when detecting methods */
const METHOD_TOLERANCE = 0.01;

/**
 * Detect which calculation method matches the given angles
 * Compares angles within tolerance to account for floating point precision
 * Returns 'Other' if no exact match found
 *
 * @param preset - Preset with angles to match
 * @returns Matching method name, or 'Other'
 */
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

/**
 * Map of method values to human-readable labels
 * Used for UI display
 */
export const methodLabelMap = CALCULATION_METHOD_OPTIONS.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

/**
 * Create CalculationParameters from settings
 * Hydrates Adhan library parameters with custom or preset values
 * Handles fallback to defaults for invalid values
 *
 * @param settings - Application settings
 * @returns Adhan CalculationParameters ready for prayer time calculation
 */
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

/**
 * Create CalculationParameters from discrete angle values
 * Convenience function for testing and direct parameter creation
 *
 * @param config - Configuration object with method and angles
 * @returns Adhan CalculationParameters
 */
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
