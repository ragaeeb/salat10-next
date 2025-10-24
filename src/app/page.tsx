'use client';

import { Coordinates } from 'adhan';
import { Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QUOTE_WATERMARK, QuoteCard } from '@/components/prayer/quote-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCopyFeedback } from '@/hooks/use-copy-feedback';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { usePrayerParallax } from '@/hooks/use-prayer-parallax';
import { daily } from '@/lib/calculator';
import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import { writeIslamicDate } from '@/lib/hijri';
import { createParameters, methodLabelMap, useSettings } from '@/lib/settings';

const MultiStepLoader = dynamic(
    () => import('@/components/aceternity/multi-step-loader').then((mod) => mod.MultiStepLoader),
    { loading: () => null, ssr: false },
);

type ExplanationStatus = { data: PrayerTimeExplanation | null; loading: boolean; error: string | null };

let explanationModulePromise: Promise<typeof import('@/lib/explanation')> | null = null;

const loadExplanationModule = () => {
    if (!explanationModulePromise) {
        explanationModulePromise = import('@/lib/explanation');
    }
    return explanationModulePromise;
};

const buildExplanationKey = (options: {
    address?: string | null;
    date: Date;
    fajrAngle: number;
    ishaAngle: number;
    ishaInterval: number;
    latitude: number;
    longitude: number;
    method: string;
    timeZone: string;
}) =>
    [
        options.address ?? '',
        options.latitude,
        options.longitude,
        options.date.toISOString(),
        options.fajrAngle,
        options.ishaAngle,
        options.ishaInterval,
        options.method,
        options.timeZone,
    ].join('|');

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
} as const;

const formatCoordinate = (value: number, positiveLabel: string, negativeLabel: string) =>
    `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positiveLabel : negativeLabel}`;

