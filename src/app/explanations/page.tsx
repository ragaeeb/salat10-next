'use client';

import { Coordinates } from 'adhan';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MultiStepLoader } from '@/components/aceternity/multi-step-loader';
import { Button } from '@/components/ui/button';
import { buildPrayerTimeExplanation } from '@/lib/explanation';
import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import { useCalculationConfig } from '@/lib/prayer-utils';
import { createParameters } from '@/lib/settings';
import { useHasHydrated, useHasValidCoordinates, useNumericSettings, useSettings } from '@/store/usePrayerStore';

export default function ExplanationsPage() {
    const settings = useSettings();
    const numeric = useNumericSettings();
    const hasValidCoordinates = useHasValidCoordinates();
    const hasHydrated = useHasHydrated();
    const config = useCalculationConfig();

    const [explanation, setExplanation] = useState<PrayerTimeExplanation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLoader, setShowLoader] = useState(false);

    const currentDate = useMemo(() => new Date(), []);

    useEffect(() => {
        // Wait for hydration before processing
        if (!hasHydrated) {
            return;
        }

        if (!hasValidCoordinates) {
            setLoading(false);
            return;
        }

        setShowLoader(true);

        try {
            const parameters = createParameters({
                fajrAngle: numeric.fajrAngle,
                ishaAngle: numeric.ishaAngle,
                ishaInterval: numeric.ishaInterval,
                method: settings.method,
            });
            const story = buildPrayerTimeExplanation({
                address: settings.address,
                coordinates: new Coordinates(numeric.latitude, numeric.longitude),
                date: currentDate,
                parameters,
                timeZone: settings.timeZone,
            });
            setExplanation(story);
            setLoading(false);
        } catch (err) {
            console.error('Unable to build explanation', err);
            setError('Unable to load explanation. Please try again.');
            setLoading(false);
        }
    }, [
        hasHydrated,
        hasValidCoordinates,
        numeric.fajrAngle,
        numeric.ishaAngle,
        numeric.ishaInterval,
        numeric.latitude,
        numeric.longitude,
        settings.address,
        settings.method,
        settings.timeZone,
        currentDate,
    ]);

    // Show loading state until hydration completes
    if (!hasHydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="mb-4 text-lg text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {!hasValidCoordinates ? (
                <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
                    <div className="w-full max-w-md space-y-4">
                        <div className="mb-6">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Prayer Times
                                </Link>
                            </Button>
                        </div>
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 sm:p-6">
                            <p className="text-destructive text-sm sm:text-base">
                                Please set valid coordinates in{' '}
                                <Link href="/settings" className="underline">
                                    settings
                                </Link>{' '}
                                to view explanations.
                            </p>
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
                    <div className="w-full max-w-md space-y-4">
                        <div className="mb-6">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Prayer Times
                                </Link>
                            </Button>
                        </div>
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 sm:p-6">
                            <p className="text-destructive text-sm sm:text-base">{error}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <MultiStepLoader
                    loading={loading}
                    open={showLoader}
                    steps={explanation?.steps ?? []}
                    summary={explanation?.summary ?? null}
                />
            )}
        </div>
    );
}
