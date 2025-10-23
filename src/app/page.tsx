'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { daily } from '@/lib/calculator';
import { buildPrayerTimeExplanation } from '@/lib/explanation';
import { writeIslamicDate } from '@/lib/hijri';
import { methodLabelMap, useSettings } from '@/lib/settings';
import { CalculationParameters, Coordinates } from 'adhan';

const EXPLANATION_STEP_DURATION = 3200;

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

const formatCoordinate = (value: number, label: 'N' | 'S' | 'E' | 'W') => `${Math.abs(value).toFixed(4)}° ${label}`;

export default function PrayerTimesPage() {
    const { settings, hydrated, numeric } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        if (!showExplanation) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowExplanation(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExplanation]);

    const hasValidCoordinates = Number.isFinite(numeric.latitude) && Number.isFinite(numeric.longitude);

    const timeZone = settings.timeZone?.trim().length ? settings.timeZone.trim() : 'UTC';
    const fajrAngle = Number.isFinite(numeric.fajrAngle) ? numeric.fajrAngle : 0;
    const ishaAngle = Number.isFinite(numeric.ishaAngle) ? numeric.ishaAngle : 0;

    const coordinates = useMemo(
        () => new Coordinates(Number.isFinite(numeric.latitude) ? numeric.latitude : 0, Number.isFinite(numeric.longitude) ? numeric.longitude : 0),
        [numeric.latitude, numeric.longitude],
    );

    const parameters = useMemo(() => new CalculationParameters(settings.method, fajrAngle, ishaAngle), [fajrAngle, ishaAngle, settings.method]);

    const calculationArgs = useMemo(
        () => ({
            fajrAngle,
            ishaAngle,
            latitude: settings.latitude || '0',
            longitude: settings.longitude || '0',
            method: settings.method,
            timeZone,
        }),
        [fajrAngle, ishaAngle, settings.latitude, settings.longitude, settings.method, timeZone],
    );

    const navigateDate = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + delta);
        setCurrentDate(newDate);
    };

    const result = useMemo(() => daily(salatLabels, calculationArgs, currentDate), [calculationArgs, currentDate]);
    const hijri = useMemo(() => writeIslamicDate(0, currentDate), [currentDate]);

    const explanation = useMemo(() => {
        if (!hasValidCoordinates) {
            return null;
        }
        return buildPrayerTimeExplanation({
            address: settings.address,
            coordinates,
            date: currentDate,
            parameters,
            timeZone,
        });
    }, [coordinates, currentDate, hasValidCoordinates, parameters, settings.address, timeZone]);

    useEffect(() => {
        if (showExplanation && (!explanation || explanation.steps.length === 0)) {
            setShowExplanation(false);
        }
    }, [explanation, showExplanation]);

    if (!hydrated) {
        return null;
    }

    const methodLabel = methodLabelMap[settings.method] ?? settings.method;

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
            <span className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-emerald-950`}>{name}</span>
            <span className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-orange-600`}>{time}</span>
        </div>
    );

    const latitudeLabel = numeric.latitude >= 0 ? 'N' : 'S';
    const longitudeLabel = numeric.longitude >= 0 ? 'E' : 'W';

    return (
        <TooltipProvider>
            <div className="relative min-h-screen overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_60%)]" />
                <div className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />

                <div className="relative z-10 flex min-h-screen flex-col items-center px-6 py-10">
                    <div className="w-full max-w-6xl space-y-10">
                        <section className="rounded-3xl bg-white/85 backdrop-blur-md shadow-lg ring-1 ring-emerald-100/80">
                            <div className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-3">
                                    <h1 className="text-3xl font-bold text-emerald-950">Prayer Time Explorer</h1>
                                    <p className="text-base text-emerald-800">
                                        Discover how Adhan&apos;s astronomy turns your coordinates into the daily prayer schedule. Follow each calculation,
                                        learn the vocabulary, and celebrate every finished time.
                                    </p>
                                </div>
                                <Link
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
                                    href="/settings"
                                >
                                    Open settings
                                </Link>
                            </div>
                        </section>

                        <section className="rounded-3xl bg-white/85 backdrop-blur-md shadow-lg ring-1 ring-emerald-100/80 p-8 space-y-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <button
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                    onClick={() => navigateDate(-1)}
                                    type="button"
                                >
                                    <ChevronLeft size={18} /> Previous day
                                </button>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-help text-center text-sm font-medium text-emerald-900">
                                            {settings.address || 'Your location'} — {timeZone}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Latitude {formatCoordinate(numeric.latitude, latitudeLabel)}</p>
                                        <p>Longitude {formatCoordinate(numeric.longitude, longitudeLabel)}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-emerald-950">{result.date}</h3>
                                    <p className="text-sm text-emerald-700">
                                        {hijri.day}, {hijri.date} {hijri.month} {hijri.year} H
                                    </p>
                                </div>

                                <button
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500"
                                    onClick={() => navigateDate(1)}
                                    type="button"
                                >
                                    Next day <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {result.timings.map((t) => (
                                    <PrayerTimeRow isMainPrayer={t.isFard} key={t.event} name={t.label!} time={t.time} />
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                                <div className="text-sm text-emerald-700">
                                    Method: <span className="font-semibold text-emerald-900">{methodLabel}</span> · Fajr angle{' '}
                                    <span className="font-semibold text-emerald-900">{fajrAngle.toFixed(2)}°</span> · ʿIshāʾ angle{' '}
                                    <span className="font-semibold text-emerald-900">{ishaAngle.toFixed(2)}°</span>
                                </div>
                                <button
                                    className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-200"
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
                    loading={showExplanation && Boolean(explanation?.steps.length)}
                    steps={explanation?.steps ?? []}
                    summary={explanation?.summary ?? null}
                />

                {showExplanation && (
                    <button
                        className="fixed right-6 top-6 z-[120] rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
                        onClick={() => setShowExplanation(false)}
                        type="button"
                    >
                        Close explanation
                    </button>
                )}
            </div>
        </TooltipProvider>
    );
}
