'use client';

import { IconCompass, IconCube, IconSunMoon } from '@tabler/icons-react';
import { Settings2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { PrayerTimesCard } from '@/components/prayer/prayer-times-card';
import { QuoteCard } from '@/components/prayer/quote-card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formatCoordinate, formatHijriDate } from '@/lib/formatting';
import { writeIslamicDate } from '@/lib/hijri';
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

    const hijri = useMemo(() => writeIslamicDate(0, viewDate), [viewDate]);

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
                    size="sm"
                    variant="default"
                >
                    <Link href="/3d">
                        <IconCube />
                    </Link>
                </Button>
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="sm"
                    variant="default"
                >
                    <Link href="/qibla">
                        <IconCompass />
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
                    <QuoteCard />

                    <PrayerTimesCard
                        activeEvent={activeEvent}
                        addressLabel={settings.address?.trim()}
                        dateLabel={dateLabel}
                        hijriLabel={formatHijriDate(hijri)}
                        locationDetail={`${formatCoordinate(numeric.latitude, 'N', 'S')} · ${formatCoordinate(numeric.longitude, 'E', 'W')}`}
                        methodLabel={methodLabelMap[settings.method] ?? settings.method}
                        onNextDay={handleNextDay}
                        onPrevDay={handlePrevDay}
                        onToday={handleToday}
                        timings={timings}
                    />
                </div>
            </TooltipProvider>
        </div>
    );
}
