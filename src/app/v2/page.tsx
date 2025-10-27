'use client';

import { ArrowLeft, ChevronDown, ChevronUp, Settings2Icon } from 'lucide-react';
import { motion, useMotionTemplate, useScroll } from 'motion/react';
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

const DAY_HEIGHT = 100000;

type DayData = { date: Date; timings: Array<{ event: string; value: Date; label: string }> };

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

    if (!times.fajr || !times.lastThirdOfTheNight) {
        return 0.5;
    }

    if (now < times.fajr) {
        if (times.lastThirdOfTheNight < times.fajr) {
            const progress = (now - times.lastThirdOfTheNight) / (times.fajr - times.lastThirdOfTheNight);
            return Math.max(0, Math.min(0.1, progress * 0.1));
        }
        return 0;
    }

    if (times.sunrise && now < times.sunrise) {
        const progress = (now - times.fajr) / (times.sunrise - times.fajr);
        return 0.1 + progress * 0.1;
    }

    if (times.dhuhr && now < times.dhuhr) {
        const progress = times.sunrise ? (now - times.sunrise) / (times.dhuhr - times.sunrise) : 0;
        return 0.2 + progress * 0.3;
    }

    if (times.asr && now < times.asr) {
        const progress = times.dhuhr ? (now - times.dhuhr) / (times.asr - times.dhuhr) : 0;
        return 0.5 + progress * 0.15;
    }

    if (times.maghrib && now < times.maghrib) {
        const progress = times.asr ? (now - times.asr) / (times.maghrib - times.asr) : 0;
        return 0.65 + progress * 0.15;
    }

    if (times.isha && now < times.isha) {
        const progress = times.maghrib ? (now - times.maghrib) / (times.isha - times.maghrib) : 0;
        return 0.8 + progress * 0.07;
    }

    if (times.middleOfTheNight && now < times.middleOfTheNight) {
        const progress = times.isha ? (now - times.isha) / (times.middleOfTheNight - times.isha) : 0;
        return 0.87 + progress * 0.06;
    }

    if (times.lastThirdOfTheNight && times.lastThirdOfTheNight > times.fajr && now < times.lastThirdOfTheNight) {
        const progress = times.middleOfTheNight
            ? (now - times.middleOfTheNight) / (times.lastThirdOfTheNight - times.middleOfTheNight)
            : 0;
        return 0.93 + progress * 0.04;
    }

    return 0.97;
};

const getDateAtOffset = (baseDate: Date, offsetDays: number): Date => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + offsetDays);
    return date;
};

