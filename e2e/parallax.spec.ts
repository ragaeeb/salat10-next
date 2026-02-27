import { expect, test } from './fixtures';

test.describe('Parallax View (/v2)', () => {
    test('renders the parallax sky view', async ({ pageWithOttawa: page }) => {
        await page.goto('/v2');

        // The parallax view should render - look for the sky/background element
        await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

        // The page should not show an error
        await expect(page.getByText(/error/i)).not.toBeVisible();
    });

    test('shows the Hijri date badge', async ({ pageWithOttawa: page }) => {
        await page.goto('/v2');

        // Wait for the page to load
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Should show a Hijri date badge - contains numbers and year
        const hijriContent = page.locator('text=/\\d+.*\\d{4}/');
        await expect(hijriContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('shows current phase information', async ({ pageWithOttawa: page }) => {
        await page.goto('/v2');

        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Should show prayer time (AM/PM format) in the current phase display
        const timeText = page.getByText(/\d+:\d+ [AP]M/).first();
        await expect(timeText).toBeVisible({ timeout: 10000 });
    });

    test('has scrollable content', async ({ pageWithOttawa: page }) => {
        await page.goto('/v2');

        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // The page should have a scrollable container with height
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        expect(bodyHeight).toBeGreaterThan(1000);
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/v2');
        await expect(page).toHaveTitle(/Salat10|Prayer|Sky/i);
    });
});
