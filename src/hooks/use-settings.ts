import { useCallback, useEffect, useMemo, useState } from 'react';

import packageJson from '@/../package.json';
import { defaultSettings } from '@/lib/constants';
import type { Settings } from '@/types/settings';

const STORAGE_KEY = packageJson.name;

const mergeSettings = (stored: Partial<Settings> | null): Settings => ({
    ...defaultSettings,
    ...stored,
    ishaInterval: stored?.ishaInterval ?? defaultSettings.ishaInterval,
});

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<Settings>;
                setSettings(mergeSettings(parsed));
            } else {
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.warn('Failed to read stored settings', error);
            setSettings(defaultSettings);
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated || typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [hydrated, settings]);

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateSettings = useCallback((updater: Settings | ((prev: Settings) => Settings)) => {
        setSettings((prev) =>
            typeof updater === 'function' ? (updater as (prev: Settings) => Settings)(prev) : updater,
        );
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, []);

    const numeric = useMemo(
        () => ({
            fajrAngle: Number.parseFloat(settings.fajrAngle),
            ishaAngle: Number.parseFloat(settings.ishaAngle),
            ishaInterval: Number.parseFloat(settings.ishaInterval),
            latitude: Number.parseFloat(settings.latitude),
            longitude: Number.parseFloat(settings.longitude),
        }),
        [settings.fajrAngle, settings.ishaAngle, settings.ishaInterval, settings.latitude, settings.longitude],
    );

    return { hydrated, numeric, resetSettings, setSettings: updateSettings, settings, updateSetting };
};
