import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// Ensure window.event exists for React Testing Library compatibility
// React Testing Library's act-compat.js tries to access window.event
// This needs to be set up before any React Testing Library code runs
if (typeof window !== 'undefined') {
    if (!window.event) {
        Object.defineProperty(window, 'event', {
            value: undefined,
            writable: true,
            configurable: true,
        });
    }
}
