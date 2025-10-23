'use client';

import { ArrowLeft, Compass, MapPin, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';

import { TimezoneCombobox } from '@/components/timezone-combobox';
import {
    detectMethodFor,
    getDefaultTimeZone,
    type MethodValue,
    methodOptions,
    methodPresets,
    type Settings,
    useSettings,
} from '@/lib/settings';

type GeocodeStatus = 'idle' | 'loading' | 'success' | 'error';

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

const resolveTimezoneFor = async (latitude: number, longitude: number, fallback: string): Promise<string> => {
    try {
        const tzResponse = await fetch(
            `https://api.open-meteo.com/v1/timezone?latitude=${latitude}&longitude=${longitude}`,
        );
        if (!tzResponse.ok) {
            return fallback;
        }
        const tzData = (await tzResponse.json()) as { timezone?: string };
        return tzData?.timezone ?? fallback;
    } catch (error) {
        console.warn('Timezone lookup fallback to current setting', error);
        return fallback;
    }
};

export default function SettingsPage() {
    const { settings, updateSetting, setSettings, resetSettings, hydrated } = useSettings();
    const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>('idle');
    const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);

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

    const applyAnglePreset = (value: number) => {
        setSettings((prev) => ({
            ...prev,
            fajrAngle: value.toString(),
            ishaAngle: value.toString(),
            ishaInterval: '0',
            method: detectMethodFor({ fajrAngle: value, ishaAngle: value, ishaInterval: 0 }),
        }));
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
            const timezone = await resolveTimezoneFor(result.latitude, result.longitude, settings.timeZone);
            setSettings((prev) => ({
                ...prev,
                address: result.label ?? prev.address,
                latitude: result.latitude.toFixed(4),
                longitude: result.longitude.toFixed(4),
                timeZone: timezone,
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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 px-6 py-10">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
                <header className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-emerald-100">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <h1 className="font-bold text-3xl text-emerald-950">Location &amp; calculation settings</h1>
                            <p className="text-emerald-700 text-sm">
                                Adjust your coordinates, angles, and preferred method. Changes are saved in your browser
                                so the explorer page updates instantly.
                            </p>
                        </div>
                        <Link
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 font-semibold text-emerald-800 text-sm shadow-sm transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                            href="/"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to prayer times
                        </Link>
                    </div>
                </header>

                <section className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-emerald-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-semibold text-emerald-900 text-xl">Your inputs</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onClick={() => updateSetting('timeZone', getDefaultTimeZone())}
                                type="button"
                            >
                                <Compass className="h-4 w-4" /> Use browser timezone
                            </button>
                            <button
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onClick={() => resetSettings()}
                                type="button"
                            >
                                <RefreshCcw className="h-4 w-4" /> Reset to defaults
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            Address or label
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('address')}
                                placeholder="City, country"
                                type="text"
                                value={settings.address}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={geocodeStatus === 'loading'}
                                    onClick={lookupCoordinates}
                                    type="button"
                                >
                                    <MapPin className="h-3.5 w-3.5" />{' '}
                                    {geocodeStatus === 'loading' ? 'Looking up…' : 'Auto-fill coordinates'}
                                </button>
                                {geocodeMessage && (
                                    <span
                                        className={`text-xs ${geocodeStatus === 'error' ? 'text-red-600' : 'text-emerald-600'}`}
                                    >
                                        {geocodeMessage}
                                    </span>
                                )}
                            </div>
                        </label>
                        <div className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            <span id="timezone-label">Timezone</span>
                            <TimezoneCombobox
                                ariaLabelledBy="timezone-label"
                                value={settings.timeZone}
                                onChange={(zone) => updateSetting('timeZone', zone)}
                            />
                        </div>
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            Latitude (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('latitude')}
                                placeholder="45.3506"
                                type="text"
                                value={settings.latitude}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            Longitude (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('longitude')}
                                placeholder="-75.7930"
                                type="text"
                                value={settings.longitude}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            Fajr angle (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleAngleChange('fajrAngle')}
                                step="0.1"
                                type="number"
                                value={settings.fajrAngle}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            ʿIshāʾ angle (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleAngleChange('ishaAngle')}
                                step="0.1"
                                type="number"
                                value={settings.ishaAngle}
                            />
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm">
                            ʿIshāʾ interval (minutes)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                min="0"
                                onChange={handleAngleChange('ishaInterval')}
                                step="1"
                                type="number"
                                value={settings.ishaInterval}
                            />
                            <span className="text-emerald-600 text-xs">
                                Set to zero to use the angle instead of a fixed waiting period.
                            </span>
                        </label>
                        <label className="flex flex-col gap-2 font-medium text-emerald-900 text-sm md:col-span-2">
                            Predefined method
                            <select
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleMethodSelect}
                                value={settings.method}
                            >
                                {methodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <span className="text-emerald-700 text-xs">
                                Selecting a method loads its built-in adjustments from Adhan. You can still tweak the
                                angles to explore how twilight choices shift the schedule.
                            </span>
                        </label>
                    </div>

                    <div className="mt-6 space-y-3">
                        <p className="font-semibold text-emerald-900 text-sm">Quick twilight presets</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(18)}
                                type="button"
                            >
                                Astronomical 18°
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(15)}
                                type="button"
                            >
                                Middle 15°
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(12)}
                                type="button"
                            >
                                Nautical 12°
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 font-semibold text-emerald-800 text-xs transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(6)}
                                type="button"
                            >
                                Civil 6°
                            </button>
                        </div>
                        <p className="text-emerald-700 text-xs">
                            Presets fill both Fajr and ʿIshāʾ angles. You can still type a custom value afterward.
                        </p>
                    </div>
                </section>

                <footer className="rounded-3xl bg-white/80 p-6 text-emerald-700 text-xs shadow-inner ring-1 ring-emerald-100">
                    Settings are stored in your browser&apos;s local storage. Clearing site data will reset them to the
                    defaults below:
                    <pre className="mt-2 rounded-xl bg-emerald-50 p-4 text-emerald-900">{currentSettingsJson}</pre>
                </footer>
            </div>
        </div>
    );
}
