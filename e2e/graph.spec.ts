import { expect, test } from './fixtures';

test.describe('Graph Page (/graph)', () => {
    test('renders the prayer time graph', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');

        // Should have a Home link - this confirms the page loaded
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible({ timeout: 15000 });

        // Should not show an error
        await expect(page.getByText(/error/i)).not.toBeVisible();
    });

    test('shows home navigation button', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');

        // Should have a Home link
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible({ timeout: 15000 });
    });

    test('shows date range selector', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');

        // Wait for page to load
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible({ timeout: 15000 });

        // Should have a date range picker button
        const dateRangeButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i });
        await expect(dateRangeButton.first()).toBeVisible();
    });

    test('shows event selector dropdown', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');

        // Wait for page to load
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible({ timeout: 15000 });

        // Should have an event selector (select element)
        const eventSelect = page.locator('select');
        await expect(eventSelect).toBeVisible({ timeout: 10000 });
    });

    test('shows chart canvas or SVG', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');

        // Wait for page to load
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible({ timeout: 15000 });

        // uPlot renders a canvas element
        const chart = page.locator('canvas').or(page.locator('svg'));
        await expect(chart.first()).toBeVisible({ timeout: 10000 });
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');
        await expect(page).toHaveTitle(/Graph|Chart|Salat10/i);
    });

    test('navigates back to home', async ({ pageWithOttawa: page }) => {
        await page.goto('/graph');

        await expect(page.getByRole('link', { name: /home/i })).toBeVisible({ timeout: 15000 });

        await page.getByRole('link', { name: /home/i }).click();
        await expect(page).toHaveURL('/');
    });
});
