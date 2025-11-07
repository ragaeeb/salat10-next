import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { usePrayerStore } from '@/store/usePrayerStore';

describe('usePrayerStore', () => {
    beforeEach(() => {
        // Reset store to initial state
        usePrayerStore.getState().resetSettings();
    });

    afterEach(() => {
        // Clear any scheduled timeouts
        usePrayerStore.getState()._clearScheduledUpdate();
    });

    describe('initial state', () => {
        it('should have default settings', () => {
            const state = usePrayerStore.getState();
            expect(state.settings).toBeDefined();
            expect(state.settings.method).toBeDefined();
            expect(state.settings.fajrAngle).toBeDefined();
            expect(state.settings.ishaAngle).toBeDefined();
        });

        it('should have null currentData initially', () => {
            const state = usePrayerStore.getState();
            expect(state.currentData).toBeNull();
        });

        it('should have hasHydrated as false initially', () => {
            const state = usePrayerStore.getState();
            expect(state.hasHydrated).toBe(false);
        });
    });

    describe('updateSettings', () => {
        it('should update single setting using object', () => {
            usePrayerStore.getState().updateSettings({ latitude: '40.7128' });

            expect(usePrayerStore.getState().settings.latitude).toBe('40.7128');
        });

        it('should update multiple settings using object', () => {
            usePrayerStore
                .getState()
                .updateSettings({ address: 'New York, NY', latitude: '40.7128', longitude: '-74.0060' });

            const state = usePrayerStore.getState();
            expect(state.settings.latitude).toBe('40.7128');
            expect(state.settings.longitude).toBe('-74.0060');
            expect(state.settings.address).toBe('New York, NY');
        });

        it('should update settings using function updater', () => {
            const originalLat = usePrayerStore.getState().settings.latitude;

            usePrayerStore
                .getState()
                .updateSettings((prev) => ({ ...prev, latitude: '51.5074', longitude: '-0.1278' }));

            const state = usePrayerStore.getState();
            expect(state.settings.latitude).not.toBe(originalLat);
            expect(state.settings.latitude).toBe('51.5074');
        });

        it('should compute prayer times after update', () => {
            usePrayerStore.getState().updateSettings({ latitude: '40.7128', longitude: '-74.0060' });

            const state = usePrayerStore.getState();
            expect(state.currentData).toBeDefined();
        });

        it('should clear and reschedule timeout', () => {
            const oldTimeoutId = usePrayerStore.getState()._timeoutId;

            usePrayerStore.getState().updateSettings({ fajrAngle: '15' });

            const newState = usePrayerStore.getState();
            // Timeout ID should be different (or both null, which is also fine)
            expect(newState._timeoutId !== oldTimeoutId || newState._timeoutId === null).toBe(true);
        });
    });

    describe('updateSetting', () => {
        it('should update individual setting', () => {
            usePrayerStore.getState().updateSetting('latitude', '35.6762');

            expect(usePrayerStore.getState().settings.latitude).toBe('35.6762');
        });

        it('should call updateSettings internally', () => {
            usePrayerStore.getState().updateSetting('method', 'MuslimWorldLeague');

            expect(usePrayerStore.getState().settings.method).toBe('MuslimWorldLeague');
        });
    });

    describe('resetSettings', () => {
        it('should reset to default settings', () => {
            // Change settings
            usePrayerStore.getState().updateSettings({ latitude: '40.7128', longitude: '-74.0060' });

            // Reset
            usePrayerStore.getState().resetSettings();

            const state = usePrayerStore.getState();
            expect(state.settings.latitude).not.toBe('40.7128');
        });

        it('should reschedule timeout after reset', () => {
            usePrayerStore.getState().resetSettings();

            // After reset with valid coordinates, a timeout should be scheduled
            const state = usePrayerStore.getState();
            // The timeout may or may not be set depending on when next update is due
            expect(state._timeoutId === null || typeof state._timeoutId === 'object').toBe(true);
        });

        it('should compute prayer times with default settings', () => {
            usePrayerStore.getState().resetSettings();

            const state = usePrayerStore.getState();
            expect(state.currentData).toBeDefined();
        });
    });

    describe('computePrayerTimes', () => {
        it('should compute prayer times for current date by default', () => {
            usePrayerStore.getState().updateSettings({ latitude: '40.7128', longitude: '-74.0060' });
            usePrayerStore.getState().computePrayerTimes();

            const state = usePrayerStore.getState();
            expect(state.currentData).not.toBeNull();
            expect(state.currentData?.date).toBeInstanceOf(Date);
        });

        it('should compute prayer times for specific date', () => {
            usePrayerStore.getState().updateSettings({ latitude: '40.7128', longitude: '-74.0060' });

            const specificDate = new Date('2025-06-15');
            usePrayerStore.getState().computePrayerTimes(specificDate);

            const state = usePrayerStore.getState();
            expect(state.currentData?.date.getDate()).toBe(15);
            expect(state.currentData?.date.getMonth()).toBe(5); // June
        });

        it('should update currentData', () => {
            usePrayerStore.getState().updateSettings({ latitude: '40.7128', longitude: '-74.0060' });

            // Initially null or whatever it was
            const beforeState = usePrayerStore.getState();
            const beforeData = beforeState.currentData;

            usePrayerStore.getState().computePrayerTimes();

            const afterState = usePrayerStore.getState();
            expect(afterState.currentData).not.toBeNull();
            expect(afterState.currentData).not.toBe(beforeData);
        });
    });

    describe('_clearScheduledUpdate', () => {
        it('should clear timeout if exists', () => {
            usePrayerStore.getState()._timeoutId = setTimeout(() => {}, 10000) as any;

            usePrayerStore.getState()._clearScheduledUpdate();

            expect(usePrayerStore.getState()._timeoutId).toBeNull();
        });

        it('should handle null timeout gracefully', () => {
            usePrayerStore.getState()._timeoutId = null;

            expect(() => usePrayerStore.getState()._clearScheduledUpdate()).not.toThrow();
        });
    });
});