export default function ParallaxPage() {
    const { settings, hydrated, numeric } = useSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const [days, setDays] = useState<DayData[]>([]);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showLoadPrev, setShowLoadPrev] = useState(false);
    const [showLoadNext, setShowLoadNext] = useState(false);
    const lastScrollY = useRef(0);

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
        const position = getPrayerScrollPosition(now, today.timings);
        const scrollTop = position * DAY_HEIGHT;

        window.history.scrollRestoration = 'manual';
        window.scrollTo({ behavior: 'instant', left: 0, top: scrollTop });
        lastScrollY.current = scrollTop;
        setHasInitialized(true);

        return () => {
            window.history.scrollRestoration = 'auto';
        };
    }, [hydrated, hasInitialized, days]);

    useEffect(() => {
        if (!hasInitialized || days.length === 0) {
            return;
        }

        const unsubscribe = scrollY.on('change', (latest) => {
            lastScrollY.current = latest;

            const totalHeight = days.length * DAY_HEIGHT;
            const dayProgress = (latest % DAY_HEIGHT) / DAY_HEIGHT;
            setScrollProgress(dayProgress);

            const distanceFromTop = latest;
            const distanceFromBottom = totalHeight - latest - window.innerHeight;

            setShowLoadPrev(distanceFromTop < 5000);
            setShowLoadNext(distanceFromBottom < 5000);
        });

        return () => unsubscribe();
    }, [scrollY, hasInitialized, days]);

    const handleLoadPrev = () => {
        setDays((prev) => {
            const firstDate = prev[0].date;
            const newDate = getDateAtOffset(firstDate, -1);
            const newDay = loadDay(newDate);
            return [newDay, ...prev];
        });

        requestAnimationFrame(() => {
            window.scrollTo({ behavior: 'instant', left: 0, top: lastScrollY.current + DAY_HEIGHT });
        });
    };

    const handleLoadNext = () => {
        setDays((prev) => {
            const lastDate = prev[prev.length - 1].date;
            const newDate = getDateAtOffset(lastDate, 1);
            const newDay = loadDay(newDate);
            return [...prev, newDay];
        });
    };

    const visuals = useMemo(() => calculateScrollBasedVisuals(scrollProgress), [scrollProgress]);
    const prayerInfo = useMemo(() => getPrayerInfoFromScroll(scrollProgress), [scrollProgress]);

    const sunBackgroundColor = useMotionTemplate`rgb(${visuals.sunColor.r}, ${visuals.sunColor.g}, ${visuals.sunColor.b})`;
    const sunBoxShadow = useMotionTemplate`0 0 60px 20px rgba(${visuals.sunColor.r}, ${visuals.sunColor.g}, ${visuals.sunColor.b}, 0.4)`;

    const { skyColor, starsOpacity, fajrGradientOpacity, lightRaysOpacity } = useMemo(() => {
        const skyColors = [
            'rgba(10, 15, 35, 0.4)',
            'rgba(15, 20, 45, 0.38)',
            'rgba(26, 26, 46, 0.35)',
            'rgba(40, 50, 75, 0.35)',
            'rgba(60, 80, 110, 0.4)',
            'rgba(100, 120, 150, 0.45)',
            'rgba(135, 206, 235, 0.3)',
            'rgba(160, 220, 255, 0.35)',
            'rgba(255, 165, 0, 0.3)',
            'rgba(255, 140, 0, 0.4)',
            'rgba(138, 73, 107, 0.3)',
            'rgba(40, 40, 60, 0.6)',
            'rgba(5, 5, 15, 0.95)',
            'rgba(0, 0, 0, 0.98)',
            'rgba(0, 0, 0, 0.98)',
        ];

        const stops = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 0.55, 0.75, 0.82, 0.87, 0.9, 0.93, 0.97, 1];
        let index = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            if (scrollProgress >= stops[i] && scrollProgress < stops[i + 1]) {
                index = i;
                break;
            }
        }

        const starsOpacity =
            scrollProgress < 0.85
                ? 0
                : scrollProgress < 0.9
                  ? ((scrollProgress - 0.85) / 0.05) * 0.5
                  : scrollProgress < 0.93
                    ? 0.5 + ((scrollProgress - 0.9) / 0.03) * 0.5
                    : 1;

        const fajrGradientOpacity =
            scrollProgress < 0.08
                ? 0
                : scrollProgress < 0.12
                  ? ((scrollProgress - 0.08) / 0.04) * 0.3
                  : scrollProgress < 0.2
                    ? 0.3 + ((scrollProgress - 0.12) / 0.08) * 0.7
                    : scrollProgress < 0.25
                      ? 1 - ((scrollProgress - 0.2) / 0.05) * 0.2
                      : scrollProgress < 0.27
                        ? 0.8 - ((scrollProgress - 0.25) / 0.02) * 0.8
                        : 0;

        const lightRaysOpacity =
            scrollProgress < 0.02
                ? 0.8 + (scrollProgress / 0.02) * 0.2
                : scrollProgress < 0.08
                  ? 1 - ((scrollProgress - 0.02) / 0.06) * 0.7
                  : scrollProgress < 0.1
                    ? 0.3 - ((scrollProgress - 0.08) / 0.02) * 0.3
                    : scrollProgress < 0.93
                      ? 0
                      : scrollProgress < 0.95
                        ? ((scrollProgress - 0.93) / 0.02) * 0.3
                        : scrollProgress < 0.98
                          ? 0.3 + ((scrollProgress - 0.95) / 0.03) * 0.5
                          : 0.8 + ((scrollProgress - 0.98) / 0.02) * 0.2;

        return { fajrGradientOpacity, lightRaysOpacity, skyColor: skyColors[index], starsOpacity };
    }, [scrollProgress]);

    const totalHeight = days.length * DAY_HEIGHT;

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
                    className="pointer-events-none absolute z-30 h-20 w-20 rounded-full will-change-transform"
                    style={{
                        backgroundColor: sunBackgroundColor,
                        boxShadow: sunBoxShadow,
                        left: `${visuals.sunX}%`,
                        opacity: visuals.sunOpacity,
                        top: `${visuals.sunY}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                />

                <motion.div
                    className="pointer-events-none absolute z-30 h-16 w-16 rounded-full bg-gray-200 will-change-transform"
                    style={{
                        boxShadow: '0 0 40px 15px rgba(200, 200, 220, 0.3)',
                        left: `${visuals.moonX}%`,
                        opacity: visuals.moonOpacity,
                        top: `${visuals.moonY}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                />

                <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-25">
                    <ShinyText
                        key={prayerInfo.label}
                        className="block text-balance text-center font-bold text-[clamp(2.25rem,8vw,4.5rem)] text-foreground/60 leading-tight drop-shadow-sm"
                    >
                        {prayerInfo.label}
                    </ShinyText>
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
