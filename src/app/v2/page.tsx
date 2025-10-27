'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Settings2Icon } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShootingStars } from '@/components/aceternity/shooting-stars';
import { StarsBackground } from '@/components/aceternity/stars-background';
import { ShinyText } from '@/components/magicui/shiny-text';
import { Button } from '@/components/ui/button';
import { daily } from '@/lib/calculator';
import { calculateScrollBasedVisuals, getPrayerInfoFromScroll } from '@/lib/prayer-visuals';
import { salatLabels } from '@/lib/salat-labels';
import { useSettings } from '@/lib/settings';

const DAY_HEIGHT = 20000;
const DEBUG_MODE = false;

type DayData = { date: Date; timings: Array<{ event: string; value: Date; label: string }> };

// Replace the getPrayerScrollPosition function with this:
const getPrayerScrollPosition = (now: number, timings: Array<{ event: string; value: Date }>) => {
    const times = {
        asr: timings.find((t) => t.event === 'asr')?.value.getTime(),
        dhuhr: timings.find((t) => t.event === 'dhuhr')?.value.getTime(),
        fajr: timings.find((t) => t.event === 'fajr')?.value.getTime(),
        isha: timings.find((t) => t.event === 'isha')?.value.getTime(),
        lastThirdOfTheNight: timings.find((t) => t.event === 'lastThirdOfTheNight')?.value.getTime(),
        maghrib: timings.find((t) => t.event === 'maghrib')?.value.getTime(),
        middleOfTheNight: timings.find((t) => t.event === 'middleOfTheNight')?.value.getTime(),
        sunrise: timings.find((t) => t.event === 'sunrise')?.value.getTime(),
    };

    if (DEBUG_MODE) {
        console.log(
            '[Initial Scroll Position Debug]',
            'nowTime:',
            new Date(now).toLocaleTimeString(),
            'fajrTime:',
            times.fajr ? new Date(times.fajr).toLocaleTimeString() : 'N/A',
            'sunriseTime:',
            times.sunrise ? new Date(times.sunrise).toLocaleTimeString() : 'N/A',
            'dhuhrTime:',
            times.dhuhr ? new Date(times.dhuhr).toLocaleTimeString() : 'N/A',
            'asrTime:',
            times.asr ? new Date(times.asr).toLocaleTimeString() : 'N/A',
            'maghribTime:',
            times.maghrib ? new Date(times.maghrib).toLocaleTimeString() : 'N/A',
            'ishaTime:',
            times.isha ? new Date(times.isha).toLocaleTimeString() : 'N/A',
            'middleOfNightTime:',
            times.middleOfTheNight ? new Date(times.middleOfTheNight).toLocaleTimeString() : 'N/A',
            'lastThirdTime:',
            times.lastThirdOfTheNight ? new Date(times.lastThirdOfTheNight).toLocaleTimeString() : 'N/A',
        );
    }

    if (!times.fajr || !times.sunrise || !times.dhuhr) {
        if (DEBUG_MODE) {
            console.log('[Initial Scroll] Missing critical times, defaulting to 0.05');
        }
        return 0.05;
    }

    let scrollPos = 0.05;
    let period = 'unknown';

    // Check if we're in the night periods (after isha or before fajr)
    if (times.isha && times.middleOfTheNight && now >= times.isha && now < times.middleOfTheNight) {
        const progress = (now - times.isha) / (times.middleOfTheNight - times.isha);
        scrollPos = 0.87 + progress * 0.06;
        period = 'isha to middleOfNight';
    } else if (
        times.middleOfTheNight &&
        times.lastThirdOfTheNight &&
        now >= times.middleOfTheNight &&
        now < times.lastThirdOfTheNight
    ) {
        const progress = (now - times.middleOfTheNight) / (times.lastThirdOfTheNight - times.middleOfTheNight);
        scrollPos = 0.93 + progress * 0.04;
        period = 'middleOfNight to lastThird';
    } else if (times.lastThirdOfTheNight && now >= times.lastThirdOfTheNight && now < times.fajr) {
        const progress = (now - times.lastThirdOfTheNight) / (times.fajr - times.lastThirdOfTheNight);
        scrollPos = 0.97 + progress * 0.03;
        period = 'lastThird to fajr (wrapping to top)';
    } else if (now < times.fajr) {
        // Before fajr but not in lastThird period (edge case)
        scrollPos = 0;
        period = 'before fajr';
    } else if (now < times.sunrise) {
        const progress = (now - times.fajr) / (times.sunrise - times.fajr);
        scrollPos = 0.0 + progress * 0.1;
        period = 'fajr to sunrise';
    } else if (now < times.dhuhr) {
        const progress = (now - times.sunrise) / (times.dhuhr - times.sunrise);
        scrollPos = 0.1 + progress * 0.4;
        period = 'sunrise to dhuhr';
    } else if (times.asr && now < times.asr) {
        const progress = (now - times.dhuhr) / (times.asr - times.dhuhr);
        scrollPos = 0.5 + progress * 0.15;
        period = 'dhuhr to asr';
    } else if (times.maghrib && now < times.maghrib) {
        const progress = times.asr ? (now - times.asr) / (times.maghrib - times.asr) : 0;
        scrollPos = 0.65 + progress * 0.15;
        period = 'asr to maghrib';
    } else if (times.isha && now < times.isha) {
        const progress = times.maghrib ? (now - times.maghrib) / (times.isha - times.maghrib) : 0;
        scrollPos = 0.8 + progress * 0.07;
        period = 'maghrib to isha';
    } else {
        scrollPos = 0.87;
        period = 'after isha (default)';
    }

    if (DEBUG_MODE) {
        console.log(
            '[Initial Scroll Position]',
            'period:',
            period,
            'scrollPos:',
            scrollPos.toFixed(3),
            'calculatedScrollTop:',
            (scrollPos * DAY_HEIGHT).toFixed(0),
        );
    }

    return scrollPos;
};

