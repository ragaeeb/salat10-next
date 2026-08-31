'use client';

import { IconCompass } from '@tabler/icons-react';
import { Settings2Icon } from 'lucide-react';
import { motion, useMotionValue } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CelestialSkyBackground } from '@/components/astro/celestial-sky-background';
import { CelestialDevScrubber } from '@/components/dev/celestial-dev-scrubber';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QuoteCard } from '@/components/prayer/quote-card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLiveCelestial } from '@/hooks/use-live-celestial';
import { IS_DEV } from '@/lib/constants';
import { formatCoordinate, formatHijriDate } from '@/lib/formatting';
import { writeIslamicDate } from '@/lib/hijri';
import { calculateLunarPhase } from '@/lib/lunar';
import { useActiveEvent, useDayNavigation } from '@/lib/prayer-utils';
import { methodLabelMap } from '@/lib/settings';
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

    const hijri = writeIslamicDate(0, viewDate);

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
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 sm:top-6 sm:right-6">
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

            {/* Foreground Prayer Times & Quote Container (Initial Fade In for Sky Visibility) */}
            <TooltipProvider>
                <motion.div
                    animate={{
                        opacity: isForegroundVisible ? 1 : 0,
                        pointerEvents: isForegroundVisible ? 'auto' : 'none',
                        y: isForegroundVisible ? 0 : 20,
                    }}
                    className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 pt-24 pb-16 sm:px-6 lg:px-8"
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.45, duration: 1.1, ease: 'easeInOut' }}
                >
                    <QuoteCard isAfterMaghrib={isAfterMaghrib} />

                    <PrayerTimesCard
                        activeEvent={activeEvent}
                        addressLabel={settings.address?.trim()}
                        dateLabel={dateLabel}
                        hijriLabel={formatHijriDate(hijri)}
                        isAfterMaghrib={isAfterMaghrib}
                        locationDetail={`${formatCoordinate(numeric.latitude, 'N', 'S')} · ${formatCoordinate(numeric.longitude, 'E', 'W')}`}
                        methodLabel={methodLabelMap[settings.method] ?? settings.method}
                        onNextDay={handleNextDay}
                        onPrevDay={handlePrevDay}
                        onToday={handleToday}
                        timings={timings}
                    />
                </motion.div>
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
