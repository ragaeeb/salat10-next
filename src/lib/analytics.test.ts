import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
    flushEvents,
    flushPendingEvents,
    getOrCreateSessionId,
    getPendingEvents,
    initAnalytics,
    setPendingEvents,
    trackEvent,
    trackPageView,
    updatePresence,
} from './analytics';

describe('analytics', () => {
    const originalFetch = global.fetch;
    const originalSetInterval = global.setInterval;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        global.setInterval = originalSetInterval;
    });

    describe('getOrCreateSessionId', () => {
        it('should create new session ID if none exists', () => {
            const id = getOrCreateSessionId();
            expect(id).toBeTruthy();
            expect(id.length).toBeGreaterThan(10);
        });

        it('should return existing session ID', () => {
            const first = getOrCreateSessionId();
            const second = getOrCreateSessionId();
            expect(first).toBe(second);
        });

        it('should generate fallback ID if sessionStorage fails', () => {
            const originalGetItem = sessionStorage.getItem;
            sessionStorage.getItem = mock(() => {
                throw new Error('Storage error');
            }) as any;

            const id = getOrCreateSessionId();
            expect(id).toBeTruthy();

            sessionStorage.getItem = originalGetItem;
        });
    });

    describe('getPendingEvents and setPendingEvents', () => {
        it('should return empty array when no events stored', () => {
            const events = getPendingEvents();
            expect(events).toEqual([]);
        });

        it('should save and retrieve events', () => {
            const events = [{ path: '/test', timestamp: Date.now(), type: 'pageview' as const }];
            setPendingEvents(events);

            const retrieved = getPendingEvents();
            expect(retrieved).toEqual(events);
        });

        it('should handle storage errors gracefully', () => {
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = mock(() => {
                throw new Error('Storage error');
            }) as any;

            const events = getPendingEvents();
            expect(events).toEqual([]);

            localStorage.getItem = originalGetItem;
        });
    });

    describe('flushEvents', () => {
        it('should not send if events array is empty', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            await flushEvents([]);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should send events and clear storage on success', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            const events = [{ path: '/test', timestamp: Date.now(), type: 'pageview' as const }];
            setPendingEvents(events);

            await flushEvents(events);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const pending = getPendingEvents();
            expect(pending).toEqual([]);
        });

        it('should keep events in storage on failure', async () => {
            const fetchMock = mock(async () => {
                throw new Error('Network error');
            });
            global.fetch = fetchMock as any;

            const events = [{ path: '/test', timestamp: Date.now(), type: 'pageview' as const }];
            setPendingEvents(events);

            await flushEvents(events);

            const pending = getPendingEvents();
            expect(pending).toEqual(events);
        });
    });

    describe('trackPageView', () => {
        it('should add pageview to pending events', async () => {
            await trackPageView('/home');

            const pending = getPendingEvents();
            expect(pending.length).toBe(1);
            expect(pending[0].type).toBe('pageview');
            expect(pending[0].path).toBe('/home');
        });

        it('should flush when batch size reached', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            // Track 10 events (default batch size)
            for (let i = 0; i < 10; i++) {
                await trackPageView(`/page-${i}`);
            }

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getPendingEvents()).toEqual([]);
        });
    });

    describe('trackEvent', () => {
        it('should track event without data', async () => {
            await trackEvent('button_click');

            const pending = getPendingEvents();
            expect(pending.length).toBe(1);
            expect(pending[0].type).toBe('event');
            expect(pending[0].path).toBe('button_click');
            expect(pending[0].data).toBeUndefined();
        });

        it('should track event with data', async () => {
            await trackEvent('button_click', { button: 'submit' });

            const pending = getPendingEvents();
            expect(pending[0].data).toEqual({ button: 'submit' });
        });
    });

    describe('updatePresence', () => {
        it('should send presence immediately', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            await updatePresence(43.65, -79.38, '/home');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const call = fetchMock.mock.calls[0];
            const body = JSON.parse(call[1].body);
            expect(body.presence).toBeDefined();
            expect(body.presence.lat).toBe(43.65);
            expect(body.presence.lon).toBe(-79.38);
        });

        it('should handle errors silently', async () => {
            const fetchMock = mock(async () => {
                throw new Error('Network error');
            });
            global.fetch = fetchMock as any;

            await expect(updatePresence(43.65, -79.38, '/home')).resolves.toBeUndefined();
        });
    });

    describe('flushPendingEvents', () => {
        it('should not send if no pending events', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            await flushPendingEvents();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should flush all pending events', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            await trackPageView('/page1');
            await trackPageView('/page2');

            await flushPendingEvents();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(getPendingEvents()).toEqual([]);
        });
    });

    describe('initAnalytics', () => {
        it('should flush existing events on init', async () => {
            const fetchMock = mock(async () => Response.json({ success: true }));
            global.fetch = fetchMock as any;

            // Add some events
            await trackPageView('/page1');
            await trackPageView('/page2');

            initAnalytics();

            // Wait a tick for async flush
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(fetchMock).toHaveBeenCalled();
        });

        it('should set up periodic flush', () => {
            const intervalMock = mock((fn: Function, delay: number) => {
                return setTimeout(() => {}, delay) as any;
            });
            global.setInterval = intervalMock as any;

            initAnalytics();

            expect(intervalMock).toHaveBeenCalled();
        });
    });
});
