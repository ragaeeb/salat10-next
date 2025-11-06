/**
 * Qibla direction calculation and compass utilities
 */

// Kaaba coordinates (Makkah)
export const KAABA_COORDINATES = { lat: 21.4225241, lon: 39.8261818 };

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
    return angle - 360 * Math.floor(angle / 360);
}

/**
 * Calculate the Qibla bearing from user's location to Kaaba
 * Uses the same formula as adhan-js library
 *
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @returns Bearing in degrees (0-360) from North
 */
export function calculateQibla(userLat: number, userLon: number): number {
    const term1 = Math.sin(toRadians(KAABA_COORDINATES.lon) - toRadians(userLon));
    const term2 = Math.cos(toRadians(userLat)) * Math.tan(toRadians(KAABA_COORDINATES.lat));
    const term3 = Math.sin(toRadians(userLat)) * Math.cos(toRadians(KAABA_COORDINATES.lon) - toRadians(userLon));
    const angle = Math.atan2(term1, term2 - term3);
    return normalizeAngle(toDegrees(angle));
}

/**
 * Smooth heading transition using low-pass filter
 * Handles angle wrap-around (0°/360°)
 *
 * @param current - Current smoothed heading (null on first call)
 * @param target - New raw heading from sensor
 * @param smoothing - Smoothing factor (0-1, higher = smoother but slower)
 * @returns New smoothed heading
 */
export function smoothHeading(current: number | null, target: number, smoothing = 0.3): number {
    if (current === null) {
        return target;
    }

    // Handle angle wrap-around (e.g., 359° -> 1°)
    let diff = target - current;
    if (diff > 180) {
        diff -= 360;
    }
    if (diff < -180) {
        diff += 360;
    }

    return normalizeAngle(current + diff * smoothing);
}

/**
 * Calculate relative rotation needed to point at Qibla
 *
 * @param qiblaBearing - Qibla direction in degrees
 * @param currentHeading - Current device heading in degrees
 * @returns Degrees to rotate (0-360)
 */
export function calculateRelativeRotation(qiblaBearing: number, currentHeading: number): number {
    return normalizeAngle(qiblaBearing - currentHeading);
}

/**
 * Check if device is pointing at Qibla within tolerance
 *
 * @param relativeRotation - Relative rotation in degrees
 * @param tolerance - Acceptable deviation in degrees
 * @returns True if within tolerance
 */
export function isPointingAtQibla(relativeRotation: number, tolerance = 5): boolean {
    return relativeRotation < tolerance || relativeRotation > 360 - tolerance;
}

/**
 * Calculate compass heading quality/stability from history
 *
 * @param headingHistory - Array of recent heading readings
 * @returns Quality descriptor
 */
export function calculateHeadingStability(headingHistory: number[]): { text: string; color: string } | null {
    if (headingHistory.length < 5) {
        return null;
    }

    const recent = headingHistory.slice(-5);
    const variance =
        recent.reduce((acc, val, i, arr) => {
            if (i === 0) {
                return 0;
            }
            let diff = Math.abs(val - arr[i - 1]);
            if (diff > 180) {
                diff = 360 - diff; // Handle wrap-around
            }
            return acc + diff;
        }, 0) / 4;

    if (variance < 2) {
        return { color: 'text-green-400', text: 'Stable' };
    }
    if (variance < 5) {
        return { color: 'text-green-400', text: 'Good' };
    }
    if (variance < 10) {
        return { color: 'text-yellow-400', text: 'Fair' };
    }
    return { color: 'text-red-400', text: 'Unstable' };
}

/**
 * Get heading quality from iOS webkitCompassAccuracy
 *
 * @param accuracy - Accuracy value from iOS (negative is better)
 * @returns Quality descriptor
 */
export function getIOSCompassQuality(accuracy: number): { text: string; color: string } {
    if (accuracy < 0) {
        return { color: 'text-green-400', text: 'Excellent' };
    }
    if (accuracy < 15) {
        return { color: 'text-green-400', text: 'Good' };
    }
    if (accuracy < 25) {
        return { color: 'text-yellow-400', text: 'Fair' };
    }
    return { color: 'text-red-400', text: 'Poor - Calibrate' };
}

/**
 * Detect if running on iOS
 */
export function isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

/**
 * Format direction instruction (left/right)
 *
 * @param relativeRotation - Relative rotation in degrees
 * @returns Formatted direction string
 */
export function formatDirectionInstruction(relativeRotation: number): string {
    if (relativeRotation < 180) {
        return `${Math.round(relativeRotation)}° right`;
    }
    return `${Math.round(360 - relativeRotation)}° left`;
}