export default function PrayerTimesPage() {
    const { settings, hydrated, numeric } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { error: quoteError, loading: quoteLoading, quote } = useMotivationalQuote();
    const { copy, status: copyStatus } = useCopyFeedback();
    const explanationCache = useRef<Map<string, PrayerTimeExplanation>>(new Map());
    const [explanationState, setExplanationState] = useState<ExplanationStatus>({
        data: null,
        error: null,
        loading: false,
    });
    const [showExplanation, setShowExplanation] = useState(false);

    // Prayer parallax hook
    const { sunX, sunY, skyColor, scrollYProgress, getPrayerLabel } = usePrayerParallax();
    const [currentPrayerLabel, setCurrentPrayerLabel] = useState('');

    useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setCurrentPrayerLabel(getPrayerLabel(latest));
        });
        return () => unsubscribe();
    }, [scrollYProgress, getPrayerLabel]);

    useEffect(() => {
        void loadExplanationModule().catch((error) => {
            console.warn('Unable to preload explanations', error);
        });
    }, []);

    const timeZone = settings.timeZone?.trim() || 'UTC';
    const hasValidCoordinates = Number.isFinite(numeric.latitude) && Number.isFinite(numeric.longitude);

    const calculationArgs = useMemo(
        () => ({
            fajrAngle: Number.isFinite(numeric.fajrAngle) ? numeric.fajrAngle : 0,
            ishaAngle: Number.isFinite(numeric.ishaAngle) ? numeric.ishaAngle : 0,
            ishaInterval: Number.isFinite(numeric.ishaInterval) ? numeric.ishaInterval : 0,
            latitude: settings.latitude || '0',
            longitude: settings.longitude || '0',
            method: settings.method,
            timeZone,
        }),
        [
            numeric.fajrAngle,
            numeric.ishaAngle,
            numeric.ishaInterval,
            settings.latitude,
            settings.longitude,
            settings.method,
            timeZone,
        ],
    );

    const explanationKey = useMemo(
        () =>
            buildExplanationKey({
                address: settings.address,
                date: currentDate,
                fajrAngle: calculationArgs.fajrAngle,
                ishaAngle: calculationArgs.ishaAngle,
                ishaInterval: calculationArgs.ishaInterval,
                latitude: numeric.latitude,
                longitude: numeric.longitude,
                method: settings.method,
                timeZone,
            }),
        [
            calculationArgs.fajrAngle,
            calculationArgs.ishaAngle,
            calculationArgs.ishaInterval,
            currentDate,
            numeric.latitude,
            numeric.longitude,
            settings.address,
            settings.method,
            timeZone,
        ],
    );

    useEffect(() => {
        if (showExplanation) {
            return;
        }
        const cached = explanationCache.current.get(explanationKey) ?? null;
        setExplanationState((prev) => {
            if (prev.data === cached && !prev.loading && prev.error === null) {
                return prev;
            }
            return { data: cached, error: null, loading: false };
        });
    }, [explanationKey, showExplanation]);

    const ensureExplanation = useCallback(async () => {
        if (!hasValidCoordinates) {
            return null;
        }

        const cached = explanationCache.current.get(explanationKey);
        if (cached) {
            setExplanationState({ data: cached, error: null, loading: false });
            return cached;
        }

        setExplanationState({ data: null, error: null, loading: true });

        try {
            const { buildPrayerTimeExplanation } = await loadExplanationModule();
            const parameters = createParameters({
                fajrAngle: calculationArgs.fajrAngle,
                ishaAngle: calculationArgs.ishaAngle,
                ishaInterval: calculationArgs.ishaInterval,
                method: settings.method,
            });
            const story = buildPrayerTimeExplanation({
                address: settings.address,
                coordinates: new Coordinates(numeric.latitude, numeric.longitude),
                date: currentDate,
                parameters,
                timeZone,
            });
            explanationCache.current.set(explanationKey, story);
            setExplanationState({ data: story, error: null, loading: false });
            return story;
        } catch (error) {
            console.error('Unable to build explanation', error);
            setExplanationState({ data: null, error: 'Unable to load explanation. Please try again.', loading: false });
            setShowExplanation(false);
            return null;
        }
    }, [
        calculationArgs.fajrAngle,
        calculationArgs.ishaAngle,
        calculationArgs.ishaInterval,
        currentDate,
        explanationKey,
        hasValidCoordinates,
        numeric.latitude,
        numeric.longitude,
        settings.address,
        settings.method,
        timeZone,
    ]);

    const handleExplain = useCallback(() => {
        if (!hasValidCoordinates) {
            return;
        }
        setShowExplanation(true);
        void ensureExplanation();
    }, [ensureExplanation, hasValidCoordinates]);

    const closeExplanation = useCallback(() => {
        setShowExplanation(false);
    }, []);

    const result = useMemo(() => daily(salatLabels, calculationArgs, currentDate), [calculationArgs, currentDate]);
    const hijri = useMemo(() => writeIslamicDate(0, currentDate), [currentDate]);

    const handlePrevDay = () => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 1);
            return next;
        });
    };

    const handleNextDay = () => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 1);
            return next;
        });
    };

    const handleToday = () => setCurrentDate(new Date());

    const addressLabel = settings.address?.trim() || 'Set your location';
    const locationDetail = hasValidCoordinates
        ? `${formatCoordinate(numeric.latitude, 'N', 'S')} · ${formatCoordinate(numeric.longitude, 'E', 'W')}`
        : 'Add valid latitude and longitude in settings';

    const methodLabel = methodLabelMap[settings.method] ?? settings.method;

    const hijriLabel = `${hijri.day}, ${hijri.date} ${hijri.month} ${hijri.year} AH`;

    const onCopyQuote = async () => {
        const sourceQuote = quote ?? { citation: 'Salat10', text: 'Remembrance keeps the heart alive.' };
        await copy(`"${sourceQuote.text}" - [${sourceQuote.citation}]${QUOTE_WATERMARK}`);
    };

    const explanationLoading = explanationState.loading;
    const explanationSteps = explanationState.data?.steps ?? [];
    const explanationSummary = explanationState.data?.summary ?? null;

    const explanationDisabled = !hasValidCoordinates || explanationLoading;

    if (!hydrated) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="relative min-h-[300vh]">
                {/* Parallax sky background */}
                <motion.div className="-z-10 pointer-events-none fixed inset-0" style={{ backgroundColor: skyColor }} />

                {/* Sun */}
                <motion.div
                    className="-z-10 pointer-events-none fixed h-20 w-20 rounded-full bg-yellow-400"
                    style={{
                        boxShadow: '0 0 60px 20px rgba(255, 215, 0, 0.4)',
                        left: sunX,
                        top: sunY,
                        x: '-50%',
                        y: '-50%',
                    }}
                />

                {/* Prayer time label */}
                <div className="-translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none fixed top-1/2 left-1/2">
                    <p className="whitespace-nowrap text-center font-bold text-6xl text-foreground/50">
                        {currentPrayerLabel}
                    </p>
                </div>

                {/* Original background gradient */}
                <div className="-z-20 fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(10,46,120,0.6),_transparent_65%)]" />

                {!showExplanation && (
                    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 sm:top-6 sm:right-6">
                        <ThemeToggle />
                        <Button
                            asChild
                            className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90 dark:border-white/70 dark:bg-white dark:text-[var(--primary-foreground)] dark:hover:bg-white/90"
                            size="icon"
                        >
                            <Link aria-label="Open settings" href="/settings">
                                <Settings2 className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                )}

                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
                    <QuoteCard
                        copyStatus={copyStatus}
                        error={quoteError}
                        loading={quoteLoading}
                        onCopy={onCopyQuote}
                        quote={quote}
                    />

                    <PrayerTimesCard
                        activeLabel={result.activeLabel ?? '—'}
                        activeEvent={result.activeEvent}
                        addressLabel={addressLabel}
                        dateLabel={result.date}
                        explanationDisabled={explanationDisabled}
                        explanationLoading={explanationLoading}
                        hijriLabel={hijriLabel}
                        istijaba={result.istijaba}
                        locationDetail={locationDetail}
                        methodLabel={methodLabel}
                        onExplain={handleExplain}
                        onNextDay={handleNextDay}
                        onPrevDay={handlePrevDay}
                        onToday={handleToday}
                        timings={result.timings}
                    />
                </div>

                <MultiStepLoader
                    loading={explanationLoading}
                    open={showExplanation}
                    onClose={closeExplanation}
                    steps={explanationSteps}
                    summary={explanationSummary}
                />
            </div>
        </TooltipProvider>
    );
}
