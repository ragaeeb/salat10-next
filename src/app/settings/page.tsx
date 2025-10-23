'use client';

import Link from 'next/link';
import React from 'react';

import { defaultSettings, getDefaultTimeZone, methodOptions, useSettings } from '@/lib/settings';

export default function SettingsPage() {
    const { settings, updateSetting, resetSettings, hydrated } = useSettings();

    if (!hydrated) {
        return null;
    }

    const handleChange = (key: keyof typeof settings) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        updateSetting(key, event.target.value);
    };

    const applyAnglePreset = (value: number) => {
        updateSetting('fajrAngle', value.toString());
        updateSetting('ishaAngle', value.toString());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 px-6 py-10">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
                <header className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-emerald-100">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-emerald-950">Location &amp; calculation settings</h1>
                            <p className="text-sm text-emerald-700">
                                Adjust your coordinates, angles, and preferred method. Changes are saved in your browser so the explorer page updates instantly.
                            </p>
                        </div>
                        <Link
                            className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                            href="/"
                        >
                            ← Back to prayer times
                        </Link>
                    </div>
                </header>

                <section className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-emerald-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-emerald-900">Your inputs</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => updateSetting('timeZone', getDefaultTimeZone())}
                                type="button"
                            >
                                Use browser timezone
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => resetSettings()}
                                type="button"
                            >
                                Reset to defaults
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
                            Address or label
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('address')}
                                placeholder="City, country"
                                type="text"
                                value={settings.address}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
                            Timezone (IANA)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('timeZone')}
                                placeholder="e.g. America/Toronto"
                                type="text"
                                value={settings.timeZone}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
                            Latitude (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('latitude')}
                                placeholder="45.3506"
                                type="text"
                                value={settings.latitude}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
                            Longitude (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('longitude')}
                                placeholder="-75.7930"
                                type="text"
                                value={settings.longitude}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
                            Fajr angle (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('fajrAngle')}
                                step="0.1"
                                type="number"
                                value={settings.fajrAngle}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900">
                            ʿIshāʾ angle (°)
                            <input
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('ishaAngle')}
                                step="0.1"
                                type="number"
                                value={settings.ishaAngle}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-emerald-900 md:col-span-2">
                            Predefined method
                            <select
                                className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-emerald-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                onChange={handleChange('method')}
                                value={settings.method}
                            >
                                {methodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <span className="text-xs text-emerald-700">
                                Selecting a method loads its built-in adjustments from Adhan. You can still tweak the angles to explore how twilight choices shift the schedule.
                            </span>
                        </label>
                    </div>

                    <div className="mt-6 space-y-3">
                        <p className="text-sm font-semibold text-emerald-900">Quick twilight presets</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(18)}
                                type="button"
                            >
                                Astronomical 18°
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(15)}
                                type="button"
                            >
                                Middle 15°
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(12)}
                                type="button"
                            >
                                Nautical 12°
                            </button>
                            <button
                                className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                onClick={() => applyAnglePreset(6)}
                                type="button"
                            >
                                Civil 6°
                            </button>
                        </div>
                        <p className="text-xs text-emerald-700">
                            Presets fill both Fajr and ʿIshāʾ angles. You can still type a custom value afterward.
                        </p>
                    </div>
                </section>

                <footer className="rounded-3xl bg-white/80 p-6 text-xs text-emerald-700 shadow-inner ring-1 ring-emerald-100">
                    Settings are stored in your browser&apos;s local storage. Clearing site data will reset them to the defaults below:
                    <pre className="mt-2 rounded-xl bg-emerald-50 p-4 text-emerald-900">{JSON.stringify(defaultSettings, null, 2)}</pre>
                </footer>
            </div>
        </div>
    );
}
