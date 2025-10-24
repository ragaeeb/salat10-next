'use client';

import { Coordinates } from 'adhan';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PrayerTimeExplanation } from '@/lib/explanation/types';
import type { MethodValue } from '@/lib/settings';
import { createParameters } from '@/lib/settings';

let explanationModulePromise: Promise<typeof import('@/lib/explanation')> | null = null;

const preloadExplanationModule = () => {
    if (!explanationModulePromise) {
        explanationModulePromise = import('@/lib/explanation');
    }
    return explanationModulePromise;
};

export type ExplanationDependencies = {
    address: string;
    coordinates: { latitude: number; longitude: number };
    date: Date;
    fajrAngle: number;
    hasValidCoordinates: boolean;
    ishaAngle: number;
    ishaInterval: number;
    method: MethodValue;
    timeZone: string;
};

export type ExplanationState = {
    closeExplanation: () => void;
    explanation: PrayerTimeExplanation | null;
    loading: boolean;
    openExplanation: () => void;
    showExplanation: boolean;
};

const serializeKey = (options: ExplanationDependencies) =>
    [
        options.address,
        options.coordinates.latitude,
        options.coordinates.longitude,
        options.date.toISOString(),
        options.fajrAngle,
        options.ishaAngle,
        options.ishaInterval,
        options.method,
        options.timeZone,
    ].join('|');

/**
 * Provides a cached, lazily-resolved explanation bundle for the current calculation inputs.
 */
export const usePrayerExplanation = ({
    address,
    coordinates,
    date,
    fajrAngle,
    hasValidCoordinates,
    ishaAngle,
    ishaInterval,
    method,
    timeZone,
}: ExplanationDependencies): ExplanationState => {
    const [showExplanation, setShowExplanation] = useState(false);
    const [explanation, setExplanation] = useState<PrayerTimeExplanation | null>(null);
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef(new Map<string, PrayerTimeExplanation>());

    const key = useMemo(
        () =>
            serializeKey({
                address,
                coordinates,
                date,
                fajrAngle,
                hasValidCoordinates,
                ishaAngle,
                ishaInterval,
                method,
                timeZone,
            }),
        [address, coordinates, date, fajrAngle, hasValidCoordinates, ishaAngle, ishaInterval, method, timeZone],
    );

    useEffect(() => {
        preloadExplanationModule().catch((error) => {
            console.warn('Unable to preload explanations', error);
        });
    }, []);

    useEffect(() => {
        if (!showExplanation) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowExplanation(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExplanation]);

    useEffect(() => {
        if (!showExplanation) {
            return;
        }
        if (!hasValidCoordinates) {
            setExplanation(null);
            setLoading(false);
            return;
        }

        const cached = cacheRef.current.get(key);
        if (cached) {
            setExplanation(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setExplanation(null);

        const build = async () => {
            const { buildPrayerTimeExplanation } = await preloadExplanationModule();
            if (cancelled) {
                return;
            }
            const parameters = createParameters({ fajrAngle, ishaAngle, ishaInterval, method });
            const story = buildPrayerTimeExplanation({
                address,
                coordinates: new Coordinates(coordinates.latitude, coordinates.longitude),
                date,
                parameters,
                timeZone,
            });
            cacheRef.current.set(key, story);
            if (!cancelled) {
                setExplanation(story);
                setLoading(false);
            }
        };

        void build();

        return () => {
            cancelled = true;
        };
    }, [
        address,
        coordinates.latitude,
        coordinates.longitude,
        date,
        fajrAngle,
        hasValidCoordinates,
        ishaAngle,
        ishaInterval,
        key,
        method,
        showExplanation,
        timeZone,
    ]);

    useEffect(() => {
        if (showExplanation && !loading && (!explanation || explanation.steps.length === 0)) {
            setShowExplanation(false);
        }
    }, [explanation, loading, showExplanation]);

    const openExplanation = useCallback(() => setShowExplanation(true), []);
    const closeExplanation = useCallback(() => setShowExplanation(false), []);

    return { closeExplanation, explanation, loading, openExplanation, showExplanation };
};
