/**
 * Generate a persistent unique user ID using Web Crypto API
 * Creates a cryptographically random 32-character hex string
 * Persists across sessions until localStorage is cleared
 *
 * @returns 32-character hex string (16 random bytes encoded as hex)
 */
export function generateUniqueUserId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a persistent user ID from localStorage
 * User ID persists across sessions and tabs
 * Falls back to generating new ID if localStorage unavailable
 *
 * @returns User ID string (32 hex characters)
 */
export function getOrCreateUserId(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const STORAGE_KEY = 'salat10_user_id';

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return stored;
        }

        const newId = generateUniqueUserId();
        localStorage.setItem(STORAGE_KEY, newId);
        return newId;
    } catch {
        return generateUniqueUserId();
    }
}

/**
 * Collect device metadata for analytics
 * Gathered once per session/flush, not on every event
 * Used for understanding user environment without tracking identity
 *
 * Collected data:
 * - Browser language and supported languages
 * - Screen resolution
 * - Timezone
 * - Platform/OS
 * - User agent string
 * - Cookie support status
 *
 * @returns Object with device metadata
 */
export function getDeviceMetadata() {
    if (typeof window === 'undefined') {
        return {};
    }

    return {
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        languages: navigator.languages?.join(','),
        platform: navigator.platform,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
    };
}
