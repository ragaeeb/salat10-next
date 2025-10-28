'use client';

import { ArrowLeft, Compass, MapPin, Navigation } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TimezoneCombobox } from '@/components/timezone-combobox';
import { Button } from '@/components/ui/button';
import {
    detectMethodFor,
    type MethodValue,
    methodOptions,
    methodPresets,
    type Settings,
    useSettings,
} from '@/lib/settings';

type GeocodeStatus = 'idle' | 'loading' | 'success' | 'error';
type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

type GeocodeResult = { latitude: number; longitude: number; label?: string };

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

const fetchCoordinatesForAddress = async (address: string): Promise<GeocodeResult | null> => {
    const response = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(address)}&limit=1`);
    if (!response.ok) {
        throw new Error('Failed to fetch coordinates');
    }
    const candidates = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    if (!Array.isArray(candidates) || candidates.length === 0) {
        return null;
    }
    const [match] = candidates;
    if (!match) {
        return null;
    }
    const latitude = Number.parseFloat(match.lat);
    const longitude = Number.parseFloat(match.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Invalid coordinate response');
    }
    const result: GeocodeResult = { latitude, longitude };
    if (typeof match.display_name === 'string' && match.display_name.trim().length > 0) {
        result.label = match.display_name;
    }
    return result;
};

const DEFAULT_TZ = 'UTC';

const getBrowserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? DEFAULT_TZ;
    } catch {
        return DEFAULT_TZ;
    }
};

export default function SettingsPage() {
    const { settings, updateSetting, setSettings, resetSettings, hydrated } = useSettings();
    const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>('idle');
    const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
    const [locationMessage, setLocationMessage] = useState<string | null>(null);

    // Try to get browser location on mount if coordinates are not set
    useEffect(() => {
        if (!hydrated) {
            return;
        }

        const hasCoords =
            settings.latitude &&
            settings.longitude &&
            Number.isFinite(Number.parseFloat(settings.latitude)) &&
            Number.isFinite(Number.parseFloat(settings.longitude));

        if (!hasCoords && 'geolocation' in navigator) {
            setLocationStatus('loading');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSettings((prev) => ({
                        ...prev,
                        latitude: position.coords.latitude.toFixed(4),
                        longitude: position.coords.longitude.toFixed(4),
                        timeZone: getBrowserTimezone(),
                    }));
                    setLocationStatus('success');
                    setLocationMessage('Location detected from browser');
                },
                (error) => {
                    console.warn('Geolocation failed:', error);
                    setLocationStatus('error');
                    setLocationMessage('Location access denied. Please enter manually.');
                },
                { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
            );
        }
    }, [hydrated, setSettings, settings.latitude, settings.longitude]);

    const handleChange = useCallback(
        (key: keyof Settings) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            updateSetting(key, event.target.value);
        },
        [updateSetting],
    );

    const handleMethodSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextMethod = event.target.value as MethodValue;
        if (nextMethod === settings.method) {
            return;
        }
        const preset = methodPresets[nextMethod];
        setSettings((prev) => ({
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
            setSettings((prev) => buildAngleState(prev, field, nextValue));
        };

    const requestBrowserLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationStatus('error');
            setLocationMessage('Geolocation is not supported by your browser');
            return;
        }

        setLocationStatus('loading');
        setLocationMessage(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(4),
                    longitude: position.coords.longitude.toFixed(4),
                    timeZone: getBrowserTimezone(),
                }));
                setLocationStatus('success');
                setLocationMessage('Location updated from browser');
            },
            (error) => {
                console.warn('Geolocation error:', error);
                setLocationStatus('error');
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationMessage('Location access denied. Please enable location permissions.');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationMessage('Location information unavailable.');
                } else if (error.code === error.TIMEOUT) {
                    +setLocationMessage('Timed out while retrieving location. Please try again.');
                } else {
                    setLocationMessage('Unable to retrieve location. Please try again.');
                }
            },
            { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
        );
    };

    const lookupCoordinates = async () => {
        if (!settings.address.trim()) {
            setGeocodeStatus('error');
            setGeocodeMessage('Please enter an address or city first.');
            return;
        }
        setGeocodeStatus('loading');
        setGeocodeMessage(null);
        try {
            const result = await fetchCoordinatesForAddress(settings.address);
            if (!result) {
                setGeocodeStatus('error');
                setGeocodeMessage('We could not find that location. Try a more specific address.');
                return;
            }
            setSettings((prev) => ({
                ...prev,
                address: result.label ?? prev.address,
                latitude: result.latitude.toFixed(4),
                longitude: result.longitude.toFixed(4),
                timeZone: getBrowserTimezone(),
            }));
            setGeocodeStatus('success');
            setGeocodeMessage(`Found coordinates near ${result.label ?? settings.address}.`);
        } catch (error) {
            console.warn('Geocode lookup failed', error);
            setGeocodeStatus('error');
            setGeocodeMessage('Unable to look up that location right now. Please try again later.');
        }
    };

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

    if (!hydrated) {
        return null;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary)/0.12,transparent_70%)]" />
            <div className="pointer-events-none absolute bottom-[-20%] left-[-15%] h-96 w-96 rounded-full bg-[rgba(11,95,131,0.25)] blur-3xl" />
            <div className="relative z-10 flex w-full flex-col gap-10">
                <header className="rounded-3xl border border-border/60 bg-card/90 p-8 shadow-lg backdrop-blur">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <Button asChild>
                            <Link className="inline-flex items-center gap-2 self-start" href="/">
                                <ArrowLeft className="h-4 w-4" /> Back to prayer times
                            </Link>
                        </Button>
                        <div className="space-y-2">
                            <h1 className="font-bold text-3xl text-foreground">Location &amp; calculation settings</h1>
                            <p className="text-muted-foreground text-sm">
                                Set your coordinates and calculation method. Changes are saved in your browser.
                            </p>
                        </div>
                    </div>
                </header>

                <section className="rounded-3xl border border-border/60 bg-card/90 p-8 shadow-lg backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-semibold text-foreground text-xl">Your inputs</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => updateSetting('timeZone', getBrowserTimezone())}
                            >
                                <Compass className="h-4 w-4" /> Use browser timezone
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => resetSettings()}
                            >
                                Reset to defaults
                            </Button>
                        </div>
                    </div>

                    {locationMessage && (
                        <output
                            aria-live={locationStatus === 'error' ? 'assertive' : 'polite'}
                            className={`mt-4 rounded-lg border p-3 text-sm ${
                                locationStatus === 'error'
                                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                                    : 'border-primary/50 bg-primary/10 text-primary'
                            }`}
                        >
                            {locationMessage}
                        </output>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            Address or label
                            <input
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                onChange={handleChange('address')}
                                placeholder="City, country"
                                type="text"
                                value={settings.address}
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    disabled={geocodeStatus === 'loading'}
                                    onClick={lookupCoordinates}
                                >
                                    <MapPin className="h-3.5 w-3.5" />
                                    {geocodeStatus === 'loading' ? 'Looking up…' : 'Auto-fill coordinates'}
                                </Button>
                                {geocodeMessage && (
                                    <span
                                        className={`text-xs ${geocodeStatus === 'error' ? 'text-destructive' : 'text-primary'}`}
                                    >
                                        {geocodeMessage}
                                    </span>
                                )}
                            </div>
                        </label>
                        <div className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            <span id="timezone-label">Timezone</span>
                            <TimezoneCombobox
                                ariaLabelledBy="timezone-label"
                                value={settings.timeZone}
                                onChange={(zone) => updateSetting('timeZone', zone)}
                            />
                        </div>
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            Latitude (°)
                            <input
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                onChange={handleChange('latitude')}
                                placeholder="45.3506"
                                type="text"
                                value={settings.latitude}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            Longitude (°)
                            <input
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                onChange={handleChange('longitude')}
                                placeholder="-75.7930"
                                type="text"
                                value={settings.longitude}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={locationStatus === 'loading'}
                                onClick={requestBrowserLocation}
                            >
                                <Navigation className="h-3.5 w-3.5" />
                                {locationStatus === 'loading' ? 'Getting location…' : 'Use my current location'}
                            </Button>
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            Fajr angle (°)
                            <input
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                onChange={handleAngleChange('fajrAngle')}
                                step="0.1"
                                type="number"
                                value={settings.fajrAngle}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            ʿIshāʾ angle (°)
                            <input
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                onChange={handleAngleChange('ishaAngle')}
                                step="0.1"
                                type="number"
                                value={settings.ishaAngle}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                            ʿIshāʾ interval (minutes)
                            <input
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                        <label className="flex flex-col gap-2 font-medium text-foreground text-sm md:col-span-2">
                            Calculation method
                            <select
                                className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                onChange={handleMethodSelect}
                                value={settings.method}
                            >
                                {methodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <span className="text-muted-foreground text-xs">
                                Selecting a method loads its built-in angles from Adhan. You can still manually adjust
                                angles afterward.
                            </span>
                        </label>
                    </div>
                </section>

                <footer className="rounded-3xl border border-border/60 bg-card/80 p-6 text-muted-foreground text-xs shadow-inner">
                    Settings are stored in your browser&apos;s local storage. Clearing site data will reset them to the
                    defaults below:
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-secondary/60 p-4 font-mono text-foreground text-sm">
                        {currentSettingsJson}
                    </pre>
                </footer>
            </div>
        </div>
    );
}
