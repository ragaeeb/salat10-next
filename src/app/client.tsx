'use client';

import { IconCompass } from '@tabler/icons-react';
import { Settings2Icon } from 'lucide-react';
import { useMotionValue } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AsrBookShadow } from '@/components/astro/asr-book-shadow';
import { CelestialSkyBackground } from '@/components/astro/celestial-sky-background';
import { CelestialDevScrubber } from '@/components/dev/celestial-dev-scrubber';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QuoteCard } from '@/components/prayer/quote-card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLiveCelestial } from '@/hooks/use-live-celestial';
import { daily, formatTimeRemaining, getActiveEvent, getTimeUntilNext } from '@/lib/calculator';
import { IS_DEV, salatLabels } from '@/lib/constants';
import { formatCoordinate, formatDate, formatHijriDate } from '@/lib/formatting';
import { writeIslamicDate } from '@/lib/hijri';
import { calculateLunarPhase } from '@/lib/lunar';
import { useActiveEvent, useCalculationConfig, useDayNavigation } from '@/lib/prayer-utils';
import { methodLabelMap } from '@/lib/settings';
import { cn, pick } from '@/lib/utils';
import { useHasHydrated, useHasValidCoordinates, useNumericSettings, useSettings } from '@/store/usePrayerStore';

export function PrayerTimesPageClient() {
    const settings = useSettings();
    const numeric = useNumericSettings();
    const hasValidCoordinates = useHasValidCoordinates();
    const hasHydrated = useHasHydrated();
    const router = useRouter();

    const activeEvent = useActiveEvent();
    const { viewDate, timings, dateLabel, handlePrevDay, handleNextDay, handleToday } = useDayNavigation();

    const live = useLiveCelestial();
    const config = useCalculationConfig();

    // Dev Simulation & Visibility Controls (matches salat10-ios dev scrubber)
    const [simulatedProgress, setSimulatedProgress] = useState<number | null>(null);
    const [simulatedLunarCycle, setSimulatedLunarCycle] = useState<number | null>(null);
    const [isForegroundVisible, setIsForegroundVisible] = useState(true);

    const isSimulating = simulatedProgress !== null;
    const effectiveProgress = isSimulating ? simulatedProgress : live.pNow;
    const simProgressMv = useMotionValue(effectiveProgress);

    useEffect(() => {
        if (isSimulating) {
            simProgressMv.set(simulatedProgress);
        }
    }, [isSimulating, simulatedProgress, simProgressMv]);

    const activeProgressMv = isSimulating ? simProgressMv : live.progressMv;
    const isAfterMaghrib = live.timeline !== null && effectiveProgress >= live.timeline.maghrib;

    // Synchronize timings container with scrubber slider simulation
    const simulatedState = useMemo(() => {
        if (!isSimulating || !live.dayData) {
            return null;
        }

        const tFajr = pick(live.dayData.timings, 'fajr')?.getTime();
        const tNextFajr = live.dayData.nextFajr?.getTime();
        if (!tFajr || !tNextFajr) {
            return null;
        }

        const span = tNextFajr - tFajr;
        const simulatedTimeMs = tFajr + simulatedProgress * span;
        const simulatedDate = new Date(simulatedTimeMs);

        const dailyResult = daily(salatLabels, config, simulatedDate);
        const active = getActiveEvent(dailyResult.timings, simulatedTimeMs);
        const timeUntil = getTimeUntilNext(dailyResult.timings, simulatedTimeMs);
        const countdown = timeUntil && timeUntil > 0 ? `in ${formatTimeRemaining(timeUntil)}` : '';
        const simHijri = writeIslamicDate(0, simulatedDate);

        return {
            activeEvent: active,
            countdownRemaining: countdown,
            date: simulatedDate,
            dateLabel: formatDate(simulatedDate),
            hijriLabel: formatHijriDate(simHijri),
            timings: dailyResult.timings,
        };
    }, [config, isSimulating, live.dayData, simulatedProgress]);

    const effectiveActiveEvent = simulatedState ? simulatedState.activeEvent : activeEvent;
    const effectiveTimings = simulatedState ? simulatedState.timings : timings;
    const effectiveDateLabel = simulatedState ? simulatedState.dateLabel : dateLabel;
    const effectiveHijriLabel = simulatedState
        ? simulatedState.hijriLabel
        : formatHijriDate(writeIslamicDate(0, viewDate));
    const effectiveCountdown = simulatedState ? simulatedState.countdownRemaining : undefined;

    useEffect(() => {
        if (hasHydrated && !hasValidCoordinates) {
            router.push('/settings');
        }
    }, [hasHydrated, hasValidCoordinates, router]);

    if (!hasHydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="mb-4 text-lg text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!hasValidCoordinates) {
        return null;
    }

    const lunarCycle = simulatedLunarCycle ?? calculateLunarPhase(new Date()).cycleFraction;

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            {/* Living Celestial Sky Trajectory Background */}
            <CelestialSkyBackground
                lunarCycle={lunarCycle}
                pNow={effectiveProgress}
                progress={activeProgressMv}
                timeline={live.timeline}
            />

            {/* Header Navigation Actions */}
            <div className="fixed top-3 right-3 z-50 flex items-center gap-2 sm:top-6 sm:right-6">
                <Button
                    asChild
                    className="rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
                    size="sm"
                    variant="default"
                >
                    <Link aria-label="Qibla Compass" href="/qibla">
                        <IconCompass />
                    </Link>
                </Button>

                <Button
                    asChild
                    className="rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
                    size="icon"
                >
                    <Link aria-label="Open settings" href="/settings">
                        <Settings2Icon className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            {/* Foreground Prayer Times & Quote Container (Instant visibility toggle) */}
            <TooltipProvider>
                <div
                    className={cn(
                        'relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-between gap-6 px-3 pt-16 pb-6 sm:gap-8 sm:px-6 sm:pt-20 sm:pb-8 lg:max-w-3xl',
                        !isForegroundVisible && 'pointer-events-none invisible',
                    )}
                >
                    <QuoteCard isAfterMaghrib={isAfterMaghrib} />

                    <div className="relative w-full">
                        {/* Asr Book & Optical Shadow Animation on top of timings container */}
                        <AsrBookShadow
                            latitude={numeric.latitude}
                            progress={activeProgressMv}
                            timeline={live.timeline}
                        />

                        <PrayerTimesCard
                            activeEvent={effectiveActiveEvent}
                            addressLabel={settings.address?.trim()}
                            countdownRemaining={effectiveCountdown}
                            dateLabel={effectiveDateLabel}
                            hijriLabel={effectiveHijriLabel}
                            isAfterMaghrib={isAfterMaghrib}
                            locationDetail={`${formatCoordinate(numeric.latitude, 'N', 'S')} · ${formatCoordinate(numeric.longitude, 'E', 'W')}`}
                            methodLabel={methodLabelMap[settings.method] ?? settings.method}
                            onNextDay={handleNextDay}
                            onPrevDay={handlePrevDay}
                            onToday={handleToday}
                            timings={effectiveTimings}
                        />
                    </div>
                </div>
            </TooltipProvider>

            {/* Developer Time & Lunar Scrubber (Simulation Container) */}
            {IS_DEV && (
                <CelestialDevScrubber
                    isForegroundVisible={isForegroundVisible}
                    isSimulating={simulatedProgress !== null || simulatedLunarCycle !== null}
                    lunarCycle={lunarCycle}
                    onResetToLive={() => {
                        setSimulatedProgress(null);
                        setSimulatedLunarCycle(null);
                    }}
                    onSetForegroundVisible={setIsForegroundVisible}
                    onSetLunarCycle={setSimulatedLunarCycle}
                    onSetSimulatedProgress={setSimulatedProgress}
                    progress={effectiveProgress}
                    simulatedLunarCycle={simulatedLunarCycle}
                    timeline={live.timeline}
                />
            )}
        </div>
    );
}
