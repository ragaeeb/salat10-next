'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import { daily } from '@/lib/calculator';
import { buildPrayerTimeExplanation } from '@/lib/explanation';
import { writeIslamicDate } from '@/lib/hijri';
import { CalculationParameters, Coordinates } from 'adhan';

type Settings = {
    address: string;
    fajrAngle: string;
    ishaAngle: string;
    latitude: string;
    longitude: string;
    method: string;
    timeZone: string;
};

const STORAGE_KEY = 'salat10-next:settings';
const EXPLANATION_STEP_DURATION = 3200;

const methodOptions = [
    { label: 'Other (custom angles)', value: 'Other' },
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
];

const salatLabels = {
    asr: 'ʿAṣr',
    dhuhr: 'Dhuhr',
    fajr: 'Fajr',
    isha: 'ʿIshāʾ',
    lastThirdOfTheNight: 'Last 1/3 Night Begins',
    maghrib: 'Maġrib',
    middleOfTheNight: '1/2 Night Begins',
    sunrise: 'Sunrise',
    tarawih: 'Tarawīḥ',
};

const getDefaultTimeZone = () => {
    if (typeof Intl !== 'undefined') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    }
    return 'UTC';
};

const defaultSettings: Settings = {
    address: 'Ottawa, Canada',
    fajrAngle: '15',
    ishaAngle: '15',
    latitude: '45.3506',
    longitude: '-75.7930',
    method: 'NorthAmerica',
    timeZone: getDefaultTimeZone(),
};

