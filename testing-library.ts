import { afterEach, expect } from 'bun:test';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

// Ensure window.event exists before cleanup runs
// React Testing Library's cleanup tries to access window.event
if (typeof window !== 'undefined' && !window.event) {
    Object.defineProperty(window, 'event', {
        value: undefined,
        writable: true,
        configurable: true,
    });
}

// Optional: cleans up `render` after each test
// Only cleanup if window is available (HappyDOM should provide it)
afterEach(() => {
    if (typeof window !== 'undefined') {
        try {
            cleanup();
        } catch (error) {
            // Ignore cleanup errors - they're often harmless
            // and related to React Testing Library's internal state
        }
    }
});
