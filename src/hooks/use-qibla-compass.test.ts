import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useQiblaCompass } from './use-qibla-compass';

describe('useQiblaCompass', () => {
    let originalAddEventListener: typeof window.addEventListener;
    let originalRemoveEventListener: typeof window.removeEventListener;
    let eventListeners: Map<string, EventListener[]>;

    beforeEach(() => {
        eventListeners = new Map();
        originalAddEventListener = window.addEventListener;
        originalRemoveEventListener = window.removeEventListener;

        window.addEventListener = mock((type: string, listener: EventListener) => {
            if (!eventListeners.has(type)) {
                eventListeners.set(type, []);
            }
            eventListeners.get(type)!.push(listener);
        });

        window.removeEventListener = mock((type: string, listener: EventListener) => {
            const listeners = eventListeners.get(type);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        });
    });

    afterEach(() => {
        window.addEventListener = originalAddEventListener;
        window.removeEventListener = originalRemoveEventListener;
        eventListeners.clear();
    });

    describe('initialization', () => {
        it('should return all required properties', () => {
            const { result } = renderHook(() => useQiblaCompass());

            expect(result.current).toHaveProperty('rawHeading');
            expect(result.current).toHaveProperty('smoothedHeading');
            expect(result.current).toHaveProperty('calibrationQuality');
            expect(result.current).toHaveProperty('permissionState');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('headingHistory');
            expect(result.current).toHaveProperty('isIOS');
            expect(result.current).toHaveProperty('requestPermission');
        });

        it('should initialize with default values', () => {
            const { result } = renderHook(() => useQiblaCompass());

            expect(result.current.rawHeading).toBeNull();
            expect(result.current.smoothedHeading).toBeNull();
            expect(result.current.calibrationQuality).toBeNull();
            expect(result.current.permissionState).toBe('prompt');
            expect(result.current.error).toBeNull();
            expect(Array.isArray(result.current.headingHistory)).toBe(true);
            expect(typeof result.current.isIOS).toBe('boolean');
            expect(typeof result.current.requestPermission).toBe('function');
        });
    });

    describe('requestPermission', () => {
        it('should handle iOS permission request', async () => {
            // Mock DeviceOrientationEvent.requestPermission
            const mockRequestPermission = mock(() => Promise.resolve('granted' as PermissionState));
            (DeviceOrientationEvent as any).requestPermission = mockRequestPermission as any;

            const { result } = renderHook(() => useQiblaCompass());

            await act(async () => {
                await result.current.requestPermission();
            });

            await waitFor(() => {
                expect(result.current.permissionState).toBe('granted');
            });

            expect(result.current.error).toBeNull();
        });

        it('should handle permission denial', async () => {
            const mockRequestPermission = mock(() => Promise.resolve('denied' as PermissionState));
            (DeviceOrientationEvent as any).requestPermission = mockRequestPermission as any;

            const { result } = renderHook(() => useQiblaCompass());

            await act(async () => {
                await result.current.requestPermission();
            });

            await waitFor(() => {
                expect(result.current.permissionState).toBe('denied');
            });

            expect(result.current.error).toContain('permission denied');
        });

        it('should handle non-iOS devices (no permission needed)', async () => {
            // Remove requestPermission to simulate non-iOS
            delete (DeviceOrientationEvent as any).requestPermission;

            const { result } = renderHook(() => useQiblaCompass());

            await act(async () => {
                await result.current.requestPermission();
            });

            await waitFor(() => {
                expect(result.current.permissionState).toBe('granted');
            });
        });

        it('should handle permission request errors', async () => {
            const mockRequestPermission = mock(() => Promise.reject(new Error('Permission error')));
            (DeviceOrientationEvent as any).requestPermission = mockRequestPermission as any;

            const { result } = renderHook(() => useQiblaCompass());

            await act(async () => {
                await result.current.requestPermission();
            });

            await waitFor(() => {
                expect(result.current.permissionState).toBe('denied');
            });

            expect(result.current.error).toContain('Motion sensor error');
        });
    });

    describe('heading state', () => {
        it('should maintain heading history array', () => {
            const { result } = renderHook(() => useQiblaCompass());

            expect(Array.isArray(result.current.headingHistory)).toBe(true);
        });

        it('should return correct heading value types', () => {
            const { result } = renderHook(() => useQiblaCompass());

            expect(result.current.rawHeading === null || typeof result.current.rawHeading === 'number').toBe(true);
            expect(result.current.smoothedHeading === null || typeof result.current.smoothedHeading === 'number').toBe(
                true,
            );
            expect(
                result.current.calibrationQuality === null || typeof result.current.calibrationQuality === 'number',
            ).toBe(true);
        });
    });

    describe('cleanup', () => {
        it('should not crash on unmount', () => {
            const { unmount } = renderHook(() => useQiblaCompass());

            // Should not throw
            expect(() => unmount()).not.toThrow();
        });
    });
});
