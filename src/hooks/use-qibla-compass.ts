import { useCallback, useEffect, useRef, useState } from 'react';
import { isIOSDevice, smoothHeading } from '@/lib/qibla';

export type PermissionState = 'prompt' | 'granted' | 'denied';

interface CompassState {
    rawHeading: number | null;
    smoothedHeading: number | null;
    calibrationQuality: number | null;
    permissionState: PermissionState;
    error: string | null;
}

// Type for iOS DeviceOrientationEvent with requestPermission
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
    requestPermission?: () => Promise<PermissionState>;
}

/**
 * Hook to manage device compass/orientation sensor for Qibla direction
 *
 * Handles platform-specific differences between iOS and Android DeviceOrientation APIs.
 * iOS uses webkitCompassHeading and requires explicit permission (iOS 13+).
 * Android/Desktop uses deviceorientationabsolute with alpha rotation.
 *
 * Provides raw heading, smoothed heading for UI stability, and calibration quality
 * indicators where available.
 *
 * @returns Compass state and control functions
 * @property {number | null} rawHeading - Raw compass heading in degrees (0-360, 0=North)
 * @property {number | null} smoothedHeading - Smoothed heading for stable UI rendering
 * @property {number | null} calibrationQuality - iOS calibration accuracy in degrees, or null
 * @property {PermissionState} permissionState - Current permission state ('prompt' | 'granted' | 'denied')
 * @property {string | null} error - Error message if sensor access fails
 * @property {number[]} headingHistory - Recent heading values for stability detection
 * @property {boolean} isIOS - True if running on iOS device
 * @property {() => Promise<void>} requestPermission - Request orientation permission (required for iOS)
 *
 * @example
 * ```tsx
 * const { smoothedHeading, permissionState, requestPermission, error } = useQiblaCompass();
 *
 * if (permissionState === 'prompt') {
 *   return <button onClick={requestPermission}>Enable Compass</button>;
 * }
 *
 * return (
 *   <div style={{ transform: `rotate(${smoothedHeading}deg)` }}>
 *     <CompassArrow />
 *   </div>
 * );
 * ```
 */
export function useQiblaCompass() {
    const [state, setState] = useState<CompassState>({
        calibrationQuality: null,
        error: null,
        permissionState: 'prompt',
        rawHeading: null,
        smoothedHeading: null,
    });

    const orientationHandlerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
    const headingHistoryRef = useRef<number[]>([]);
    const isIOS = useRef(isIOSDevice());

    // Setup orientation listener
    const setupOrientationListener = useCallback(() => {
        const handler = (event: DeviceOrientationEvent) => {
            let heading: number | null = null;
            let quality: number | null = null;

            if (isIOS.current) {
                // iOS: use webkitCompassHeading
                const iosEvent = event as DeviceOrientationEvent & {
                    webkitCompassHeading?: number;
                    webkitCompassAccuracy?: number;
                };
                if (iosEvent.webkitCompassHeading !== undefined) {
                    heading = iosEvent.webkitCompassHeading;
                    quality = iosEvent.webkitCompassAccuracy ?? null;
                }
            } else {
                // Android/Desktop: use deviceorientationabsolute
                if (event.absolute && event.alpha !== null) {
                    // Convert alpha to compass heading
                    heading = (360 - event.alpha) % 360;
                } else if (event.alpha !== null) {
                    // Fallback for non-absolute
                    heading = (360 - event.alpha) % 360;
                }
            }

            if (heading !== null) {
                setState((prev) => ({ ...prev, calibrationQuality: quality, rawHeading: heading }));

                // Keep heading history for stability detection
                headingHistoryRef.current.push(heading);
                if (headingHistoryRef.current.length > 10) {
                    headingHistoryRef.current.shift();
                }
            }
        };

        orientationHandlerRef.current = handler;

        if (isIOS.current) {
            window.addEventListener('deviceorientation', handler, true);
        } else {
            window.addEventListener('deviceorientationabsolute', handler, true);
            // Fallback for browsers without absolute
            window.addEventListener('deviceorientation', handler, true);
        }
    }, []);

    // Request orientation permission (primarily for iOS)
    const requestPermission = useCallback(async () => {
        try {
            // Check if requestPermission exists (iOS 13+)
            const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;

            if (
                typeof DeviceOrientationEventTyped !== 'undefined' &&
                typeof DeviceOrientationEventTyped.requestPermission === 'function'
            ) {
                const response = await DeviceOrientationEventTyped.requestPermission();

                if (response === 'granted') {
                    setState((prev) => ({ ...prev, error: null, permissionState: 'granted' }));
                    setupOrientationListener();
                } else {
                    setState((prev) => ({
                        ...prev,
                        error: 'Device orientation permission denied',
                        permissionState: 'denied',
                    }));
                }
            } else {
                // Non-iOS or older iOS - no permission needed
                setState((prev) => ({ ...prev, error: null, permissionState: 'granted' }));
                setupOrientationListener();
            }
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: `Motion sensor error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                permissionState: 'denied',
            }));
        }
    }, [setupOrientationListener]);

    // Smooth heading updates
    useEffect(() => {
        if (state.rawHeading !== null) {
            setState((prev) => ({
                ...prev,
                smoothedHeading: smoothHeading(prev.smoothedHeading, state.rawHeading!, 0.3),
            }));
        }
    }, [state.rawHeading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (orientationHandlerRef.current) {
                window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
                window.removeEventListener('deviceorientationabsolute', orientationHandlerRef.current, true);
            }
        };
    }, []);

    return { ...state, headingHistory: headingHistoryRef.current, isIOS: isIOS.current, requestPermission };
}
