'use client';

import { IconSunMoon } from '@tabler/icons-react';
import { Settings2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QUOTE_WATERMARK, QuoteCard } from '@/components/prayer/quote-card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCopyFeedback } from '@/hooks/use-copy-feedback';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { daily } from '@/lib/calculator';
import { writeIslamicDate } from '@/lib/hijri';
import { salatLabels } from '@/lib/salat-labels';
import { methodLabelMap, useSettings } from '@/lib/settings';

const formatCoordinate = (value: number, positiveLabel: string, negativeLabel: string) =>
    `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positiveLabel : negativeLabel}`;

export default function PrayerTimesPage() {
    const { settings, hydrated, numeric } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { error: quoteError, loading: quoteLoading, quote } = useMotivationalQuote();
    const { copy, status: copyStatus } = useCopyFeedback();
    const router = useRouter();

    const timeZone = settings.timeZone?.trim() || 'UTC';
    const hasValidCoordinates = Number.isFinite(numeric.latitude) && Number.isFinite(numeric.longitude);

    // Redirect to settings if coordinates are not set
    useEffect(() => {
        if (hydrated && !hasValidCoordinates) {
            router.push('/settings');
        }
    }, [hydrated, hasValidCoordinates, router]);

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

    if (!hydrated || !hasValidCoordinates) {
        return null;
    }

    return (
        <div className="relative min-h-screen bg-background">
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 sm:top-6 sm:right-6">
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="sm"
                    variant="default"
                >
                    <Link href="/v2">
                        <IconSunMoon />
                    </Link>
                </Button>
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="icon"
                >
                    <Link aria-label="Open settings" href="/settings">
                        <Settings2Icon className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            <TooltipProvider>
                <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
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
                        hijriLabel={hijriLabel}
                        istijaba={result.istijaba}
                        locationDetail={locationDetail}
                        methodLabel={methodLabel}
                        onNextDay={handleNextDay}
                        onPrevDay={handlePrevDay}
                        onToday={handleToday}
                        timings={result.timings}
                    />
                </div>
            </TooltipProvider>
        </div>
    );
}
