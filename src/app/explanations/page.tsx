'use client';

import { Coordinates } from 'adhan';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildPrayerTimeExplanation } from '@/lib/explanation';
import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import { createParameters, useSettings } from '@/lib/settings';

export default function ExplanationsPage() {
    const { settings, hydrated, numeric } = useSettings();
    const [explanation, setExplanation] = useState<PrayerTimeExplanation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const timeZone = settings.timeZone?.trim() || 'UTC';
    const hasValidCoordinates = Number.isFinite(numeric.latitude) && Number.isFinite(numeric.longitude);

    const currentDate = useMemo(() => new Date(), []);

    useEffect(() => {
        if (!hydrated || !hasValidCoordinates) {
            setLoading(false);
            return;
        }

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
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center gap-4">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Prayer Times
                        </Link>
                    </Button>
                </div>

                <h1 className="mb-8 font-bold text-4xl">Today's Prayer Time Calculations</h1>

                {!hasValidCoordinates ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                        <p className="text-destructive">
                            Please set valid coordinates in{' '}
                            <Link href="/settings" className="underline">
                                settings
                            </Link>{' '}
                            to view explanations.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                        <p className="text-destructive">{error}</p>
                    </div>
                ) : explanation ? (
                    <div className="space-y-8">
                        {/* Introduction */}
                        <div className="rounded-lg border bg-card p-6">
                            <h2 className="mb-4 font-semibold text-2xl">Overview</h2>
                            <div className="space-y-2 text-muted-foreground">
                                {explanation.summary.intro.map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>

                        {/* Steps */}
                        {explanation.steps.map((step) => (
                            <div key={step.id} className="rounded-lg border bg-card p-6">
                                <h2 className="mb-4 font-semibold text-2xl">{step.title}</h2>
                                <p className="mb-4 font-medium text-lg">{step.summary}</p>
                                {step.finalValue && (
                                    <div className="mb-4 rounded-md bg-muted p-3">
                                        <span className="font-mono text-sm">{step.finalValue}</span>
                                    </div>
                                )}
                                <div className="space-y-3 text-muted-foreground">
                                    {step.details.map((detail, i) => (
                                        <p key={i}>{detail}</p>
                                    ))}
                                </div>
                                {step.references && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {step.references.map((ref) => (
                                            <a
                                                key={ref.url}
                                                href={ref.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-sm underline hover:no-underline"
                                            >
                                                {ref.label} ↗
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Mathematical Summary */}
                        <div className="rounded-lg border bg-card p-6">
                            <h2 className="mb-4 font-semibold text-2xl">Mathematical Summary</h2>
                            <div className="space-y-3">
                                {explanation.summary.lines.map((line) => (
                                    <div key={line.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        <div className="font-medium">{line.label}</div>
                                        <div className="font-mono text-muted-foreground text-sm md:col-span-2">
                                            {line.expression} = {line.result}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Conclusion */}
                        <div className="rounded-lg border bg-card p-6">
                            <h2 className="mb-4 font-semibold text-2xl">Summary</h2>
                            <div className="space-y-2 text-muted-foreground">
                                {explanation.summary.outro.map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
