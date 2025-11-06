import { Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import packageJson from '@/../package.json';
import { defaultSettings } from '@/lib/constants';
import { createParameters } from '@/lib/settings';
import type { Settings } from '@/types/settings';

const STORAGE_KEY = packageJson.name;

// Computed prayer data for a specific date
export type ComputedPrayerData = { date: Date; prayerTimes: PrayerTimes; sunnahTimes: SunnahTimes; computedAt: number };

type PrayerStore = {
    // Settings (persisted)
    settings: Settings;

    // Computed prayer data (not persisted)
    currentData: ComputedPrayerData | null;

    // Timeout ID for auto-recomputation
    _timeoutId: NodeJS.Timeout | null;

    // Hydration status
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // Actions
    updateSettings: (updates: Partial<Settings> | ((prev: Settings) => Settings)) => void;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    resetSettings: () => void;
    computePrayerTimes: (forDate?: Date) => void;
    initialize: () => void;

    // Internal
    _scheduleNextUpdate: () => void;
    _clearScheduledUpdate: () => void;
};

// Helper to check if coordinates are valid
const hasValidCoordinates = (settings: Settings): boolean => {
    const lat = Number.parseFloat(settings.latitude);
    const lon = Number.parseFloat(settings.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon);
};

// Helper to compute prayer times for a given date
const computeForDate = (settings: Settings, date: Date): ComputedPrayerData | null => {
    if (!hasValidCoordinates(settings)) {
        return null;
    }

    const lat = Number.parseFloat(settings.latitude);
    const lon = Number.parseFloat(settings.longitude);
    const fajrAngle = Number.parseFloat(settings.fajrAngle);
    const ishaAngle = Number.parseFloat(settings.ishaAngle);
    const ishaInterval = Number.parseFloat(settings.ishaInterval);

    const params = createParameters({
        fajrAngle: Number.isFinite(fajrAngle) ? fajrAngle : 0,
        ishaAngle: Number.isFinite(ishaAngle) ? ishaAngle : 0,
        ishaInterval: Number.isFinite(ishaInterval) ? ishaInterval : 0,
        method: settings.method,
    });

    const coordinates = new Coordinates(lat, lon);
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    return { computedAt: Date.now(), date, prayerTimes, sunnahTimes };
};

// Helper to find the next event time
const findNextEventTime = (data: ComputedPrayerData | null): Date | null => {
    if (!data) {
        return null;
    }

    const now = Date.now();
    const { prayerTimes, sunnahTimes } = data;

    // All possible events in chronological order
    const events = [
        prayerTimes.fajr,
        prayerTimes.sunrise,
        prayerTimes.dhuhr,
        prayerTimes.asr,
        prayerTimes.maghrib,
        prayerTimes.isha,
        sunnahTimes.middleOfTheNight,
        sunnahTimes.lastThirdOfTheNight,
    ].filter((time): time is Date => time instanceof Date);

    // Find the next event that hasn't happened yet
    const nextEvent = events.find((time) => time.getTime() > now);

    // If no next event today, we need tomorrow's Fajr
    if (!nextEvent) {
        const tomorrow = new Date(data.date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // We'll need to compute tomorrow's times, but for now return null
        // The scheduled update will handle this
        return null;
    }

    return nextEvent;
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
            // Track hydration status
            _hasHydrated: false,

            // Schedule the next automatic update
            _scheduleNextUpdate: () => {
                const state = get();

                // Clear any existing timeout
                if (state._timeoutId) {
                    clearTimeout(state._timeoutId);
                }

                const nextTime = findNextEventTime(state.currentData);

                if (!nextTime) {
                    // No next event found, schedule for midnight to compute next day
                    const now = new Date();
                    const midnight = new Date(now);
                    midnight.setHours(24, 0, 0, 0);
                    const msUntilMidnight = midnight.getTime() - now.getTime();

                    const timeoutId = setTimeout(() => {
                        get().computePrayerTimes();
                        get()._scheduleNextUpdate();
                    }, msUntilMidnight);

                    set({ _timeoutId: timeoutId });
                    return;
                }

                // Schedule for the next event
                const now = Date.now();
                const msUntilNext = nextTime.getTime() - now;

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
                const newData = computeForDate(state.settings, targetDate);

                set({ currentData: newData });
            },
            currentData: null,

            // Initialize the store (compute initial prayer times)
            initialize: () => {
                const state = get();
                // Only initialize if we have valid coordinates AND we've hydrated
                if (state._hasHydrated && hasValidCoordinates(state.settings)) {
                    state.computePrayerTimes();
                    state._scheduleNextUpdate();
                }
            },

            // Reset to default settings
            resetSettings: () => {
                set((state) => {
                    if (state._timeoutId) {
                        clearTimeout(state._timeoutId);
                    }

                    const newData = computeForDate(defaultSettings, new Date());

                    return { _timeoutId: null, currentData: newData, settings: defaultSettings };
                });

                get()._scheduleNextUpdate();
            },
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
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
                    const newData = computeForDate(newSettings, new Date());

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
                        state.setHasHydrated(true);
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
export const useHasHydrated = () => usePrayerStore((state) => state._hasHydrated);

// FIXED: Use useShallow for object return to prevent infinite loop
// This returns a new object on each call, so we need useShallow
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

// ALTERNATIVE: Granular selectors (best practice - use these instead if possible)
// These return primitive values and don't need useShallow
export const useFajrAngle = () => usePrayerStore((state) => Number.parseFloat(state.settings.fajrAngle));
export const useIshaAngle = () => usePrayerStore((state) => Number.parseFloat(state.settings.ishaAngle));
export const useIshaInterval = () => usePrayerStore((state) => Number.parseFloat(state.settings.ishaInterval));
export const useLatitude = () => usePrayerStore((state) => Number.parseFloat(state.settings.latitude));
export const useLongitude = () => usePrayerStore((state) => Number.parseFloat(state.settings.longitude));

// Get current prayer (what prayer time is active right now)
export const useCurrentPrayer = () =>
    usePrayerStore((state) => {
        if (!state.currentData) {
            return null;
        }
        return state.currentData.prayerTimes.currentPrayer(new Date());
    });

// Get next prayer
export const useNextPrayer = () =>
    usePrayerStore((state) => {
        if (!state.currentData) {
            return null;
        }
        return state.currentData.prayerTimes.nextPrayer(new Date());
    });
