'use client';

import { Coordinates } from 'adhan';
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, Settings2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { daily } from '@/lib/calculator';
import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import { writeIslamicDate } from '@/lib/hijri';
import { createParameters, methodLabelMap, useSettings } from '@/lib/settings';

const MultiStepLoader = dynamic(() => import('@/components/ui/multi-step-loader').then((mod) => mod.MultiStepLoader), {
    loading: () => null,
    ssr: false,
});

type ExplanationModule = typeof import('@/lib/explanation');

let explanationModulePromise: Promise<ExplanationModule> | null = null;

const preloadExplanationModule = () => {
    if (!explanationModulePromise) {
        explanationModulePromise = import('@/lib/explanation');
    }
    return explanationModulePromise;
};

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
        preloadExplanationModule().catch((error) => {
            console.warn('Unable to preload explanations', error);
        });
    }, []);

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
            const { buildPrayerTimeExplanation } = await preloadExplanationModule();
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

        void build();

        return () => {
            cancelled = true;
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
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const copyTimeoutRef = useRef<number | null>(null);

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

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

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
                className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-foreground`}
            >
                {name}
            </span>
            <span
                className={`font-semibold ${isMainPrayer ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'} text-primary`}
            >
                {time}
            </span>
        </div>
    );

    const latitudeLabel = numeric.latitude >= 0 ? 'N' : 'S';
    const longitudeLabel = numeric.longitude >= 0 ? 'E' : 'W';
    const isIntervalMethod = ishaInterval > 0;

    const handleCopyQuote = useCallback(async () => {
        if (!quote) {
            return;
        }

        if (copyTimeoutRef.current) {
            window.clearTimeout(copyTimeoutRef.current);
        }

        const payload = `“${quote.text}” - ${quote.citation}\n\nShared from Salat10 [https://salat10.vercel.app]`;

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(payload);
            } else if (typeof document !== 'undefined') {
                const textarea = document.createElement('textarea');
                textarea.value = payload;
                textarea.setAttribute('readonly', 'true');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopyStatus('copied');
            copyTimeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (error) {
            console.warn('Unable to copy quote', error);
            setCopyStatus('error');
            copyTimeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2500);
        }
    }, [quote]);

    const displayQuote =
        quote?.text ??
        (quoteError ? 'Anchor your heart to remembrance and intention.' : 'Gathering a reflection for today…');
    const displayCitation = quote?.citation ?? 'Salat10';
    const copyMessage = copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Copy unavailable' : null;
    const canCopyQuote = Boolean(quote);

    if (!hydrated) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="relative min-h-screen overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,136,179,0.18),transparent_65%)]" />
                <div className="pointer-events-none absolute top-[-18%] right-[-20%] h-96 w-96 rounded-full bg-[rgba(11,95,131,0.3)] blur-3xl" />

                {!showExplanation && (
                    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 sm:top-6 sm:right-6">
                        <ThemeToggle />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild className="shadow-lg backdrop-blur" size="icon">
                                    <Link aria-label="Open settings" href="/settings">
                                        <Settings2 className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open settings</TooltipContent>
                        </Tooltip>
                    </div>
                )}

                <div className="relative z-10 flex min-h-screen flex-col items-center px-4 pt-20 pb-16 sm:px-6 lg:px-10">
                    <div className="w-full space-y-10">
                        <section className="w-full rounded-3xl border border-primary/15 bg-card/95 p-8 shadow-xl backdrop-blur">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                <blockquote className="flex-1 text-balance text-foreground/90 text-lg">
                                    <p className="relative text-pretty pl-6 before:absolute before:top-1 before:left-0 before:font-serif before:text-5xl before:text-primary before:content-['“'] after:ml-1 after:text-4xl after:text-primary after:content-['”']">
                                        {displayQuote}
                                    </p>
                                    <footer className="mt-4 pl-6 text-muted-foreground text-sm">
                                        — {displayCitation}
                                    </footer>
                                </blockquote>
                                <div className="flex items-center gap-3 self-end sm:self-start">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                aria-label="Copy quote"
                                                disabled={!canCopyQuote}
                                                onClick={handleCopyQuote}
                                                size="icon"
                                                variant="ghost"
                                            >
                                                {copyStatus === 'copied' ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{canCopyQuote ? 'Copy quote' : 'Quote loading'}</TooltipContent>
                                    </Tooltip>
                                    <span aria-live="polite" className="h-4 min-w-[3rem] text-muted-foreground text-xs">
                                        {copyMessage}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="w-full space-y-8 rounded-3xl border border-primary/15 bg-card/95 p-8 shadow-xl backdrop-blur">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <Button onClick={() => navigateDate(-1)} type="button" variant="outline">
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous day
                                </Button>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-help text-center font-medium text-foreground/80 text-sm">
                                            {locationLabel} — {timeZone}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Latitude {formatCoordinate(numeric.latitude, latitudeLabel)}</p>
                                        <p>Longitude {formatCoordinate(numeric.longitude, longitudeLabel)}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <div className="text-center">
                                    <h3 className="font-semibold text-foreground text-lg">{result.date}</h3>
                                    <p className="text-muted-foreground text-sm">
                                        {hijri.day}, {hijri.date} {hijri.month} {hijri.year} H
                                    </p>
                                </div>

                                <Button onClick={() => navigateDate(1)} type="button" variant="outline">
                                    Next day <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
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
                                <div className="text-muted-foreground text-sm">
                                    Method: <span className="font-semibold text-foreground">{methodLabel}</span> · Fajr
                                    angle <span className="font-semibold text-foreground">{fajrAngle.toFixed(2)}°</span>{' '}
                                    · ʿIshāʾ{' '}
                                    <span className="font-semibold text-foreground">
                                        {isIntervalMethod
                                            ? `${ishaInterval.toFixed(0)} min after Maghrib`
                                            : `${ishaAngle.toFixed(2)}°`}
                                    </span>
                                </div>
                                <Button disabled={!hasValidCoordinates} onClick={openExplanation} type="button">
                                    Explain today&apos;s calculations
                                </Button>
                            </div>
                        </section>
                    </div>
                </div>

                <MultiStepLoader
                    onClose={closeExplanation}
                    open={showExplanation && !explanationLoading && Boolean(explanation?.steps.length)}
                    steps={explanation?.steps ?? []}
                    summary={explanation?.summary ?? null}
                />

                {showExplanation && explanationLoading && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-foreground/20 backdrop-blur">
                        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card/95 px-6 py-6 shadow-2xl ring-1 ring-primary/20">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="font-medium text-muted-foreground text-sm">Preparing the story…</p>
                        </div>
                    </div>
                )}

                {/* Close button now lives within the explanation overlay */}
            </div>
        </TooltipProvider>
    );
}
