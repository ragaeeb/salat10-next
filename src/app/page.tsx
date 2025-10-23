'use client';

import { Coordinates } from 'adhan';
import { ChevronLeft, ChevronRight, Loader2, Settings2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { daily } from '@/lib/calculator';
import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import { writeIslamicDate } from '@/lib/hijri';
import { createParameters, methodLabelMap, useSettings } from '@/lib/settings';

const MultiStepLoader = dynamic(() => import('@/components/ui/multi-step-loader').then((mod) => mod.MultiStepLoader), {
    loading: () => null,
    ssr: false,
});

const EXPLANATION_STEP_DURATION = 3200;

type Quote = { text: string; citation: string };

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

type ExplanationHookOptions = {
    address: string;
    coordinates: Coordinates;
    date: Date;
    hasValidCoordinates: boolean;
    key: string;
    parameters: ReturnType<typeof createParameters>;
    timeZone: string;
};

const useMotivationalQuote = () => {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadQuote = async () => {
            try {
                const response = await fetch('/api/quotes');
                if (!response.ok) {
                    throw new Error('Failed to fetch quote');
                }
                const data = (await response.json()) as Quote;
                if (!cancelled) {
                    setQuote(data);
                }
            } catch (err) {
                console.warn('Quote fetch failed', err);
                if (!cancelled) {
                    setError(true);
                }
            }
        };
        loadQuote();
        return () => {
            cancelled = true;
        };
    }, []);

    return { error, quote };
};

