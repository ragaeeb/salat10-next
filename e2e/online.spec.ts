import { expect, test } from './fixtures';

test.describe('Online Users Page (/online)', () => {
    test('renders the online users page', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');

        // Should show the heading
        await expect(page.getByRole('heading', { name: /Users Online Now/i })).toBeVisible({ timeout: 10000 });
    });

    test('shows user count after loading', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');

        // Wait for loading to complete
        await expect(page.getByText(/online in the last/i)).toBeVisible({ timeout: 10000 });

        // Should show user count (mocked to 1 user)
        await expect(page.getByText(/1 user online/i)).toBeVisible();
    });

    test('shows the world map', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');

        // Wait for loading to complete
        await expect(page.getByText(/online in the last/i)).toBeVisible({ timeout: 10000 });

        // Should show the world map (SVG element from dotted-map)
        const map = page.locator('svg').or(page.locator('canvas'));
        await expect(map.first()).toBeVisible({ timeout: 10000 });
    });

    test('shows home navigation button', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');

        await expect(page.getByRole('heading', { name: /Users Online Now/i })).toBeVisible({ timeout: 10000 });

        // Should have a Home link
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    });

    test('shows presence info text', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');

        // Wait for loading
        await expect(page.getByText(/online in the last/i)).toBeVisible({ timeout: 10000 });

        // Should show the info text about presence data
        await expect(page.getByText(/Each dot represents/i)).toBeVisible();
    });

    test('navigates back to home', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');

        await expect(page.getByRole('heading', { name: /Users Online Now/i })).toBeVisible({ timeout: 10000 });

        await page.getByRole('link', { name: /home/i }).click();
        await expect(page).toHaveURL('/');
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/online');
        await expect(page).toHaveTitle(/Online|Users|Salat10/i);
    });
});
