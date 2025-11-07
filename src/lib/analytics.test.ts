// src/lib/analytics.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'bun:test';
import type * as Analytics from './analytics'; // <-- type-only, literal path!

const MODULE_PATH = './analytics'; // relative to this test file
let __i = 0;
async function importFresh() {
    // Bust Bun's ESM cache: each specifier with a different query is a fresh module.
    return await import(`${MODULE_PATH}?v=${++__i}`);
}

// ---- tiny storage + env helpers ------------------------------------------------

type StorageShape = {
    getItem: (k: string) => string | null;
    setItem: (k: string, v: string) => void;
    removeItem: (k: string) => void;
    clear: () => void;
};

function createStorageMock(opts?: { throwOnGet?: boolean; throwOnSet?: boolean }) {
    const store = new Map<string, string>();
    const api: StorageShape = {
        clear: () => void store.clear(),
        getItem: (k) => {
            if (opts?.throwOnGet) {
                throw new Error('getItem failed');
            }
            return store.has(k) ? store.get(k)! : null;
        },
        removeItem: (k) => void store.delete(k),
        setItem: (k, v) => {
            if (opts?.throwOnSet) {
                throw new Error('setItem failed');
            }
            store.set(k, v);
        },
    };
    return { api, store };
}

function setupClientWindow(local: StorageShape, session: StorageShape): void {
    (globalThis as any).window = {} as Window;
    (globalThis as any).localStorage = local;
    (globalThis as any).sessionStorage = session;
    (globalThis as any).window.localStorage = local;
    (globalThis as any).window.sessionStorage = session;
}

function teardownClientWindow(): void {
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
    delete (globalThis as any).sessionStorage;
}

// ---- common spies --------------------------------------------------------------

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    errorSpy.mockRestore();
    teardownClientWindow();
    vi.clearAllMocks();
    vi.restoreAllMocks();

    delete process.env.NEXT_PUBLIC_ANALYTICS_BATCH_SIZE;
    delete process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL;
    delete process.env.NEXT_PUBLIC_ANALYTICS_STORAGE_KEY;
    delete process.env.NEXT_PUBLIC_SESSION_ID_KEY;
});

// ---- tests --------------------------------------------------------------------

describe('getOrCreateSessionId()', () => {
    it('should return empty string on server (no window)', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        expect(mod.getOrCreateSessionId()).toBe('');
    });

    it('should return stored id when present', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        session.setItem('salat10_session_id', 'abc123');
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        expect(mod.getOrCreateSessionId()).toBe('abc123');
    });

    it('should generate and store id when missing', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        vi.spyOn(Date, 'now').mockReturnValue(1234567890);
        vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

        const mod = (await importFresh()) as typeof Analytics;
        const id = mod.getOrCreateSessionId();

        expect(id).toMatch(/^1234567890-[a-z0-9]{1,9}$/);
        expect(session.getItem('salat10_session_id')).toBe(id);
    });

    it('should fall back when sessionStorage throws', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock({ throwOnGet: true });
        setupClientWindow(local, session);

        vi.spyOn(Date, 'now').mockReturnValue(42);
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const mod = (await importFresh()) as typeof Analytics;
        const id = mod.getOrCreateSessionId();
        expect(id).toMatch(/^42-[a-z0-9]{1,9}$/);
    });
});

describe('getPendingEvents()', () => {
    it('should return [] on server', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        expect(mod.getPendingEvents()).toEqual([]);
    });

    it('should parse stored events', async () => {
        const { api: local, store } = createStorageMock();
        const { api: session } = createStorageMock();
        local.setItem('salat10_analytics', JSON.stringify([{ path: 'x', timestamp: 1, type: 'event' }]));
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        expect(mod.getPendingEvents()).toEqual([{ path: 'x', timestamp: 1, type: 'event' }]);
    });

    it('should return [] if JSON parse fails', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        local.setItem('salat10_analytics', '{bad json');
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        expect(mod.getPendingEvents()).toEqual([]);
    });
});

describe('setPendingEvents()', () => {
    it('should no-op on server', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        expect(() => mod.setPendingEvents([{ path: 'x', timestamp: 1, type: 'event' }])).not.toThrow();
    });

    it('should write to localStorage', async () => {
        const { api: local, store } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        mod.setPendingEvents([{ path: '/a', timestamp: 11, type: 'pageview' }]);

        expect(store.get('salat10_analytics')).toBe(JSON.stringify([{ path: '/a', timestamp: 11, type: 'pageview' }]));
    });

    it('should log on setItem error', async () => {
        const { api: local } = createStorageMock({ throwOnSet: true });
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        mod.setPendingEvents([{ path: 'x', timestamp: 1, type: 'event' }]);

        expect(errorSpy).toHaveBeenCalledWith('Failed to save analytics events', expect.any(Error));
    });
});

