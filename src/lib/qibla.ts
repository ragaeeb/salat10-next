/**
 * Kaaba coordinates in Makkah, Saudi Arabia
 * Used as the destination point for Qibla calculations
 */
export const KAABA_COORDINATES = { lat: 21.4225241, lon: 39.8261818 };

/**
 * Convert degrees to radians for trigonometric calculations
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 *
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Normalize angle to 0-360 degree range
 * Handles negative angles and angles > 360
 *
 * @param angle - Input angle in degrees
 * @returns Normalized angle between 0 and 360
 */
export function normalizeAngle(angle: number): number {
    return angle - 360 * Math.floor(angle / 360);
}

/**
 * Calculate the Qibla bearing from user's location to Kaaba
 * Uses great circle formula (same as adhan-js library)
 *
 * Formula: θ = atan2(sin(Δλ), cos(φ₁)⋅tan(φ₂) - sin(φ₁)⋅cos(Δλ))
 * where φ is latitude, λ is longitude
 *
 * @param userLat - User's latitude in degrees
 * @param userLon - User's longitude in degrees
 * @returns Bearing in degrees (0-360) from North to Kaaba
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
 * Reduces jitter from sensor readings while maintaining responsiveness
 * Handles angle wrap-around at 0°/360° boundary
 *
 * @param current - Current smoothed heading, null on first call
 * @param target - New raw heading from sensor
 * @param smoothing - Smoothing factor (0-1), higher = smoother but slower response
 * @returns New smoothed heading in degrees
 */
export function smoothHeading(current: number | null, target: number, smoothing = 0.3): number {
    if (current === null) {
        return target;
    }

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
 * Returns the angle the device needs to rotate clockwise
 *
 * @param qiblaBearing - Qibla direction in degrees from North
 * @param currentHeading - Current device heading in degrees
 * @returns Degrees to rotate clockwise (0-360)
 */
export function calculateRelativeRotation(qiblaBearing: number, currentHeading: number): number {
    return normalizeAngle(qiblaBearing - currentHeading);
}

/**
 * Check if device is pointing at Qibla within acceptable tolerance
 * Considers both small positive angles and angles near 360° (wrap-around)
 *
 * @param relativeRotation - Relative rotation in degrees (0-360)
 * @param tolerance - Acceptable deviation in degrees (default 5°)
 * @returns True if device is pointing within tolerance of Qibla
 */
export function isPointingAtQibla(relativeRotation: number, tolerance = 5): boolean {
    return relativeRotation < tolerance || relativeRotation > 360 - tolerance;
}

/**
 * Calculate compass heading quality/stability from recent readings
 * Analyzes variance in heading changes to determine stability
 * Handles angle wrap-around at 0°/360° boundary
 *
 * @param headingHistory - Array of recent heading readings (needs at least 5)
 * @returns Quality descriptor with text and color, or null if insufficient data
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
            let diff = Math.abs(val - arr[i - 1]!);
            if (diff > 180) {
                diff = 360 - diff;
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
 * Interpret iOS webkitCompassAccuracy value as quality descriptor
 * Lower accuracy values indicate better precision
 * Negative values indicate excellent calibration
 *
 * @param accuracy - Accuracy value from iOS DeviceOrientation event
 * @returns Quality descriptor with text and color
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
 * Detect if the current device is running iOS
 *
 * @returns True if running on iPad, iPhone, or iPod
 */
export function isIOSDevice(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

/**
 * Format direction instruction for user (left/right rotation)
 * Chooses shorter rotation direction and formats as readable text
 *
 * @param relativeRotation - Relative rotation in degrees (0-360)
 * @returns Formatted string like "45° right" or "30° left"
 */
export function formatDirectionInstruction(relativeRotation: number): string {
    if (relativeRotation < 180) {
        return `${Math.round(relativeRotation)}° right`;
    }
    return `${Math.round(360 - relativeRotation)}° left`;
}
