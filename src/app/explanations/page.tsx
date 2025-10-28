'use client';

import { Coordinates } from 'adhan';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MultiStepLoader } from '@/components/aceternity/multi-step-loader';
import { Button } from '@/components/ui/button';
import { buildPrayerTimeExplanation } from '@/lib/explanation';
import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import { createParameters, useSettings } from '@/lib/settings';

export default function ExplanationsPage() {
    const { settings, hydrated, numeric } = useSettings();
    const [explanation, setExplanation] = useState<PrayerTimeExplanation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLoader, setShowLoader] = useState(false);

    const timeZone = settings.timeZone?.trim() || 'UTC';
    const hasValidCoordinates = Number.isFinite(numeric.latitude) && Number.isFinite(numeric.longitude);

    const currentDate = useMemo(() => new Date(), []);

    useEffect(() => {
        if (!hydrated || !hasValidCoordinates) {
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
                timeZone,
            });
            setExplanation(story);
            setLoading(false);
        } catch (err) {
            console.error('Unable to build explanation', err);
            setError('Unable to load explanation. Please try again.');
            setLoading(false);
        }
    }, [
        hydrated,
        hasValidCoordinates,
        numeric.fajrAngle,
        numeric.ishaAngle,
        numeric.ishaInterval,
        numeric.latitude,
        numeric.longitude,
        settings.address,
        settings.method,
        timeZone,
        currentDate,
    ]);

    if (!hydrated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {!hasValidCoordinates ? (
                <div className="flex min-h-screen flex-col items-center justify-center p-6">
                    <div className="w-full max-w-md space-y-4">
                        <div className="mb-6">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Prayer Times
                                </Link>
                            </Button>
                        </div>
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                            <p className="text-destructive">
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
                <div className="flex min-h-screen flex-col items-center justify-center p-6">
                    <div className="w-full max-w-md space-y-4">
                        <div className="mb-6">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Prayer Times
                                </Link>
                            </Button>
                        </div>
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                            <p className="text-destructive">{error}</p>
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
