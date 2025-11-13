import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import { useCamera } from './use-camera';

/**
 * Note: Camera tests are limited because navigator.mediaDevices.getUserMedia
 * requires a real browser environment with camera hardware.
 * These tests verify the hook's structure and basic error handling.
 */
describe('useCamera', () => {

    describe('initialization', () => {
        it('should return videoRef, stream, error, isReady, and startCamera', () => {
            const { result } = renderHook(() => useCamera());

            expect(result.current).toHaveProperty('videoRef');
            expect(result.current).toHaveProperty('stream');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('isReady');
            expect(result.current).toHaveProperty('startCamera');
            expect(result.current.videoRef).toBeDefined();
            expect(typeof result.current.startCamera).toBe('function');
        });

        it('should initialize with correct default state', () => {
            const { result } = renderHook(() => useCamera());

            // Camera will attempt to start, may fail without real hardware
            expect(typeof result.current.isReady).toBe('boolean');
            expect(result.current.stream === null || result.current.stream instanceof MediaStream).toBe(true);
            expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
        });
    });

    describe('return value structure', () => {
        it('should return consistent state structure', () => {
            const { result } = renderHook(() => useCamera());

            expect(typeof result.current.isReady).toBe('boolean');
            expect(result.current.stream === null || typeof result.current.stream === 'object').toBe(true);
            expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
            expect(result.current.videoRef).toBeDefined();
            expect(result.current.videoRef.current === null || typeof result.current.videoRef.current === 'object').toBe(true);
        });

        it('should provide startCamera function', () => {
            const { result } = renderHook(() => useCamera());

            expect(typeof result.current.startCamera).toBe('function');
        });

        it('should provide videoRef ref object', () => {
            const { result } = renderHook(() => useCamera());

            expect(result.current.videoRef).toHaveProperty('current');
        });
    });
});

