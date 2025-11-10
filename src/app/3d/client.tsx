'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SolarDetailsPanel } from '@/components/solar/solar-details-panel';
import { SunStage } from '@/components/solar/sun-stage';
import { Button } from '@/components/ui/button';
import { daily } from '@/lib/calculator';
import { salatLabels } from '@/lib/constants';
import { degreesToRadians } from '@/lib/explanation/math';
import { formatCoordinate } from '@/lib/formatting';
import { useCalculationConfig, useActiveEvent } from '@/lib/prayer-utils';
import { methodLabelMap } from '@/lib/settings';
import { useSolarPosition } from '@/hooks/use-solar-position';
import { useHasHydrated, useHasValidCoordinates, useSettings } from '@/store/usePrayerStore';

type ShadowConvention = 'shafi' | 'hanafi';

const shadowLabel: Record<ShadowConvention, string> = {
    hanafi: 'Ḥanafī · 2× object height',
    shafi: 'Shāfiʿī · 1× object height',
};

const conventionThreshold: Record<ShadowConvention, number> = { hanafi: 2, shafi: 1 };

/**
 * Client component powering the /3d route. Renders a 3D-inspired sky with
 * real-time solar position, prayer timetable, and Asr shadow guidance.
 */
export function SolarSkyClient() {
    const settings = useSettings();
    const hasHydrated = useHasHydrated();
    const hasValidCoordinates = useHasValidCoordinates();
    const activeEvent = useActiveEvent();
    const config = useCalculationConfig();

    const [convention, setConvention] = useState<ShadowConvention>('shafi');

    const latitude = Number.parseFloat(settings.latitude);
    const longitude = Number.parseFloat(settings.longitude);

    const { position, timestamp } = useSolarPosition({ latitude, longitude });

    const timetable = useMemo(() => {
        if (!hasValidCoordinates) {
            return null;
        }
        return daily(salatLabels, config, new Date());
    }, [config, hasValidCoordinates]);

    const baselineShadow = useMemo(() => {
        if (!position || !Number.isFinite(latitude)) {
            return null;
        }
        const separation = Math.abs(latitude - position.declination);
        return Math.tan(degreesToRadians(separation));
    }, [latitude, position]);

    const shadowRatio = useMemo(() => {
        if (!position || position.altitude <= 0) {
            return null;
        }
        const altitudeRad = degreesToRadians(position.altitude);
        const ratio = 1 / Math.tan(altitudeRad);
        return Number.isFinite(ratio) ? ratio : null;
    }, [position]);

    const threshold = baselineShadow !== null ? baselineShadow + conventionThreshold[convention] : conventionThreshold[convention];
    const isAsr = shadowRatio !== null && baselineShadow !== null && shadowRatio >= threshold;
    const madhabLabel = shadowLabel[convention];

    if (!hasHydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
                <div className="text-center text-lg">Loading solar data…</div>
            </div>
        );
    }

    if (!hasValidCoordinates) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-200">
                <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
                    <h1 className="text-xl font-semibold text-slate-50">Location required</h1>
                    <p className="mt-3 text-sm text-slate-200/80">
                        Set your coordinates in the settings to view the 3D solar visualisation and Asr shadow guidance.
                    </p>
                    <Button asChild className="mt-6" variant="default">
                        <Link href="/settings">Open settings</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const addressLabel = settings.address?.trim() || 'Custom coordinates';
    const methodLabel = methodLabelMap[settings.method] ?? settings.method;
    const activeLabel = activeEvent ? salatLabels[activeEvent] ?? activeEvent : 'No active prayer';
    const timezone = settings.timeZone;

    const coordinateLabel =
        Number.isFinite(latitude) && Number.isFinite(longitude)
            ? `${formatCoordinate(latitude, 'N', 'S')} · ${formatCoordinate(longitude, 'E', 'W')}`
            : '';

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.12),_transparent_55%)]" />
            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8">
                <header className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-200/80">
                        <span>Sun &amp; Shadow Visualiser</span>
                    </div>
                    <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">3D Solar Prayer View</h1>
                    <p className="mx-auto max-w-2xl text-sm text-slate-200/80">
                        Watch the sun glide across your sky, see live shadow lengths, and verify when the Asr condition is met for your preferred convention.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-200/80">
                        <span className="rounded-full border border-white/10 px-3 py-1">{addressLabel}</span>
                        {coordinateLabel && <span className="rounded-full border border-white/10 px-3 py-1">{coordinateLabel}</span>}
                        <span className="rounded-full border border-white/10 px-3 py-1">{methodLabel}</span>
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                            Active: {activeLabel}
                        </span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2 text-sm">
                        <Button onClick={() => setConvention('shafi')} variant={convention === 'shafi' ? 'default' : 'outline'} size="sm">
                            Shāfiʿī (1×)
                        </Button>
                        <Button onClick={() => setConvention('hanafi')} variant={convention === 'hanafi' ? 'default' : 'outline'} size="sm">
                            Ḥanafī (2×)
                        </Button>
                    </div>
                </header>

                <SunStage
                    isAsr={isAsr}
                    madhabLabel={madhabLabel}
                    position={position}
                    shadowRatio={shadowRatio}
                    shadowThreshold={threshold}
                />

                <SolarDetailsPanel
                    isAsr={isAsr}
                    position={position}
                    shadowRatio={shadowRatio}
                    shadowThreshold={threshold}
                    timeZone={timezone}
                    timestamp={timestamp}
                    timings={timetable?.timings ?? []}
                />
            </div>
        </div>
    );
}
