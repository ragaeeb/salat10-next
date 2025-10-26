'use client';

import { Settings2Icon } from 'lucide-react';
import { motion, useMotionTemplate } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ShinyText } from '@/components/magicui/shiny-text';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QUOTE_WATERMARK, QuoteCard } from '@/components/prayer/quote-card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCopyFeedback } from '@/hooks/use-copy-feedback';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { usePrayerParallax } from '@/hooks/use-prayer-parallax';
import { usePrayerVisuals } from '@/hooks/use-prayer-visuals';
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

    const { scrollYProgress, skyColor } = usePrayerParallax();

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

    const { currentPrayerInfo, sunX, sunY, sunOpacity, moonOpacity, sunColorR, sunColorG, sunColorB, useRealTime } =
        usePrayerVisuals({ currentDate, scrollYProgress, timings: result.timings });

    const sunBackgroundColor = useMotionTemplate`rgb(${sunColorR}, ${sunColorG}, ${sunColorB})`;
    const sunBoxShadow = useMotionTemplate`0 0 60px 20px rgba(${sunColorR}, ${sunColorG}, ${sunColorB}, 0.4)`;

    const currentPrayerTime = useMemo(() => {
        if (!currentPrayerInfo?.event) {
            return '';
        }
        const match = result.timings.find((timing) => timing.event === currentPrayerInfo.event);
        return match?.time ?? '';
    }, [currentPrayerInfo, result]);

    const activePrayerDisplay = currentPrayerTime
        ? `${currentPrayerInfo.label}: ${currentPrayerTime}`
        : currentPrayerInfo.label;

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

    if (!hydrated) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="relative min-h-[300vh]">
                {/* Parallax sky background with dynamic gradient */}
                <motion.div
                    className="-z-10 pointer-events-none fixed inset-0"
                    style={{ background: useRealTime ? 'rgba(135, 206, 235, 0.3)' : skyColor }}
                />

                {/* Sun */}
                <motion.div
                    className="-z-10 pointer-events-none fixed h-20 w-20 rounded-full"
                    style={{
                        backgroundColor: sunBackgroundColor,
                        boxShadow: sunBoxShadow,
                        left: `${sunX}%`,
                        opacity: sunOpacity,
                        top: `${sunY}%`,
                        x: '-50%',
                        y: '-50%',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                />

                {/* Moon */}
                <motion.div
                    className="-z-10 pointer-events-none fixed h-16 w-16 rounded-full bg-gray-200"
                    style={{
                        boxShadow: '0 0 40px 15px rgba(200, 200, 220, 0.3)',
                        left: '20%',
                        opacity: moonOpacity,
                        top: '25%',
                        x: '-50%',
                        y: '-50%',
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                />

                {/* Prayer time label */}
                {!useRealTime && (
                    <div className="-translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none fixed top-1/2 left-1/2">
                        <ShinyText className="whitespace-nowrap text-center font-bold text-6xl text-foreground/50">
                            {activePrayerDisplay}
                        </ShinyText>
                    </div>
                )}

                {/* Original background gradient */}
                <div className="-z-20 fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(10,46,120,0.6),_transparent_65%)]" />

                <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 sm:top-6 sm:right-6">
                    <Button
                        asChild
                        className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90 dark:border-white/70 dark:bg-white dark:text-[var(--primary-foreground)] dark:hover:bg-white/90"
                        size="icon"
                    >
                        <Link aria-label="Open settings" href="/settings">
                            <Settings2Icon className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>

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
            </div>
        </TooltipProvider>
    );
}
