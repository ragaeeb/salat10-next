'use client';

import { ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { CalculationSettings } from '@/components/settings/calculation-settings';
import { LocationSettings } from '@/components/settings/location-settings';
import { Button } from '@/components/ui/button';
import { usePrayerStore } from '@/store/usePrayerStore';

const DEFAULT_TZ = 'UTC';

const getBrowserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? DEFAULT_TZ;
    } catch {
        return DEFAULT_TZ;
    }
};

export function SettingsClient() {
    const settings = usePrayerStore((state) => state.settings);
    const updateSettings = usePrayerStore((state) => state.updateSettings);
    const updateSetting = usePrayerStore((state) => state.updateSetting);
    const resetSettings = usePrayerStore((state) => state.resetSettings);

    const currentSettingsJson = useMemo(() => {
        const parse = (value: string) => {
            const numeric = Number.parseFloat(value);
            return Number.isFinite(numeric) ? numeric : value;
        };

        const display = {
            address: settings.address,
            fajrAngle: parse(settings.fajrAngle),
            ishaAngle: parse(settings.ishaAngle),
            ishaInterval: parse(settings.ishaInterval),
            latitude: parse(settings.latitude),
            longitude: parse(settings.longitude),
            method: settings.method,
            timeZone: settings.timeZone,
        };

        return JSON.stringify(display, null, 2);
    }, [settings]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-background px-4 py-6 md:px-6 md:py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary)/0.12,transparent_70%)]" />
            <div className="pointer-events-none absolute bottom-[-20%] left-[-15%] h-96 w-96 rounded-full bg-[rgba(11,95,131,0.25)] blur-3xl" />
            <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 md:gap-10">
                <header className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-lg backdrop-blur md:rounded-3xl md:p-8">
                    <div className="flex flex-col gap-4">
                        <Button asChild size="sm" className="self-start">
                            <Link className="inline-flex items-center gap-2" href="/">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Link>
                        </Button>
                        <div className="space-y-2">
                            <h1 className="font-bold text-foreground text-xl md:text-3xl">Location &amp; Settings</h1>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                Configure your coordinates and calculation method
                            </p>
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-lg backdrop-blur md:rounded-3xl md:p-8">
                    <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
                        <h2 className="font-semibold text-foreground text-lg md:text-xl">Your inputs</h2>
                        <div className="flex flex-col gap-2 md:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 text-xs md:w-auto"
                                onClick={() => updateSetting('timeZone', getBrowserTimezone())}
                            >
                                <Compass className="h-3.5 w-3.5" /> Browser timezone
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 text-xs md:w-auto"
                                onClick={() => resetSettings()}
                            >
                                Reset defaults
                            </Button>
                        </div>
                    </div>

                    <LocationSettings
                        settings={settings}
                        onSettingsChange={updateSettings}
                        onFieldChange={updateSetting}
                    />

                    <div className="my-8 border-border/40 border-t" />

                    <CalculationSettings settings={settings} onSettingsChange={updateSettings} />
                </section>

                <footer className="rounded-2xl border border-border/60 bg-card/80 p-4 text-muted-foreground text-xs shadow-inner md:rounded-3xl md:p-6">
                    Settings are stored in your browser&apos;s local storage. Clearing site data will reset them to the
                    defaults below:
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-secondary/60 p-3 font-mono text-foreground text-xs md:p-4 md:text-sm">
                        {currentSettingsJson}
                    </pre>
                </footer>
            </div>
        </div>
    );
}
