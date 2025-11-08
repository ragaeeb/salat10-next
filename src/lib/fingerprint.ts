/**
 * Generate a persistent unique user ID using Web Crypto API
 * This ID persists across sessions until localStorage is cleared
 *
 * @returns 32-character hex string
 */
export function generateUniqueUserId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a persistent user ID from localStorage
 *
 * @returns User ID string
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
        // Fallback if localStorage unavailable
        return generateUniqueUserId();
    }
}

/**
 * Get device metadata for analytics
 * Collected once per session/flush, not on every event
 *
 * @returns Device metadata object
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
