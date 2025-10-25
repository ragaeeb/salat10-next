'use client';

import { Settings2 } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QUOTE_WATERMARK, QuoteCard } from '@/components/prayer/quote-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCopyFeedback } from '@/hooks/use-copy-feedback';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { usePrayerParallax } from '@/hooks/use-prayer-parallax';
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

    // Prayer parallax hook
    const { sunX, sunY, skyColor, scrollYProgress, getPrayerInfo } = usePrayerParallax();
    const [currentPrayerInfo, setCurrentPrayerInfo] = useState(() => getPrayerInfo(0));
    const [useRealTime, setUseRealTime] = useState(true);
    const [realSunX, setRealSunX] = useState(50);
    const [realSunY, setRealSunY] = useState(80);
    const [moonOpacity, setMoonOpacity] = useState(0);
    const [crescentProgress, setCrescentProgress] = useState(0); // 0 = full circle, 1 = thin crescent
    const lastScrollProgressRef = useRef(0);

    // Motion values for dynamic sun color - ALWAYS CALLED
    const sunColorR = useMotionValue(255);
    const sunColorG = useMotionValue(215);
    const sunColorB = useMotionValue(0);

    // Motion template - ALWAYS CALLED
    const sunBackgroundColor = useMotionTemplate`rgb(${sunColorR}, ${sunColorG}, ${sunColorB})`;
    const sunBoxShadow = useMotionTemplate`0 0 60px 20px rgba(${sunColorR}, ${sunColorG}, ${sunColorB}, 0.4)`;

    useEffect(() => {
        const initialInfo = getPrayerInfo(scrollYProgress.get());
        setCurrentPrayerInfo(initialInfo);
        lastScrollProgressRef.current = scrollYProgress.get();

        const unsubscribe = scrollYProgress.on('change', (latest) => {
            const previous = lastScrollProgressRef.current;
            lastScrollProgressRef.current = latest;

            const nextInfo = getPrayerInfo(latest);
            setCurrentPrayerInfo(nextInfo);
            console.log('[Scroll] Progress:', latest, 'Previous:', previous, 'Prayer:', nextInfo.event);

            // Only switch to scroll mode if user is deliberately scrolling
            // Ignore jumps from 0 to high values (hydration artifacts)
            // Only activate scroll mode when scrolling from a low position gradually upward
            const isDeliberateScroll = previous < 0.1 && latest > 0.05 && latest < 0.5;
            const isContinuedScroll = previous > 0.05 && latest > 0.05;

            if (isDeliberateScroll || isContinuedScroll) {
                console.log('[Scroll] Switching to scroll mode');
                setUseRealTime(false);

                // Update moon opacity and crescent based on scroll
                if (latest > 0.9) {
                    setMoonOpacity((latest - 0.9) * 10);
                    // From Maghrib (0.9) to Isha (1.0), transform to crescent
                    setCrescentProgress((latest - 0.9) * 10);
                } else if (latest > 0.8) {
                    // Between Asr (0.8) and Maghrib (0.9), show as full moon
                    setMoonOpacity(1);
                    setCrescentProgress(0);
                } else {
                    setMoonOpacity(0);
                    setCrescentProgress(0);
                }

                // Update sun color based on scroll progress and prayer period
                const sunXValue = sunX.get();
                const sunXPercent = typeof sunXValue === 'string' ? parseFloat(sunXValue.replace('%', '')) : sunXValue;

                console.log('[Scroll] Sun X:', sunXPercent);

                // White (moon) after Maghrib (progress > 0.8), orange before
                if (latest > 0.8) {
                    console.log('[Scroll] Setting celestial body to WHITE (Moon after Maghrib)');
                    sunColorR.set(240);
                    sunColorG.set(240);
                    sunColorB.set(255);
                } else {
                    console.log('[Scroll] Setting sun to YELLOW/ORANGE');
                    // Orange closer to sunset
                    if (latest > 0.7) {
                        sunColorR.set(255);
                        sunColorG.set(140);
                        sunColorB.set(0);
                    } else {
                        sunColorR.set(255);
                        sunColorG.set(215);
                        sunColorB.set(0);
                    }
                }
            } else {
                console.log('[Scroll] Ignoring updates - in real-time mode or invalid scroll jump');
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress, getPrayerInfo, sunX, sunColorR, sunColorG, sunColorB]);

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

    // Calculate real-time sun position based on actual prayer times
    useEffect(() => {
        if (!result.timings.length) {
            return;
        }

        const now = currentDate.getTime();
        const timings = result.timings;

        const fajr = timings.find((t) => t.event === 'fajr')?.value.getTime();
        const sunrise = timings.find((t) => t.event === 'sunrise')?.value.getTime();
        const dhuhr = timings.find((t) => t.event === 'dhuhr')?.value.getTime();
        const asr = timings.find((t) => t.event === 'asr')?.value.getTime();
        const maghrib = timings.find((t) => t.event === 'maghrib')?.value.getTime();
        const isha = timings.find((t) => t.event === 'isha')?.value.getTime();

        if (!fajr || !sunrise || !dhuhr || !maghrib || !isha) {
            return;
        }

        console.log('[Real-time] Now:', new Date(now).toLocaleTimeString());
        console.log('[Real-time] Maghrib:', new Date(maghrib).toLocaleTimeString());
        console.log('[Real-time] Isha:', new Date(isha).toLocaleTimeString());

        let x = 50;
        let y = 80;
        let moonVis = 0;
        let crescent = 0;
        let isOrange = false;
        let isMoon = false;

        if (now < fajr) {
            x = 85;
            y = 95;
            moonVis = 1;
            crescent = 0.7; // Crescent moon before dawn
            isMoon = true;
            console.log('[Real-time] Period: Before Fajr - MOON');
        } else if (now < sunrise) {
            const progress = (now - fajr) / (sunrise - fajr);
            x = 85 - progress * 15;
            y = 95 - progress * 15;
            console.log('[Real-time] Period: Fajr to Sunrise');
        } else if (now < dhuhr) {
            const progress = (now - sunrise) / (dhuhr - sunrise);
            x = 70 - progress * 20;
            y = 80 - progress * 60;
            console.log('[Real-time] Period: Sunrise to Dhuhr');
        } else if (now < asr!) {
            const progress = (now - dhuhr) / ((asr || dhuhr + 3600000) - dhuhr);
            x = 50 - progress * 20;
            y = 20 + progress * 30;
            console.log('[Real-time] Period: Dhuhr to Asr');
        } else if (now < maghrib) {
            const progress = (now - (asr || dhuhr)) / (maghrib - (asr || dhuhr));
            x = 30 - progress * 15;
            y = 50 + progress * 30;
            isOrange = true;
            console.log('[Real-time] Period: Asr to Maghrib - ORANGE');
        } else if (now < isha) {
            // From Maghrib to Isha: white moon becoming crescent
            const progress = (now - maghrib) / (isha - maghrib);
            x = 15 - progress * 5;
            y = 80 + progress * 15;
            moonVis = 1;
            crescent = progress; // Gradually form crescent
            isMoon = true;
            console.log('[Real-time] Period: Maghrib to Isha - MOON (crescent forming)');
        } else {
            x = 10;
            y = 95;
            moonVis = 1;
            crescent = 0.7; // Crescent moon at night
            isMoon = true;
            console.log('[Real-time] Period: After Isha - MOON');
        }

        console.log('[Real-time] Celestial body position X:', x, 'Y:', y, 'Orange:', isOrange, 'Moon:', isMoon);

        setRealSunX(x);
        setRealSunY(y);
        setMoonOpacity(moonVis);
        setCrescentProgress(crescent);

        // Update sun/moon color based on prayer period
        if (isMoon) {
            console.log('[Real-time] Setting to WHITE MOON');
            sunColorR.set(240);
            sunColorG.set(240);
            sunColorB.set(255);
        } else if (isOrange) {
            console.log('[Real-time] Setting sun to ORANGE');
            sunColorR.set(255);
            sunColorG.set(140);
            sunColorB.set(0);
        } else {
            console.log('[Real-time] Setting sun to YELLOW');
            sunColorR.set(255);
            sunColorG.set(215);
            sunColorB.set(0);
        }
    }, [currentDate, result.timings, sunColorR, sunColorG, sunColorB]);

    // Reset to real-time mode and scroll position on mount/page visibility
    useEffect(() => {
        console.log('[Mount] Resetting scroll position and real-time mode');
        // Force scroll to top
        if (typeof window !== 'undefined') {
            window.history.scrollRestoration = 'manual';
            window.scrollTo({ behavior: 'instant', left: 0, top: 0 });
            console.log('[Mount] Scroll position:', window.scrollY);
        }
        setUseRealTime(true);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[Visibility] Page visible, resetting');
                setUseRealTime(true);
                window.scrollTo({ behavior: 'instant', left: 0, top: 0 });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (typeof window !== 'undefined') {
                window.history.scrollRestoration = 'auto';
            }
        };
    }, []);

    useEffect(() => {
        const updateColors = () => {
            const r = sunColorR.get();
            const g = sunColorG.get();
            const b = sunColorB.get();
            console.log('[Color Update] RGB:', r, g, b);
        };

        const unsubR = sunColorR.on('change', updateColors);
        const unsubG = sunColorG.on('change', updateColors);
        const unsubB = sunColorB.on('change', updateColors);

        return () => {
            unsubR();
            unsubG();
            unsubB();
        };
    }, [sunColorR, sunColorG, sunColorB]);

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

    // Early return AFTER all hooks have been called
    if (!hydrated) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="relative min-h-[300vh]">
                {/* Parallax sky background */}
                <motion.div
                    className="-z-10 pointer-events-none fixed inset-0"
                    style={{ backgroundColor: useRealTime ? 'rgba(135, 206, 235, 0.3)' : skyColor }}
                />

                {/* Sun/Moon - transitions from sun to moon at Maghrib */}
                <motion.div
                    className="-z-10 pointer-events-none fixed h-20 w-20"
                    style={{
                        left: useRealTime ? `${realSunX}%` : sunX,
                        top: useRealTime ? `${realSunY}%` : sunY,
                        x: '-50%',
                        y: '-50%',
                    }}
                    animate={{ opacity: moonOpacity > 0 ? moonOpacity : [0.9, 1, 0.9], scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                    key={useRealTime ? 'realtime' : 'scroll'}
                >
                    <div
                        className="h-full w-full rounded-full"
                        style={{
                            backgroundColor:
                                crescentProgress > 0.05
                                    ? 'transparent'
                                    : `rgb(${sunColorR.get()}, ${sunColorG.get()}, ${sunColorB.get()})`,
                            boxShadow:
                                crescentProgress > 0.05
                                    ? `${15 + crescentProgress * 25}px 0 0 ${4 - crescentProgress * 2}px rgb(${sunColorR.get()}, ${sunColorG.get()}, ${sunColorB.get()}), 0 0 60px 20px rgba(${sunColorR.get()}, ${sunColorG.get()}, ${sunColorB.get()}, 0.4)`
                                    : `0 0 60px 20px rgba(${sunColorR.get()}, ${sunColorG.get()}, ${sunColorB.get()}, 0.4)`,
                        }}
                    />
                </motion.div>

                {/* Prayer time label */}
                <div className="-translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none fixed top-1/2 left-1/2">
                    <p className="whitespace-nowrap text-center font-bold text-6xl text-foreground/50">
                        {activePrayerDisplay}
                    </p>
                </div>

                {/* Original background gradient */}
                <div className="-z-20 fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(10,46,120,0.6),_transparent_65%)]" />

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
