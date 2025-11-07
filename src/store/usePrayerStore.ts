import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import packageJson from '@/../package.json';
import { defaultSettings } from '@/lib/constants';
import { computePrayerTimesForDate, getMillisecondsUntilNextUpdate, hasValidCoordinates } from '@/lib/store-utils';
import type { ComputedPrayerData } from '@/types/prayer';
import type { Settings } from '@/types/settings';

const STORAGE_KEY = packageJson.name;

type PrayerStore = {
    // Persisted state
    settings: Settings;

    // Computed state (not persisted)
    currentData: ComputedPrayerData | null;
    hasHydrated: boolean;

    // Internal state for auto-updates
    _timeoutId: NodeJS.Timeout | null;

    // Actions
    updateSettings: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    resetSettings: () => void;
    computePrayerTimes: (forDate?: Date) => void;

    // Internal
    _scheduleNextUpdate: () => void;
    _clearScheduledUpdate: () => void;
};

export const usePrayerStore = create<PrayerStore>()(
    persist(
        (set, get) => ({
            // Clear scheduled update
            _clearScheduledUpdate: () => {
                const state = get();
                if (state._timeoutId) {
                    clearTimeout(state._timeoutId);
                    set({ _timeoutId: null });
                }
            },

            // Schedule the next automatic update
            _scheduleNextUpdate: () => {
                const state = get();

                // Clear any existing timeout
                if (state._timeoutId) {
                    clearTimeout(state._timeoutId);
                }

                const msUntilNext = getMillisecondsUntilNextUpdate(state.currentData);

                if (msUntilNext > 0) {
                    const timeoutId = setTimeout(() => {
                        get().computePrayerTimes();
                        get()._scheduleNextUpdate();
                    }, msUntilNext);

                    set({ _timeoutId: timeoutId });
                }
            },
            _timeoutId: null,

            // Compute prayer times for a given date (or current date)
            computePrayerTimes: (forDate) => {
                const state = get();
                const targetDate = forDate ?? new Date();
                const newData = computePrayerTimesForDate(state.settings, targetDate);
                set({ currentData: newData });
            },
            currentData: null,
            hasHydrated: false,

            // Reset to default settings
            resetSettings: () => {
                set((state) => {
                    if (state._timeoutId) {
                        clearTimeout(state._timeoutId);
                    }

                    const newData = computePrayerTimesForDate(defaultSettings, new Date());

                    return { _timeoutId: null, currentData: newData, settings: defaultSettings };
                });

                get()._scheduleNextUpdate();
            },
            // Initial state
            settings: defaultSettings,

            // Update a single setting
            updateSetting: (key, value) => {
                get().updateSettings({ [key]: value });
            },

            // Update multiple settings at once
            updateSettings: (updates) => {
                set((state) => {
                    // Support both object and function updater
                    const newSettings =
                        typeof updates === 'function' ? updates(state.settings) : { ...state.settings, ...updates };
                    const newData = computePrayerTimesForDate(newSettings, new Date());

                    // Clear and reschedule
                    if (state._timeoutId) {
                        clearTimeout(state._timeoutId);
                    }

                    return { _timeoutId: null, currentData: newData, settings: newSettings };
                });

                // Schedule next update
                get()._scheduleNextUpdate();
            },
        }),
        {
            name: STORAGE_KEY,
            onRehydrateStorage: () => {
                return (state) => {
                    if (state) {
                        // Mark as hydrated
                        state.hasHydrated = true;

                        // After hydration, initialize if we have valid coordinates
                        if (hasValidCoordinates(state.settings)) {
                            state.computePrayerTimes();
                            state._scheduleNextUpdate();
                        }
                    }
                };
            },
            // Only persist settings, not computed data
            partialize: (state) => ({ settings: state.settings }),
        },
    ),
);

// Selector hooks for common derived values
export const useSettings = () => usePrayerStore((state) => state.settings);
export const useCurrentData = () => usePrayerStore((state) => state.currentData);
export const useHasValidCoordinates = () => usePrayerStore((state) => hasValidCoordinates(state.settings));
export const useHasHydrated = () => usePrayerStore((state) => state.hasHydrated);

// Use useShallow for object returns to prevent unnecessary re-renders
export const useNumericSettings = () =>
    usePrayerStore(
        useShallow((state) => ({
            fajrAngle: Number.parseFloat(state.settings.fajrAngle),
            ishaAngle: Number.parseFloat(state.settings.ishaAngle),
            ishaInterval: Number.parseFloat(state.settings.ishaInterval),
            latitude: Number.parseFloat(state.settings.latitude),
            longitude: Number.parseFloat(state.settings.longitude),
        })),
    );

// Granular selectors (return primitive values - don't need useShallow)
export const useFajrAngle = () => usePrayerStore((state) => Number.parseFloat(state.settings.fajrAngle));
export const useIshaAngle = () => usePrayerStore((state) => Number.parseFloat(state.settings.ishaAngle));
export const useIshaInterval = () => usePrayerStore((state) => Number.parseFloat(state.settings.ishaInterval));
export const useLatitude = () => usePrayerStore((state) => Number.parseFloat(state.settings.latitude));
export const useLongitude = () => usePrayerStore((state) => Number.parseFloat(state.settings.longitude));
