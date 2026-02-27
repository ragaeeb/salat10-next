import { expect, test } from './fixtures';

test.describe('Settings Page (/settings)', () => {
    test('renders settings page with location and calculation sections', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');

        // Should show the settings heading
        await expect(page.getByRole('heading', { name: /Location.*Settings/i })).toBeVisible({ timeout: 10000 });

        // Should show location settings section
        await expect(page.getByText(/Configure your coordinates/i)).toBeVisible();
    });

    test('shows back button to navigate home', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');

        await expect(page.getByRole('heading', { name: /Location.*Settings/i })).toBeVisible({ timeout: 10000 });

        // Should have a back button
        const backButton = page.getByRole('link', { name: /back/i });
        await expect(backButton).toBeVisible();

        // Click back and verify navigation
        await backButton.click();
        await expect(page).toHaveURL('/');
    });

    test('shows calculation method settings', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');

        await expect(page.getByRole('heading', { name: /Location.*Settings/i })).toBeVisible({ timeout: 10000 });

        // Should show calculation method options
        await expect(page.getByText(/Fajr/i)).toBeVisible();
    });

    test('shows reset defaults button', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');

        await expect(page.getByRole('heading', { name: /Location.*Settings/i })).toBeVisible({ timeout: 10000 });

        // Should have reset button
        await expect(page.getByRole('button', { name: /reset defaults/i })).toBeVisible();
    });

    test('shows browser timezone button', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');

        await expect(page.getByRole('heading', { name: /Location.*Settings/i })).toBeVisible({ timeout: 10000 });

        // Should have browser timezone button
        await expect(page.getByRole('button', { name: /browser timezone/i })).toBeVisible();
    });

    test('shows current settings JSON in footer', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');

        await expect(page.getByRole('heading', { name: /Location.*Settings/i })).toBeVisible({ timeout: 10000 });

        // Should show settings JSON with Ottawa coordinates
        await expect(page.getByText(/45.4201/)).toBeVisible();
        await expect(page.getByText(/-75.7003/)).toBeVisible();
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/settings');
        await expect(page).toHaveTitle(/Settings|Salat10/i);
    });
});
