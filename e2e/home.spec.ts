import { expect, test } from './fixtures';

test.describe('Home Page (/)', () => {
    test('renders prayer times card with Ottawa coordinates', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for the page to hydrate and show prayer times
        await expect(page.getByText('Fajr')).toBeVisible({ timeout: 15000 });

        // Should show prayer time events
        await expect(page.getByText('Fajr')).toBeVisible();
        await expect(page.getByText('Sunrise')).toBeVisible();
        await expect(page.getByText('Dhuhr')).toBeVisible();
    });

    test('shows Ottawa address label', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for hydration
        await expect(page.getByText('Fajr')).toBeVisible({ timeout: 15000 });

        // Should show the address
        await expect(page.getByText('Ottawa, Ontario, Canada')).toBeVisible();
    });

    test('shows navigation buttons to other views', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for hydration
        await expect(page.getByText('Fajr')).toBeVisible({ timeout: 15000 });

        // Should have link to parallax view
        await expect(page.locator('a[href="/v2"]')).toBeVisible();

        // Should have link to qibla
        await expect(page.locator('a[href="/qibla"]')).toBeVisible();

        // Should have link to settings
        await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('shows coordinate information', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for hydration
        await expect(page.getByText('Fajr')).toBeVisible({ timeout: 15000 });

        // Should show coordinates (N/S and E/W format)
        await expect(page.getByText(/45.*N/)).toBeVisible();
        await expect(page.getByText(/75.*W/)).toBeVisible();
    });

    test('redirects to settings when no coordinates set', async ({ page }) => {
        // Mock analytics but don't set up Ottawa coordinates
        await page.route('**/api/track', async (route) => {
            await route.fulfill({ json: { success: true }, status: 200 });
        });

        await page.goto('/');

        // Should redirect to settings page since no coordinates are configured
        await expect(page).toHaveURL('/settings', { timeout: 10000 });
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Salat10/i);
    });
});
