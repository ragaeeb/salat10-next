import { test as base, type Page } from '@playwright/test';

/**
 * Ottawa, Ontario, Canada coordinates
 * 45.4201° N, 75.7003° W
 */
export const OTTAWA_SETTINGS = {
    address: 'Ottawa, Ontario, Canada',
    city: 'Ottawa',
    country: 'Canada',
    fajrAngle: '15',
    ishaAngle: '15',
    ishaInterval: '0',
    latitude: '45.4201',
    longitude: '-75.7003',
    method: 'NorthAmerica',
    state: 'Ontario',
    timeZone: 'America/Toronto',
    userId: 'test-user-e2e',
};

/**
 * The localStorage key used by the Zustand store (matches package.json name)
 */
export const STORE_KEY = 'salat10-next';

/**
 * Set up localStorage with Ottawa coordinates before navigating to a page.
 * This simulates a user who has already configured their location.
 */
export async function setupOttawaStorage(page: Page): Promise<void> {
    // Navigate to the app first to establish the origin
    await page.goto('/');

    // Set the store state in localStorage
    await page.evaluate(
        ({ key, settings }) => {
            const storeState = {
                state: { settings },
                version: 0,
            };
            localStorage.setItem(key, JSON.stringify(storeState));
        },
        { key: STORE_KEY, settings: OTTAWA_SETTINGS },
    );
}

/**
 * Mock the analytics track endpoint to prevent real API calls
 */
export async function mockAnalyticsEndpoint(page: Page): Promise<void> {
    await page.route('**/api/track', async (route) => {
        await route.fulfill({
            contentType: 'application/json',
            json: { success: true },
            status: 200,
        });
    });
}

/**
 * Mock the online users endpoint
 */
export async function mockOnlineEndpoint(page: Page): Promise<void> {
    await page.route('**/api/online', async (route) => {
        await route.fulfill({
            contentType: 'application/json',
            json: {
                ttl: 300,
                users: [
                    {
                        city: 'Ottawa',
                        country: 'Canada',
                        lastSeen: Date.now(),
                        lat: 45.4201,
                        lon: -75.7003,
                        page: '/',
                        state: 'Ontario',
                        userId: 'test-user-1',
                    },
                ],
            },
            status: 200,
        });
    });
}

/**
 * Mock the geocode endpoint
 */
export async function mockGeocodeEndpoint(page: Page): Promise<void> {
    await page.route('**/api/geocode**', async (route) => {
        await route.fulfill({
            contentType: 'application/json',
            json: {
                city: 'Ottawa',
                country: 'Canada',
                label: 'Ottawa, Ontario, Canada',
                latitude: 45.4201,
                longitude: -75.7003,
                state: 'Ontario',
            },
            status: 200,
        });
    });
}

type Fixtures = {
    pageWithOttawa: Page;
};

/**
 * Extended test fixture that sets up Ottawa coordinates and mocks analytics
 */
export const test = base.extend<Fixtures>({
    pageWithOttawa: async ({ page }, use) => {
        // Mock analytics before any navigation
        await mockAnalyticsEndpoint(page);
        await mockOnlineEndpoint(page);
        await mockGeocodeEndpoint(page);

        // Set up Ottawa coordinates in localStorage
        await setupOttawaStorage(page);

        await use(page);
    },
});

export { expect } from '@playwright/test';
