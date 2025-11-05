import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import packageJson from '@/../package.json';
import { defaultSettings } from '@/lib/constants';
import type { Settings } from '@/types/settings';

const STORAGE_KEY = packageJson.name;

// Load once at module level
const loadSettings = (): Settings => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<Settings>;
            return { ...defaultSettings, ...parsed };
        }
    } catch (error) {
        console.warn('Failed to read stored settings', error);
    }
    return defaultSettings;
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(loadSettings);
    const initialLoadRef = useRef(true);

    // Save to localStorage on changes (skip initial render)
    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
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
        [settings],
    );

    return { numeric, resetSettings, setSettings, settings, updateSetting };
};
