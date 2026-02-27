import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// Happy DOM attaches `navigator` to `window`, but some libraries (and our hooks)
// access `navigator` as a global. Make sure it's available in Bun's test runtime
// (CI can differ from local).
if (typeof window !== 'undefined') {
    if (typeof (globalThis as any).navigator === 'undefined') {
        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: window.navigator, writable: true });
    }

    // Some animation/sensor libs expect these globals to exist.
    if (
        typeof (globalThis as any).requestAnimationFrame === 'undefined' &&
        typeof window.requestAnimationFrame === 'function'
    ) {
        (globalThis as any).requestAnimationFrame = window.requestAnimationFrame.bind(window);
    }
    if (
        typeof (globalThis as any).cancelAnimationFrame === 'undefined' &&
        typeof window.cancelAnimationFrame === 'function'
    ) {
        (globalThis as any).cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    }

    // `motion/react` (and others) can consult matchMedia.
    if (typeof window.matchMedia !== 'function') {
        window.matchMedia = ((query: string) => ({
            addEventListener: () => {},
            addListener: () => {},
            dispatchEvent: () => false,
            matches: false,
            media: query,
            onchange: null,
            removeEventListener: () => {},
            removeListener: () => {},
        })) as any;
    }
}

// Ensure window.event exists for React Testing Library compatibility
// React Testing Library's act-compat.js tries to access window.event
// This needs to be set up before any React Testing Library code runs
if (typeof window !== 'undefined') {
    if (!window.event) {
        Object.defineProperty(window, 'event', { configurable: true, value: undefined, writable: true });
    }
}
