'use client';

import { Settings2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QUOTE_WATERMARK, QuoteCard } from '@/components/prayer/quote-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCopyFeedback } from '@/hooks/use-copy-feedback';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { usePrayerExplanation } from '@/hooks/use-prayer-explanation';
import { daily } from '@/lib/calculator';
import { writeIslamicDate } from '@/lib/hijri';
import { methodLabelMap, useSettings } from '@/lib/settings';

const MultiStepLoader = dynamic(() => import('@/components/ui/multi-step-loader').then((mod) => mod.MultiStepLoader), {
    loading: () => null,
    ssr: false,
});

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

    const result = useMemo(() => daily(salatLabels, calculationArgs, currentDate), [calculationArgs, currentDate]);
    const hijri = useMemo(() => writeIslamicDate(0, currentDate), [currentDate]);

    const {
        closeExplanation,
        explanation,
        loading: explanationLoading,
        openExplanation,
        showExplanation,
    } = usePrayerExplanation({
        address: settings.address,
        coordinates: { latitude: numeric.latitude, longitude: numeric.longitude },
        date: currentDate,
        fajrAngle: calculationArgs.fajrAngle,
        hasValidCoordinates,
        ishaAngle: calculationArgs.ishaAngle,
        ishaInterval: calculationArgs.ishaInterval,
        method: settings.method,
        timeZone,
    });

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
        await copy(`“${sourceQuote.text}” - [${sourceQuote.citation}]${QUOTE_WATERMARK}`);
    };

    const explanationSteps = explanation?.steps ?? [];
    const explanationSummary = explanation?.summary ?? null;

    const explanationDisabled = !hasValidCoordinates || explanationLoading;

    if (!hydrated) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(10,46,120,0.6),_transparent_65%)]">
                {!showExplanation && (
                    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 sm:top-6 sm:right-6">
                        <ThemeToggle />
                        <Button
                            asChild
                            className="rounded-full border border-white/40 bg-white/20 text-foreground shadow-lg backdrop-blur transition hover:bg-white/40"
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
                        activeEvent={result.activeEvent}
                        addressLabel={addressLabel}
                        dateLabel={result.date}
                        explanationDisabled={explanationDisabled}
                        explanationLoading={explanationLoading}
                        hijriLabel={hijriLabel}
                        istijaba={result.istijaba}
                        locationDetail={locationDetail}
                        methodLabel={methodLabel}
                        onExplain={openExplanation}
                        onNextDay={handleNextDay}
                        onPrevDay={handlePrevDay}
                        onToday={handleToday}
                        timings={result.timings}
                    />
                </div>

                <MultiStepLoader
                    open={showExplanation}
                    onClose={closeExplanation}
                    steps={explanationSteps}
                    summary={explanationSummary}
                />
            </div>
        </TooltipProvider>
    );
}