const parseNumber = (value: string, fallback: number) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export default function PrayerTimesPage() {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const explanationTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as Partial<Settings>;
                setSettings((prev) => ({ ...prev, ...parsed }));
            } catch (error) {
                console.warn('Failed to parse stored settings', error);
            }
        } else {
            setSettings((prev) => ({ ...prev, timeZone: prev.timeZone || getDefaultTimeZone() }));
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [mounted, settings]);

    useEffect(() => {
        if (!showExplanation) {
            if (explanationTimerRef.current) {
                window.clearTimeout(explanationTimerRef.current);
                explanationTimerRef.current = null;
            }
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowExplanation(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showExplanation]);

    const latitudeNumber = parseNumber(settings.latitude, Number.NaN);
    const longitudeNumber = parseNumber(settings.longitude, Number.NaN);
    const fajrAngleNumber = parseNumber(settings.fajrAngle, 0);
    const ishaAngleNumber = parseNumber(settings.ishaAngle, 0);
    const timeZone = settings.timeZone?.trim().length ? settings.timeZone : 'UTC';

    const coordinates = useMemo(
        () => new Coordinates(latitudeNumber || 0, longitudeNumber || 0),
        [latitudeNumber, longitudeNumber],
    );

    const parameters = useMemo(
        () => new CalculationParameters(settings.method as any, fajrAngleNumber, ishaAngleNumber),
        [fajrAngleNumber, ishaAngleNumber, settings.method],
    );

    const calculationArgs = useMemo(
        () => ({
            fajrAngle: fajrAngleNumber,
            ishaAngle: ishaAngleNumber,
            latitude: settings.latitude || '0',
            longitude: settings.longitude || '0',
            method: settings.method,
            timeZone,
        }),
        [fajrAngleNumber, ishaAngleNumber, settings.latitude, settings.longitude, settings.method, timeZone],
    );

    const handleSettingChange = <Key extends keyof Settings>(key: Key) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setSettings((prev) => ({ ...prev, [key]: event.target.value }));
        };

    const handleUseBrowserTimeZone = () => {
        setSettings((prev) => ({ ...prev, timeZone: getDefaultTimeZone() }));
    };

    const navigateDate = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + delta);
        setCurrentDate(newDate);
    };

    const result = useMemo(() => daily(salatLabels, calculationArgs, currentDate), [calculationArgs, currentDate]);
    const hijri = useMemo(() => writeIslamicDate(0, currentDate), [currentDate]);

    const explanationSteps = useMemo(() => {
        if (!Number.isFinite(latitudeNumber) || !Number.isFinite(longitudeNumber)) {
            return [];
        }
        return buildPrayerTimeExplanation({
            address: settings.address,
            coordinates,
            date: currentDate,
            parameters,
            timeZone,
        }).steps;
    }, [coordinates, currentDate, latitudeNumber, longitudeNumber, parameters, settings.address, timeZone]);

    const explanationStates = useMemo(
        () => explanationSteps.map((step) => ({ text: step.text })),
        [explanationSteps],
    );

    useEffect(() => {
        if (!showExplanation) {
            if (explanationTimerRef.current) {
                window.clearTimeout(explanationTimerRef.current);
                explanationTimerRef.current = null;
            }
            return;
        }

        if (!explanationStates.length) {
            setShowExplanation(false);
            return;
        }

        const total = explanationStates.length * EXPLANATION_STEP_DURATION + 1500;
        explanationTimerRef.current = window.setTimeout(() => {
            setShowExplanation(false);
        }, total);

        return () => {
            if (explanationTimerRef.current) {
                window.clearTimeout(explanationTimerRef.current);
                explanationTimerRef.current = null;
            }
        };
    }, [explanationStates.length, showExplanation]);

    const hasValidCoordinates = Number.isFinite(latitudeNumber) && Number.isFinite(longitudeNumber);

    if (!mounted) {
        return null;
    }

    const PrayerTimeRow = ({
        className = '',
        isMainPrayer = true,
        name,
        time,
    }: {
        className?: string;
        isMainPrayer?: boolean;
        name: string;
        time: string;
    }) => (
        <div className={`flex items-baseline justify-between ${className}`}>
            <span className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-green-900`}>
                {name}
            </span>
            <span className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-orange-600`}>
                {time}
            </span>
        </div>
    );

    return (
        <div className="min-h-screen relative">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                style={{ backgroundImage: "url('/splash.png')" }}
            />

            <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-10">
                <div className="w-full max-w-6xl space-y-10">
                    <section className="rounded-3xl bg-white/80 backdrop-blur-md shadow-lg p-8">
                        <h1 className="text-3xl font-bold text-green-900">Prayer Time Explorer</h1>
                        <p className="mt-3 text-base text-green-800">
                            Enter your location to learn how astronomical calculations from the Adhan library produce the daily
                            prayer schedule. Adjust the method or angles to see how the math responds.
                        </p>
                    </section>

                    <section className="rounded-3xl bg-white/80 backdrop-blur-md shadow-lg p-8 space-y-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h2 className="text-2xl font-semibold text-green-900">Location &amp; calculation settings</h2>
                            <button
                                className="px-4 py-2 text-sm font-semibold text-white bg-green-700 rounded-full hover:bg-green-600 transition"
                                onClick={handleUseBrowserTimeZone}
                                type="button"
                            >
                                Use browser timezone
                            </button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-2 text-green-900">
                                <span className="text-sm font-semibold">Address / description</span>
                                <input
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    onChange={handleSettingChange('address')}
                                    placeholder="City, country"
                                    type="text"
                                    value={settings.address}
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-green-900">
                                <span className="text-sm font-semibold">Timezone (IANA)</span>
                                <input
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    onChange={handleSettingChange('timeZone')}
                                    placeholder="e.g. America/Toronto"
                                    type="text"
                                    value={settings.timeZone}
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-green-900">
                                <span className="text-sm font-semibold">Latitude (°)</span>
                                <input
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    onChange={handleSettingChange('latitude')}
                                    placeholder="45.3506"
                                    type="text"
                                    value={settings.latitude}
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-green-900">
                                <span className="text-sm font-semibold">Longitude (°)</span>
                                <input
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    onChange={handleSettingChange('longitude')}
                                    placeholder="-75.7930"
                                    type="text"
                                    value={settings.longitude}
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-green-900">
                                <span className="text-sm font-semibold">Fajr angle (°)</span>
                                <input
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    min="0"
                                    onChange={handleSettingChange('fajrAngle')}
                                    step="0.1"
                                    type="number"
                                    value={settings.fajrAngle}
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-green-900">
                                <span className="text-sm font-semibold">Isha angle (°)</span>
                                <input
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    min="0"
                                    onChange={handleSettingChange('ishaAngle')}
                                    step="0.1"
                                    type="number"
                                    value={settings.ishaAngle}
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-green-900 md:col-span-2">
                                <span className="text-sm font-semibold">Predefined method</span>
                                <select
                                    className="rounded-xl border border-green-200 bg-white/60 px-4 py-3 text-green-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    onChange={handleSettingChange('method')}
                                    value={settings.method}
                                >
                                    {methodOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-xs text-green-700">
                                    Selecting a method loads its built-in adjustments from Adhan. You can still tweak the angles to explore the raw equations.
                                </span>
                            </label>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-white/80 backdrop-blur-md shadow-lg p-8 space-y-8">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-green-900">{settings.address || 'Your location'}</h2>
                                <p className="text-sm text-green-700">
                                    {settings.latitude || '—'}°, {settings.longitude || '—'}° — {timeZone}
                                </p>
                            </div>
                            <button
                                className="flex items-center gap-2 rounded-full border border-green-300 px-4 py-2 text-green-800 hover:border-orange-400 hover:text-orange-500 transition"
                                onClick={() => navigateDate(-1)}
                                type="button"
                            >
                                <ChevronLeft size={20} /> Previous day
                            </button>
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-green-900">{result.date}</h3>
                                <p className="text-sm text-green-700">
                                    {hijri.day}, {hijri.date} {hijri.month} {hijri.year} H
                                </p>
                            </div>
                            <button
                                className="flex items-center gap-2 rounded-full border border-green-300 px-4 py-2 text-green-800 hover:border-orange-400 hover:text-orange-500 transition"
                                onClick={() => navigateDate(1)}
                                type="button"
                            >
                                Next day <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {result.timings.map((t) => (
                                <PrayerTimeRow isMainPrayer={t.isFard} key={t.event} name={t.label!} time={t.time} />
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                            <div className="text-sm text-green-700">
                                Method: <span className="font-semibold text-green-900">{settings.method}</span> · Fajr angle{' '}
                                <span className="font-semibold text-green-900">{settings.fajrAngle}°</span> · Isha angle{' '}
                                <span className="font-semibold text-green-900">{settings.ishaAngle}°</span>
                            </div>
                            <button
                                className="px-6 py-3 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-400 transition disabled:cursor-not-allowed disabled:bg-orange-200"
                                disabled={!hasValidCoordinates}
                                onClick={() => setShowExplanation(true)}
                                type="button"
                            >
                                Explain today&apos;s calculations
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            <MultiStepLoader
                duration={EXPLANATION_STEP_DURATION}
                loading={showExplanation && explanationStates.length > 0}
                loadingStates={explanationStates}
                loop={false}
            />

            {showExplanation && (
                <button
                    className="fixed right-6 top-6 z-[120] rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-green-700"
                    onClick={() => setShowExplanation(false)}
                    type="button"
                >
                    Close explanation
                </button>
            )}
        </div>
    );
}
