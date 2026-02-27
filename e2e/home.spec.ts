import { expect, test } from './fixtures';

test.describe('Home Page (/)', () => {
    test('renders prayer times card with Ottawa coordinates', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for the page to hydrate and show prayer times
        // Use exact: true to avoid strict mode violation with multiple 'Fajr' matches
        await expect(page.getByText('Fajr', { exact: true })).toBeVisible({ timeout: 15000 });

        // Should show prayer time events
        await expect(page.getByText('Fajr', { exact: true })).toBeVisible();
        await expect(page.getByText('Sunrise', { exact: true })).toBeVisible();
        await expect(page.getByText('Dhuhr', { exact: true })).toBeVisible();
    });

    test('shows Ottawa address label', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for hydration
        await expect(page.getByText('Fajr', { exact: true })).toBeVisible({ timeout: 15000 });

        // Should show the address
        await expect(page.getByText('Ottawa, Ontario, Canada')).toBeVisible();
    });

    test('shows navigation buttons to other views', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for hydration - use first() to avoid strict mode violation
        await expect(page.getByText('Fajr', { exact: true })).toBeVisible({ timeout: 15000 });

        // Should have link to parallax view
        await expect(page.locator('a[href="/v2"]')).toBeVisible();

        // Should have link to qibla
        await expect(page.locator('a[href="/qibla"]')).toBeVisible();

        // Should have link to settings
        await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('shows Hijri date information', async ({ pageWithOttawa: page }) => {
        await page.goto('/');

        // Wait for hydration
        await expect(page.getByText('Fajr', { exact: true })).toBeVisible({ timeout: 15000 });

        // Should show Hijri date (contains AH)
        await expect(page.getByText(/AH/)).toBeVisible();
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
