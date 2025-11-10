import { useEffect, useMemo, useState } from 'react';
import { getSolarPosition, type SolarPosition } from '@/lib/solar-position';

type UseSolarPositionOptions = {
    /** Latitude in degrees */
    latitude: number;
    /** Longitude in degrees */
    longitude: number;
    /** How often to refresh calculations (ms). Defaults to 15 seconds. */
    refreshMs?: number;
};

type UseSolarPositionResult = {
    /** Latest solar position or null when coordinates are invalid */
    position: SolarPosition | null;
    /** Timestamp of last calculation */
    timestamp: Date | null;
};

/**
 * Continuously track the apparent solar position for given coordinates.
 *
 * Polls at a configurable interval (default 15s) and returns altitude/azimuth
 * data suitable for visualisations and shadow modelling. Automatically
 * suspends when coordinates are invalid.
 *
 * @param options - Observer coordinates and refresh rate
 * @returns Latest solar position and timestamp
 */
export function useSolarPosition({ latitude, longitude, refreshMs = 15000 }: UseSolarPositionOptions): UseSolarPositionResult {
    const hasValidCoordinates = useMemo(() => Number.isFinite(latitude) && Number.isFinite(longitude), [latitude, longitude]);
    const [position, setPosition] = useState<SolarPosition | null>(() => {
        if (!hasValidCoordinates) {
            return null;
        }
        return getSolarPosition({ coordinates: { latitude, longitude }, date: new Date() });
    });
    const [timestamp, setTimestamp] = useState<Date | null>(() => (position ? new Date() : null));

    useEffect(() => {
        if (!hasValidCoordinates) {
            setPosition(null);
            setTimestamp(null);
            return;
        }
        if (typeof window === 'undefined') {
            return;
        }

        let frame = 0;
        let timeout: number | null = null;

        const update = () => {
            const now = new Date();
            setPosition(getSolarPosition({ coordinates: { latitude, longitude }, date: now }));
            setTimestamp(now);
            timeout = window.setTimeout(() => {
                frame = window.requestAnimationFrame(update);
            }, refreshMs);
        };

        frame = window.requestAnimationFrame(update);

        return () => {
            if (timeout) {
                window.clearTimeout(timeout);
            }
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [hasValidCoordinates, latitude, longitude, refreshMs]);

    return { position, timestamp };
}
