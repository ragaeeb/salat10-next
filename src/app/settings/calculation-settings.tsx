import type React from 'react';

import { CALCULATION_METHOD_OPTIONS } from '@/lib/constants';
import { detectMethodFor, methodPresets } from '@/lib/settings';
import type { MethodValue, Settings } from '@/types/settings';

type CalculationSettingsProps = {
    settings: Settings;
    onSettingsChange: (updater: (prev: Settings) => Settings) => void;
};

const buildAngleState = (
    prev: Settings,
    field: 'fajrAngle' | 'ishaAngle' | 'ishaInterval',
    value: string,
): Settings => {
    const next = { ...prev, [field]: value };
    if (field !== 'ishaInterval' && Number.parseFloat(next.ishaInterval) > 0) {
        next.ishaInterval = '0';
    }
    const method = detectMethodFor({
        fajrAngle: Number.parseFloat(next.fajrAngle),
        ishaAngle: Number.parseFloat(next.ishaAngle),
        ishaInterval: Number.parseFloat(next.ishaInterval),
    });
    return { ...next, method };
};

export function CalculationSettings({ settings, onSettingsChange }: CalculationSettingsProps) {
    const handleMethodSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextMethod = event.target.value as MethodValue;
        if (nextMethod === settings.method) {
            return;
        }
        const preset = methodPresets[nextMethod];
        onSettingsChange((prev) => ({
            ...prev,
            fajrAngle: preset ? preset.fajrAngle.toString() : prev.fajrAngle,
            ishaAngle: preset ? preset.ishaAngle.toString() : prev.ishaAngle,
            ishaInterval: preset ? preset.ishaInterval.toString() : prev.ishaInterval,
            method: nextMethod,
        }));
    };

    const handleAngleChange =
        (field: 'fajrAngle' | 'ishaAngle' | 'ishaInterval') => (event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value;
            onSettingsChange((prev) => buildAngleState(prev, field, nextValue));
        };

    return (
        <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                    Fajr angle (°)
                    <input
                        className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onChange={handleAngleChange('fajrAngle')}
                        step="0.1"
                        type="number"
                        value={settings.fajrAngle}
                    />
                </label>
                <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                    ʿIshāʾ angle (°)
                    <input
                        className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onChange={handleAngleChange('ishaAngle')}
                        step="0.1"
                        type="number"
                        value={settings.ishaAngle}
                    />
                </label>
            </div>

            <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                ʿIshāʾ interval (minutes)
                <input
                    className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    min="0"
                    onChange={handleAngleChange('ishaInterval')}
                    step="1"
                    type="number"
                    value={settings.ishaInterval}
                />
                <span className="text-muted-foreground text-xs">
                    Set to zero to use the angle instead of a fixed waiting period.
                </span>
            </label>

            <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                Calculation method
                <select
                    className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onChange={handleMethodSelect}
                    value={settings.method}
                >
                    {CALCULATION_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <span className="text-muted-foreground text-xs">
                    Selecting a method loads its built-in angles from Adhan. You can still manually adjust angles
                    afterward.
                </span>
            </label>
        </div>
    );
}