describe('flushEvents()', () => {
    it('should early-return on empty array', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        const fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(new Response());
        const setSpy = vi.spyOn(mod, 'setPendingEvents');
        await mod.flushEvents([]);
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(setSpy).not.toHaveBeenCalled();
    });

    it('should POST events and clear storage', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);
        const mod = (await importFresh()) as typeof Analytics;

        const fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(new Response());
        const setSpy = vi.spyOn(mod, 'setPendingEvents');

        const events = [{ path: 'name', timestamp: 7, type: 'event' } as const];
        await mod.flushEvents(events);

        expect(fetchSpy).toHaveBeenCalledWith('/api/track', {
            body: JSON.stringify({ events }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
        expect(setSpy).toHaveBeenCalledWith([]);
    });

    it('should keep events and log on failure', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        vi.spyOn(globalThis as any, 'fetch').mockRejectedValue(new Error('network'));
        const setSpy = vi.spyOn(mod, 'setPendingEvents');
        await mod.flushEvents([{ path: 'x', timestamp: 1, type: 'event' }]);
        expect(errorSpy).toHaveBeenCalledWith('Failed to send analytics', expect.any(Error));
        expect(setSpy).not.toHaveBeenCalled();
    });
});

describe('trackPageView() & trackEvent()', () => {
    it('should queue a pageview without flushing before batch size', async () => {
        const { api: local, store } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(new Response());

        await mod.trackPageView('/home');
        const parsed = JSON.parse(store.get('salat10_analytics')!);
        expect(parsed.length).toBe(1);
        expect(parsed[0]).toMatchObject({ path: '/home', type: 'pageview' });
    });

    it('should include data for trackEvent() and flush at batch size', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        const fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(new Response());
        const payloads: any[] = [];
        fetchSpy.mockImplementation(async (_url: string, init: any) => {
            payloads.push(JSON.parse(init.body));
            return new Response();
        });

        for (let i = 0; i < 9; i++) {
            await mod.trackEvent(`evt-${i}`);
        }
        await mod.trackEvent('special', { bar: true, foo: 1 });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(payloads[0].events.length).toBe(10);
        expect(payloads[0].events[9]).toMatchObject({ data: { bar: true, foo: 1 }, path: 'special', type: 'event' });
    });
});

describe('updatePresence()', () => {
    it('should POST presence with session id', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        vi.spyOn(Date, 'now').mockReturnValue(999);
        const fetchSpy = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(new Response());

        const mod = (await importFresh()) as typeof Analytics;
        vi.spyOn(mod, 'getOrCreateSessionId').mockReturnValue('sess-1');

        await mod.updatePresence(1.23, 4.56, '/page');

        const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
        const body = JSON.parse((init!.body as string) || '{}');
        expect(body.presence).toMatchObject({ lat: 1.23, lon: 4.56, page: '/page', sessionId: 'sess-1' });
        expect(body.presence.lastSeen).toBe(999);
    });

    it('should log on failure without throwing', async () => {
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;
        vi.spyOn(mod, 'getOrCreateSessionId').mockReturnValue('sess-2');
        vi.spyOn(globalThis as any, 'fetch').mockRejectedValue(new Error('boom'));

        await mod.updatePresence(0, 0, '/');
        expect(errorSpy).toHaveBeenCalledWith('Failed to update presence', expect.any(Error));
    });
});

describe('flushPendingEvents()', () => {
    it('should do nothing when there are no pending events', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        const flushSpy = vi.spyOn(mod, 'flushEvents').mockResolvedValue(undefined);
        vi.spyOn(mod, 'getPendingEvents').mockReturnValue([]);
        await mod.flushPendingEvents();
        expect(flushSpy).not.toHaveBeenCalled();
    });

    it('should flush when there are pending events', async () => {
        const mod = (await importFresh()) as typeof Analytics;
        const pending = [{ path: '/x', timestamp: 1, type: 'pageview' }];
        const flushSpy = vi.spyOn(mod, 'flushEvents').mockResolvedValue(undefined);
        vi.spyOn(mod, 'getPendingEvents').mockReturnValue(pending as any);
        await mod.flushPendingEvents();
        expect(flushSpy).toHaveBeenCalledWith(pending);
    });
});

describe('initAnalytics()', () => {
    it('should be a no-op on server', async () => {
        const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
        const mod = (await importFresh()) as typeof Analytics;
        mod.initAnalytics();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it('should flush immediately then schedule periodic flush', async () => {
        process.env.NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL = '1000';
        const { api: local } = createStorageMock();
        const { api: session } = createStorageMock();
        setupClientWindow(local, session);

        const mod = (await importFresh()) as typeof Analytics;

        const getSpy = vi
            .spyOn(mod, 'getPendingEvents')
            .mockReturnValueOnce([{ path: 'a', timestamp: 1, type: 'event' }]) // initial
            .mockReturnValueOnce([{ path: 'b', timestamp: 2, type: 'event' }]); // interval tick

        const flushSpy = vi.spyOn(mod, 'flushEvents').mockResolvedValue(undefined);

        let capturedDelay = -1;
        const intervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: TimerHandler, ms?: number) => {
            capturedDelay = Number(ms);
            if (typeof fn === 'function') {
                fn();
            }
            // @ts-expect-error timer handle
            return 1;
        }) as any);

        mod.initAnalytics();

        expect(getSpy).toHaveBeenCalledTimes(2);
        expect(flushSpy).toHaveBeenCalledTimes(2);
        expect(capturedDelay).toBe(1000);
        intervalSpy.mockRestore();
    });
});