const usePrayerExplanation = ({
    address,
    coordinates,
    date,
    hasValidCoordinates,
    key,
    parameters,
    timeZone,
}: ExplanationHookOptions) => {
    const [showExplanation, setShowExplanation] = useState(false);
    const [explanation, setExplanation] = useState<PrayerTimeExplanation | null>(null);
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef(new Map<string, PrayerTimeExplanation>());

    useEffect(() => {
        if (!showExplanation) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowExplanation(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExplanation]);

    useEffect(() => {
        if (!showExplanation) {
            return;
        }
        if (!hasValidCoordinates) {
            setExplanation(null);
            setLoading(false);
            return;
        }

        const cached = cacheRef.current.get(key);
        if (cached) {
            setExplanation(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setExplanation(null);

        const build = async () => {
            const { buildPrayerTimeExplanation } = await import('@/lib/explanation');
            if (cancelled) {
                return;
            }
            const story = buildPrayerTimeExplanation({ address, coordinates, date, parameters, timeZone });
            cacheRef.current.set(key, story);
            if (!cancelled) {
                setExplanation(story);
                setLoading(false);
            }
        };

        let idleHandle: number | null = null;
        let timeoutHandle: number | null = null;
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
            idleHandle = window.requestIdleCallback(build);
        } else {
            timeoutHandle = window.setTimeout(build, 0);
        }

        return () => {
            cancelled = true;
            if (idleHandle !== null) {
                window.cancelIdleCallback?.(idleHandle);
            }
            if (timeoutHandle !== null) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, [address, coordinates, date, hasValidCoordinates, key, parameters, showExplanation, timeZone]);

    useEffect(() => {
        if (showExplanation && !loading && (!explanation || explanation.steps.length === 0)) {
            setShowExplanation(false);
        }
    }, [explanation, loading, showExplanation]);

    const openExplanation = useCallback(() => setShowExplanation(true), []);
    const closeExplanation = useCallback(() => setShowExplanation(false), []);

    return { closeExplanation, explanation, explanationLoading: loading, openExplanation, showExplanation };
};

export default function PrayerTimesPage() {
    const { settings, hydrated, numeric } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { quote, error: quoteError } = useMotivationalQuote();

    const hasValidCoordinates = Number.isFinite(numeric.latitude) && Number.isFinite(numeric.longitude);

    const timeZone = settings.timeZone?.trim().length ? settings.timeZone.trim() : 'UTC';
    const fajrAngle = Number.isFinite(numeric.fajrAngle) ? numeric.fajrAngle : 0;
    const ishaAngle = Number.isFinite(numeric.ishaAngle) ? numeric.ishaAngle : 0;
    const ishaInterval = Number.isFinite(numeric.ishaInterval) ? numeric.ishaInterval : 0;

    const coordinates = useMemo(
        () =>
            new Coordinates(
                Number.isFinite(numeric.latitude) ? numeric.latitude : 0,
                Number.isFinite(numeric.longitude) ? numeric.longitude : 0,
            ),
        [numeric.latitude, numeric.longitude],
    );

    const parameters = useMemo(
        () => createParameters({ fajrAngle, ishaAngle, ishaInterval, method: settings.method }),
        [fajrAngle, ishaAngle, ishaInterval, settings.method],
    );

    const calculationArgs = useMemo(
        () => ({
            fajrAngle,
            ishaAngle,
            ishaInterval,
            latitude: settings.latitude || '0',
            longitude: settings.longitude || '0',
            method: settings.method,
            timeZone,
        }),
        [fajrAngle, ishaAngle, ishaInterval, settings.latitude, settings.longitude, settings.method, timeZone],
    );

    const navigateDate = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + delta);
        setCurrentDate(newDate);
    };

    const result = useMemo(() => daily(salatLabels, calculationArgs, currentDate), [calculationArgs, currentDate]);
    const hijri = useMemo(() => writeIslamicDate(0, currentDate), [currentDate]);

    const explanationKey = useMemo(
        () =>
            JSON.stringify({
                date: currentDate.toISOString().slice(0, 10),
                fajrAngle,
                ishaAngle,
                ishaInterval,
                latitude: numeric.latitude,
                longitude: numeric.longitude,
                method: settings.method,
                timeZone,
            }),
        [
            currentDate,
            fajrAngle,
            ishaAngle,
            ishaInterval,
            numeric.latitude,
            numeric.longitude,
            settings.method,
            timeZone,
        ],
    );

    const { closeExplanation, explanation, explanationLoading, openExplanation, showExplanation } =
        usePrayerExplanation({
            address: settings.address,
            coordinates,
            date: currentDate,
            hasValidCoordinates,
            key: explanationKey,
            parameters,
            timeZone,
        });

    if (!hydrated) {
        return null;
    }

    const methodLabel = methodLabelMap[settings.method] ?? settings.method;
    const locationLabel = settings.address || 'Your location';

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
            <span
                className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-emerald-950`}
            >
                {name}
            </span>
            <span
                className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-orange-600`}
            >
                {time}
            </span>
        </div>
    );

    const latitudeLabel = numeric.latitude >= 0 ? 'N' : 'S';
    const longitudeLabel = numeric.longitude >= 0 ? 'E' : 'W';
    const isIntervalMethod = ishaInterval > 0;

    return (
        <TooltipProvider>
            <div className="relative min-h-screen overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_60%)]" />
                <div className="-top-32 pointer-events-none absolute right-[-10%] h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />

                <div className="relative z-10 flex min-h-screen flex-col items-center px-6 py-10">
                    <div className="w-full max-w-6xl space-y-10">
                        <section className="rounded-3xl bg-white/85 p-8 shadow-lg ring-1 ring-emerald-100/80 backdrop-blur-md">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-3">
                                    <h1 className="font-bold text-3xl text-emerald-950">Prayer Time Explorer</h1>
                                    <p className="text-base text-emerald-800">
                                        Discover how Adhan&apos;s astronomy turns your coordinates into the daily prayer
                                        schedule. Follow each calculation, learn the vocabulary, and celebrate every
                                        finished time.
                                    </p>
                                </div>
                                <Link
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 font-semibold text-emerald-800 text-sm shadow-sm transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    href="/settings"
                                >
                                    <Settings2 className="h-4 w-4" /> Open settings
                                </Link>
                            </div>
                            {quote && (
                                <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-emerald-900 text-sm shadow-inner">
                                    {quote.text} —{' '}
                                    <span className="font-semibold text-emerald-700">{quote.citation}</span>
                                </p>
                            )}
                            {quoteError && !quote && (
                                <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-emerald-700 text-sm shadow-inner">
                                    We&apos;ll share a motivating quote next time.
                                </p>
                            )}
                        </section>

                        <section className="space-y-8 rounded-3xl bg-white/85 p-8 shadow-lg ring-1 ring-emerald-100/80 backdrop-blur-md">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <button
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 font-semibold text-emerald-800 text-sm shadow-sm transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    onClick={() => navigateDate(-1)}
                                    type="button"
                                >
                                    <ChevronLeft size={18} /> Previous day
                                </button>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-help text-center font-medium text-emerald-900 text-sm">
                                            {locationLabel} — {timeZone}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Latitude {formatCoordinate(numeric.latitude, latitudeLabel)}</p>
                                        <p>Longitude {formatCoordinate(numeric.longitude, longitudeLabel)}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <div className="text-center">
                                    <h3 className="font-semibold text-emerald-950 text-lg">{result.date}</h3>
                                    <p className="text-emerald-700 text-sm">
                                        {hijri.day}, {hijri.date} {hijri.month} {hijri.year} H
                                    </p>
                                </div>

                                <button
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 font-semibold text-emerald-800 text-sm shadow-sm transition hover:border-orange-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    onClick={() => navigateDate(1)}
                                    type="button"
                                >
                                    Next day <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {result.timings.map((t) => (
                                    <PrayerTimeRow
                                        isMainPrayer={t.isFard}
                                        key={t.event}
                                        name={t.label!}
                                        time={t.time}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-emerald-700 text-sm">
                                    Method: <span className="font-semibold text-emerald-900">{methodLabel}</span> · Fajr
                                    angle{' '}
                                    <span className="font-semibold text-emerald-900">{fajrAngle.toFixed(2)}°</span> ·
                                    ʿIshāʾ{' '}
                                    <span className="font-semibold text-emerald-900">
                                        {isIntervalMethod
                                            ? `${ishaInterval.toFixed(0)} min after Maghrib`
                                            : `${ishaAngle.toFixed(2)}°`}
                                    </span>
                                </div>
                                <button
                                    className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-sm text-white shadow transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-200"
                                    disabled={!hasValidCoordinates}
                                    onClick={openExplanation}
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
                    loading={showExplanation && !explanationLoading && Boolean(explanation?.steps.length)}
                    steps={explanation?.steps ?? []}
                    summary={explanation?.summary ?? null}
                />

                {showExplanation && explanationLoading && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-emerald-950/20 backdrop-blur">
                        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/90 px-6 py-6 shadow-2xl ring-1 ring-emerald-200">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            <p className="font-medium text-emerald-800 text-sm">Preparing the story…</p>
                        </div>
                    </div>
                )}

                {showExplanation && (
                    <button
                        className="fixed top-6 right-6 z-[120] rounded-full bg-emerald-800 px-4 py-2 font-semibold text-sm text-white shadow-lg transition hover:bg-emerald-700"
                        onClick={closeExplanation}
                        type="button"
                    >
                        Close explanation
                    </button>
                )}
            </div>
        </TooltipProvider>
    );
}