// Replace the getSkyColor function with this:
const getSkyColor = (scrollProgress: number): string => {
    const skyColors = [
        'rgba(26, 26, 46, 0.35)', // 0.0 - Fajr pre-dawn
        'rgba(40, 50, 75, 0.35)', // 0.05 - Fajr dawn
        'rgba(60, 80, 110, 0.4)', // 0.1 - Sunrise beginning
        'rgba(100, 120, 150, 0.45)', // 0.15 - Post-sunrise
        'rgba(135, 206, 235, 0.3)', // 0.2 - Morning (Dhuhr period start)
        'rgba(160, 220, 255, 0.35)', // 0.35 - Mid-morning
        'rgba(135, 206, 235, 0.3)', // 0.5 - Asr period start
        'rgba(255, 165, 0, 0.3)', // 0.6 - Late afternoon
        'rgba(255, 140, 0, 0.4)', // 0.7 - Pre-Maghrib
        'rgba(138, 73, 107, 0.3)', // 0.8 - Isha period start
        'rgba(40, 40, 60, 0.6)', // 0.85 - Post-Isha
        'rgba(5, 5, 15, 0.95)', // 0.9 - Half night period
        'rgba(0, 0, 0, 0.98)', // 0.93 - Last third period start
        'rgba(10, 15, 35, 0.4)', // 0.97 - Deep night
        'rgba(15, 20, 45, 0.38)', // 1.0 - End of last third
    ];

    const stops = [0, 0.05, 0.1, 0.15, 0.2, 0.35, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.93, 0.97, 1];
    let index = 0;
    for (let i = 0; i < stops.length - 1; i++) {
        if (scrollProgress >= stops[i] && scrollProgress < stops[i + 1]) {
            index = i;
            break;
        }
    }

    return skyColors[index];
};

// Replace the getStarsOpacity function with this:
const getStarsOpacity = (scrollProgress: number): number => {
    if (scrollProgress < 0.7) {
        return 0;
    }
    if (scrollProgress < 0.75) {
        return ((scrollProgress - 0.7) / 0.05) * 0.5;
    }
    if (scrollProgress < 0.8) {
        return 0.5 + ((scrollProgress - 0.75) / 0.05) * 0.5;
    }
    return 1;
};

// Replace the getFajrGradientOpacity function with this:
const getFajrGradientOpacity = (scrollProgress: number): number => {
    if (scrollProgress < 0.0) {
        return 0;
    }
    if (scrollProgress < 0.02) {
        return (scrollProgress / 0.02) * 0.3;
    }
    if (scrollProgress < 0.08) {
        return 0.3 + ((scrollProgress - 0.02) / 0.06) * 0.7;
    }
    if (scrollProgress < 0.12) {
        return 1 - ((scrollProgress - 0.08) / 0.04) * 0.2;
    }
    if (scrollProgress < 0.15) {
        return 0.8 - ((scrollProgress - 0.12) / 0.03) * 0.8;
    }
    return 0;
};

// Replace the getLightRaysOpacity function with this:
const getLightRaysOpacity = (scrollProgress: number): number => {
    // Light rays at beginning (Fajr) and end (Last third of night)
    if (scrollProgress < 0.93) {
        return 0;
    }
    if (scrollProgress < 0.95) {
        return ((scrollProgress - 0.93) / 0.02) * 0.3;
    }
    if (scrollProgress < 0.98) {
        return 0.3 + ((scrollProgress - 0.95) / 0.03) * 0.5;
    }
    return 0.8 + ((scrollProgress - 0.98) / 0.02) * 0.2;
};

