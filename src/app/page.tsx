'use client';

import { Settings2Icon } from 'lucide-react';
import { motion, useInView, useMotionTemplate, useTransform } from 'motion/react';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ShootingStars } from '@/components/aceternity/shooting-stars';
import { StarsBackground } from '@/components/aceternity/stars-background';
import DebugLogger from '@/components/debug-logger';
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

    const { scrollYProgress, skyColor, fajrGradientOpacity, lightRaysOpacity, starsOpacity } = usePrayerParallax();
    const parallaxTriggerRef = useRef<HTMLDivElement | null>(null);
    const shouldUseScrollMode = useInView(parallaxTriggerRef, { margin: '0px 0px -55% 0px' });

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

    const {
        currentPrayerInfo,
        sunX,
        sunY,
        sunOpacity,
        moonOpacity,
        moonX,
        moonY,
        sunColorR,
        sunColorG,
        sunColorB,
        useRealTime,
    } = usePrayerVisuals({ currentDate, scrollYProgress, shouldUseScrollMode, timings: result.timings });

    const sunLeft = useTransform(sunX, (value) => `${value}%`);
    const sunTop = useTransform(sunY, (value) => `${value}%`);
    const moonLeft = useTransform(moonX, (value) => `${value}%`);
    const moonTop = useTransform(moonY, (value) => `${value}%`);

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

    console.log('[Page] Render state:', {
        moonOpacity: moonOpacity.get(),
        moonX: moonX.get(),
        moonY: moonY.get(),
        sunColorB: sunColorB.get(),
        sunColorG: sunColorG.get(),
        sunColorR: sunColorR.get(),
        sunOpacity: sunOpacity.get(),
        sunX: sunX.get(),
        sunY: sunY.get(),
        useRealTime,
    });

    return (
        <div className="relative min-h-[300vh] bg-background">
            <DebugLogger />
            {/* Parallax sky background with solid color */}
            <motion.div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{ backgroundColor: useRealTime ? 'rgba(135, 206, 235, 0.3)' : skyColor }}
            />

            {/* Shooting Stars and Stars Background - visible during night periods */}
            {!useRealTime && (
                <motion.div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-20"
                    style={{ opacity: starsOpacity }}
                >
                    <ShootingStars
                        starColor="#9E00FF"
                        trailColor="#2EB9DF"
                        minSpeed={10}
                        maxSpeed={30}
                        minDelay={1200}
                        maxDelay={4200}
                        starWidth={20}
                        starHeight={2}
                    />
                    <StarsBackground
                        starDensity={0.0002}
                        allStarsTwinkle={true}
                        twinkleProbability={0.7}
                        minTwinkleSpeed={0.5}
                        maxTwinkleSpeed={1}
                    />
                </motion.div>
            )}

            {/* Last Third of Night - Light pillars shooting upward */}
            {!useRealTime && (
                <motion.div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
                    style={{ opacity: lightRaysOpacity }}
                >
                    {/* Base horizon glow */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 120% 40% at 50% 100%, rgba(100, 140, 255, 0.25) 0%, rgba(80, 120, 200, 0.15) 25%, rgba(60, 90, 150, 0.08) 45%, transparent 70%)',
                        }}
                    />
                    {/* Vertical light pillars - subtle beams */}
                    {/* Subtle shimmer overlay */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(circle at 30% 95%, rgba(140, 180, 255, 0.06) 0%, transparent 25%), radial-gradient(circle at 70% 95%, rgba(120, 160, 240, 0.05) 0%, transparent 25%)',
                        }}
                    />
                </motion.div>
            )}

            {/* Fajr horizon gradient overlay */}
            {!useRealTime && (
                <motion.div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-30"
                    style={{
                        background:
                            'linear-gradient(to top, rgba(255, 200, 80, 0.95) 0%, rgba(255, 180, 90, 0.85) 12%, rgba(255, 160, 100, 0.75) 22%, rgba(240, 160, 120, 0.6) 32%, rgba(180, 150, 140, 0.45) 45%, rgba(120, 130, 160, 0.3) 60%, transparent 78%)',
                        opacity: fajrGradientOpacity,
                    }}
                />
            )}

            {/* Sun */}
            <motion.div
                aria-hidden
                className="-translate-x-1/2 -translate-y-1/2 pointer-events-none fixed z-40 h-20 w-20"
                style={{ left: sunLeft, opacity: sunOpacity, top: sunTop }}
            >
                <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    className="h-full w-full rounded-full"
                    style={{ backgroundColor: sunBackgroundColor, boxShadow: sunBoxShadow }}
                    transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
                />
            </motion.div>

            {/* Moon */}
            <motion.div
                aria-hidden
                className="-translate-x-1/2 -translate-y-1/2 pointer-events-none fixed z-40 h-16 w-16"
                style={{ left: moonLeft, opacity: moonOpacity, top: moonTop }}
            >
                <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    className="h-full w-full rounded-full"
                    style={{ backgroundColor: '#f2f4ff', boxShadow: '0 0 40px 15px rgba(200, 200, 220, 0.35)' }}
                    transition={{ duration: 4.4, ease: 'easeInOut', repeat: Infinity }}
                />
            </motion.div>

            {/* Prayer time label */}
            {!useRealTime && (
                <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none fixed top-1/2 left-1/2 z-30 w-full max-w-4xl px-6">
                    <ShinyText
                        key={activePrayerDisplay}
                        className="block text-balance text-center font-bold text-[clamp(2.25rem,8vw,4.5rem)] text-foreground/60 leading-tight drop-shadow-sm"
                    >
                        {activePrayerDisplay}
                    </ShinyText>
                </div>
            )}

            {/* Original background gradient */}
            <div
                aria-hidden
                className="fixed inset-0 z-10 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)]"
            />

            <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 sm:top-6 sm:right-6">
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
                <div className="relative z-40 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
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

                    <div aria-hidden className="pointer-events-none h-px w-full opacity-0" ref={parallaxTriggerRef} />
                </div>
            </TooltipProvider>
        </div>
    );
}
