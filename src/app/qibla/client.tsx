'use client';

import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { QiblaArrow } from '@/components/qibla/arrow';
import { QiblaInfoCard } from '@/components/qibla/info-card';
import { PermissionsCard } from '@/components/qibla/permissions-card';
import { useCamera } from '@/hooks/use-camera';
import { useQiblaCompass } from '@/hooks/use-qibla-compass';
import {
    calculateHeadingStability,
    calculateRelativeRotation,
    getIOSCompassQuality,
    isPointingAtQibla,
} from '@/lib/qibla';

interface QiblaFinderClientProps {
    qiblaBearing: number;
    latitude: number;
    longitude: number;
}

/**
 * Client-side Qibla AR finder component
 * Manages camera, compass, and AR overlay
 */
export function QiblaFinderClient({ qiblaBearing, latitude, longitude }: QiblaFinderClientProps) {
    const camera = useCamera();
    const compass = useQiblaCompass();

    // Calculate relative rotation and alignment
    const relativeRotation = useMemo(() => {
        if (compass.smoothedHeading === null) {
            return null;
        }
        return calculateRelativeRotation(qiblaBearing, compass.smoothedHeading);
    }, [qiblaBearing, compass.smoothedHeading]);

    const isAligned = useMemo(() => {
        if (relativeRotation === null) {
            return false;
        }
        return isPointingAtQibla(relativeRotation);
    }, [relativeRotation]);

    // Determine compass quality
    const quality = useMemo(() => {
        // iOS: use webkitCompassAccuracy if available
        if (compass.isIOS && compass.calibrationQuality !== null) {
            return getIOSCompassQuality(compass.calibrationQuality);
        }
        // Android/other: calculate from heading stability
        return calculateHeadingStability(compass.headingHistory);
    }, [compass.isIOS, compass.calibrationQuality, compass.headingHistory]);

    // Show calibration prompt if quality is poor
    const showCalibration = quality?.text.includes('Poor') || quality?.text.includes('Unstable');

    // Combined error from camera or compass
    const error = camera.error || compass.error;

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

                {/* Error message - inline since it's so simple */}
                {error && (
                    <div className="rounded-lg bg-red-900/70 p-4 text-sm text-white backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Calibration instructions - inline since it's so simple */}
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
