'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { QiblaArrow } from '@/components/qibla/arrow';
import { QiblaInfoCard } from '@/components/qibla/info-card';
import { PermissionsCard } from '@/components/qibla/permissions-card';
import { useCamera } from '@/hooks/use-camera';
import { useQiblaCompass } from '@/hooks/use-qibla-compass';
import {
    calculateHeadingStability,
    calculateQibla,
    calculateRelativeRotation,
    getIOSCompassQuality,
    isPointingAtQibla,
} from '@/lib/qibla';
import { useHasHydrated, useHasValidCoordinates, useNumericSettings } from '@/store/usePrayerStore';

/**
 * Client-side Qibla AR finder component
 * Loads coordinates from store and manages camera/compass
 */
export function QiblaFinderClient() {
    const hasHydrated = useHasHydrated();
    const hasValidCoordinates = useHasValidCoordinates();
    const { latitude, longitude } = useNumericSettings();
    const router = useRouter();

    const camera = useCamera();
    const compass = useQiblaCompass();

    // Redirect to settings if no valid coordinates AFTER hydration
    useEffect(() => {
        if (hasHydrated && !hasValidCoordinates) {
            router.push('/settings');
        }
    }, [hasHydrated, hasValidCoordinates, router]);

    // Calculate Qibla bearing
    const qiblaBearing = hasValidCoordinates ? calculateQibla(latitude, longitude) : 0;

    // Calculate relative rotation and alignment
    const relativeRotation =
        compass.smoothedHeading === null ? null : calculateRelativeRotation(qiblaBearing, compass.smoothedHeading);

    const isAligned = relativeRotation === null ? false : isPointingAtQibla(relativeRotation);

    // Determine compass quality
    const quality =
        compass.isIOS && compass.calibrationQuality !== null
            ? getIOSCompassQuality(compass.calibrationQuality)
            : calculateHeadingStability(compass.headingHistory);

    // Show calibration prompt if quality is poor
    const showCalibration = quality?.text.includes('Poor') || quality?.text.includes('Unstable');

    // Combined error from camera or compass
    const error = camera.error || compass.error;

    // Show loading state until hydration completes
    if (!hasHydrated) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="text-center text-white">
                    <div className="mb-4 text-lg">Loading...</div>
                </div>
            </div>
        );
    }

    // Don't render if no valid coordinates (will redirect)
    if (!hasValidCoordinates) {
        return null;
    }

    return (
        <>
            {/* Camera feed */}
            <video ref={camera.videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />

            {/* Dark overlay for better visibility */}
            <div className="absolute inset-0 bg-black/20" />

            {/* AR Arrow overlay */}
            <QiblaArrow relativeRotation={relativeRotation} isAligned={isAligned} />

            {/* Status cards */}
            <div className="absolute top-20 right-4 left-4 z-10 space-y-2">
                {/* Permissions */}
                <PermissionsCard
                    cameraGranted={camera.isReady}
                    orientationState={compass.permissionState}
                    onRequestOrientation={compass.requestPermission}
                />

                {/* Info card - only show when compass is active */}
                {compass.permissionState === 'granted' && (
                    <QiblaInfoCard
                        qiblaBearing={qiblaBearing}
                        currentHeading={compass.smoothedHeading}
                        relativeRotation={relativeRotation}
                        isAligned={isAligned}
                        quality={quality}
                        latitude={latitude}
                        longitude={longitude}
                    />
                )}

                {/* Error message */}
                {error && (
                    <div className="rounded-lg bg-red-900/70 p-4 text-sm text-white backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Calibration instructions */}
            {showCalibration && (
                <div className="absolute right-4 bottom-24 left-4 rounded-lg bg-yellow-900/70 p-4 text-sm text-white backdrop-blur-md">
                    <div className="mb-1 font-semibold">Compass Calibration Needed</div>
                    <div className="text-white/80">
                        Move your device in a figure-8 pattern to calibrate the compass sensor.
                    </div>
                </div>
            )}
        </>
    );
}