export default function ParallaxPage() {
    const { settings, hydrated, numeric } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const [days, setDays] = useState<DayData[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const lastScrollY = useRef(0);
    const currentProgressRef = useRef(0);

    const timeZone = settings.timeZone?.trim() || 'UTC';

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

    const loadDay = useCallback(
        (date: Date): DayData => {
            const result = daily(salatLabels, calculationArgs, date);
            return { date, timings: result.timings };
        },
        [calculationArgs],
    );

    useEffect(() => {
        if (!hydrated) {
            return;
        }
        const today = new Date();
        setDays([loadDay(today)]);
    }, [hydrated, loadDay]);

    useEffect(() => {
        if (!hydrated || hasInitialized || days.length === 0) {
            return;
        }

        const today = days[0];
        if (!today) {
            return;
        }

        const now = new Date().getTime();

        if (DEBUG_MODE) {
            console.log(
                '[Initialization Debug]',
                'currentTime:',
                new Date(now).toLocaleTimeString(),
                'dayDate:',
                today.date.toLocaleDateString(),
                'timingsCount:',
                today.timings.length,
            );
        }

        const position = getPrayerScrollPosition(now, today.timings);
        const scrollTop = position * DAY_HEIGHT;

        if (DEBUG_MODE) {
            console.log(
                '[Setting Initial Scroll]',
                'position:',
                position.toFixed(3),
                'scrollTop:',
                scrollTop.toFixed(0),
                'dayHeight:',
                DAY_HEIGHT,
            );
        }

        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'instant', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        setHasInitialized(true);

        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [hydrated, hasInitialized, days]);

    const totalHeight = days.length * DAY_HEIGHT;

    const scrollProgress = useTransform(scrollY, (latest) => (latest % DAY_HEIGHT) / DAY_HEIGHT);

    useEffect(() => {
        if (!hasInitialized || days.length === 0) {
            return;
        }

        const unsubscribe = scrollY.on('change', (latest) => {
            lastScrollY.current = latest;

            const dayIndex = Math.floor(latest / DAY_HEIGHT);
            if (dayIndex !== currentDayIndex) {
                setCurrentDayIndex(dayIndex);
            }

            currentProgressRef.current = (latest % DAY_HEIGHT) / DAY_HEIGHT;

            const distanceFromTop = latest;
            const distanceFromBottom = totalHeight - latest - window.innerHeight;

            setShowLoadPrev(distanceFromTop < 3000);
            setShowLoadNext(distanceFromBottom < 3000);
        });

        return () => unsubscribe();
    }, [scrollY, hasInitialized, days, totalHeight, currentDayIndex]);

    const handleLoadPrev = useCallback(() => {
        setDays((prev) => {
            const firstDate = prev[0].date;
            const newDate = getDateAtOffset(firstDate, -1);
            const newDay = loadDay(newDate);
            return [newDay, ...prev];
        });

        requestAnimationFrame(() => {
            window.scrollTo({ behavior: 'instant', left: 0, top: lastScrollY.current + DAY_HEIGHT });
        });
    }, [loadDay]);

    const handleLoadNext = useCallback(() => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1].date;
            const newDate = getDateAtOffset(lastDate, 1);
            const newDay = loadDay(newDate);
            return [...prev, newDay];
        });
    }, [loadDay]);

    const skyColor = useTransform(scrollProgress, getSkyColor);
    const starsOpacity = useTransform(scrollProgress, getStarsOpacity);
    const fajrGradientOpacity = useTransform(scrollProgress, getFajrGradientOpacity);
    const lightRaysOpacity = useTransform(scrollProgress, getLightRaysOpacity);

    const sunX = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).sunX);
    const sunY = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).sunY);
    const sunOpacity = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).sunOpacity);
    const sunColorR = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).sunColor.r);
    const sunColorG = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).sunColor.g);
    const sunColorB = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).sunColor.b);

    const sunBackgroundColor = useTransform([sunColorR, sunColorG, sunColorB], ([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
    const sunBoxShadow = useTransform(
        [sunColorR, sunColorG, sunColorB],
        ([r, g, b]) => `0 0 60px 20px rgba(${r}, ${g}, ${b}, 0.4)`,
    );
    const sunLeftPosition = useTransform(sunX, (x) => `${x}%`);
    const sunTopPosition = useTransform(sunY, (y) => `${y}%`);

    const moonX = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).moonX);
    const moonY = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).moonY);
    const moonOpacity = useTransform(scrollProgress, (p) => calculateScrollBasedVisuals(p).moonOpacity);

    const moonLeftPosition = useTransform(moonX, (x) => `${x}%`);
    const moonTopPosition = useTransform(moonY, (y) => `${y}%`);

    const currentDayTimings = useMemo(() => {
        return days[currentDayIndex]?.timings || [];
    }, [days, currentDayIndex]);

    const [prayerInfo, setPrayerInfo] = useState(() => getPrayerInfoFromScroll(0, currentDayTimings));

    useEffect(() => {
        const unsubscribe = scrollProgress.on('change', (progress) => {
            if (DEBUG_MODE) {
                const visuals = calculateScrollBasedVisuals(progress);
                console.log(
                    '[Parallax Debug]',
                    'progress:',
                    progress.toFixed(3),
                    'sunX:',
                    visuals.sunX.toFixed(1),
                    'sunY:',
                    visuals.sunY.toFixed(1),
                    'sunOpacity:',
                    visuals.sunOpacity.toFixed(3),
                    'sunColor:',
                    JSON.stringify(visuals.sunColor),
                    'moonOpacity:',
                    visuals.moonOpacity.toFixed(3),
                );
            }

            const info = getPrayerInfoFromScroll(progress, currentDayTimings);
            setPrayerInfo(info);
        });

        return () => unsubscribe();
    }, [scrollProgress, currentDayTimings]);

    if (!hydrated) {
        return null;
    }

    return (
        <>
            <div ref={containerRef} style={{ height: totalHeight }} />

            <div className="fixed inset-0">
                <motion.div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{ backgroundColor: skyColor }}
                />

                <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ opacity: starsOpacity }}>
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

                <motion.div
                    className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
                    style={{ opacity: lightRaysOpacity }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 120% 40% at 50% 100%, rgba(100, 140, 255, 0.25) 0%, rgba(80, 120, 200, 0.15) 25%, rgba(60, 90, 150, 0.08) 45%, transparent 70%)',
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(circle at 30% 95%, rgba(140, 180, 255, 0.06) 0%, transparent 25%), radial-gradient(circle at 70% 95%, rgba(120, 160, 240, 0.05) 0%, transparent 25%)',
                        }}
                    />
                </motion.div>

                <motion.div
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                        background:
                            'linear-gradient(to top, rgba(255, 200, 80, 0.95) 0%, rgba(255, 180, 90, 0.85) 12%, rgba(255, 160, 100, 0.75) 22%, rgba(240, 160, 120, 0.6) 32%, rgba(180, 150, 140, 0.45) 45%, rgba(120, 130, 160, 0.3) 60%, transparent 78%)',
                        opacity: fajrGradientOpacity,
                    }}
                />

                <motion.div
                    className={`pointer-events-none absolute z-30 h-20 w-20 rounded-full ${DEBUG_MODE ? 'border-2 border-red-500' : ''}`}
                    style={{
                        backgroundColor: sunBackgroundColor,
                        boxShadow: sunBoxShadow,
                        left: sunLeftPosition,
                        opacity: sunOpacity,
                        top: sunTopPosition,
                        transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
                        willChange: 'transform, opacity',
                    }}
                />

                <motion.div
                    className={`pointer-events-none absolute z-30 h-16 w-16 rounded-full bg-gray-200 ${DEBUG_MODE ? 'border-2 border-blue-500' : ''}`}
                    style={{
                        boxShadow: '0 0 40px 15px rgba(200, 200, 220, 0.3)',
                        left: moonLeftPosition,
                        opacity: moonOpacity,
                        top: moonTopPosition,
                        transform: 'translate(-50%, -50%) translate3d(0, 0, 0)',
                        willChange: 'transform, opacity',
                    }}
                />

                <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-25">
                    <ShinyText
                        key={prayerInfo.label}
                        className="block text-balance text-center font-bold text-[clamp(2.25rem,8vw,4.5rem)] text-foreground/60 leading-tight drop-shadow-sm"
                    >
                        {prayerInfo.label}
                    </ShinyText>
                    {prayerInfo.time && (
                        <motion.div
                            key={prayerInfo.time}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-center font-semibold text-[clamp(1.5rem,4vw,2.5rem)] text-foreground/50"
                        >
                            {prayerInfo.time}
                        </motion.div>
                    )}
                </div>

                <div className="absolute inset-0 z-15 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)]" />

                {showLoadPrev && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="-translate-x-1/2 absolute top-20 left-1/2 z-60"
                    >
                        <Button
                            onClick={handleLoadPrev}
                            size="lg"
                            className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        >
                            <ChevronUp className="mr-2 h-5 w-5" />
                            Load Previous Day
                        </Button>
                    </motion.div>
                )}

                {showLoadNext && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="-translate-x-1/2 absolute bottom-20 left-1/2 z-60"
                    >
                        <Button
                            onClick={handleLoadNext}
                            size="lg"
                            className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        >
                            Load Next Day
                            <ChevronDown className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                )}

                <div className="absolute top-4 right-4 z-60 flex items-center gap-2 sm:top-6 sm:right-6">
                    <Button
                        asChild
                        className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                        size="sm"
                        variant="default"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Card View
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
            </div>
        </>
    );
}
