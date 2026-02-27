import { expect, test } from './fixtures';

test.describe('Explanations Page (/explanations)', () => {
    test('renders the explanations page', async ({ pageWithOttawa: page }) => {
        await page.goto('/explanations');

        // Wait for hydration
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Should show the page content
        await expect(page.locator('body')).toBeVisible();

        // Should not show an error about missing coordinates
        await expect(page.getByText(/Please set valid coordinates/i)).not.toBeVisible({ timeout: 5000 });
    });

    test('shows explanation content for Ottawa', async ({ pageWithOttawa: page }) => {
        await page.goto('/explanations');

        // Wait for the explanation to load
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // The MultiStepLoader should show explanation steps
        const content = page
            .getByText(/Ottawa/i)
            .or(page.getByText(/prayer/i))
            .or(page.getByText(/Fajr/i))
            .or(page.getByText(/calculation/i));

        await expect(content.first()).toBeVisible({ timeout: 15000 });
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/explanations');
        await expect(page).toHaveTitle(/Explanation|How|Salat10/i);
    });

    test('shows error state when no coordinates set', async ({ page }) => {
        // Mock analytics but don't set up Ottawa coordinates
        await page.route('**/api/track', async (route) => {
            await route.fulfill({ json: { success: true }, status: 200 });
        });

        await page.goto('/explanations');

        // Wait for hydration
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Should show the "please set coordinates" message
        await expect(page.getByText(/Please set valid coordinates/i)).toBeVisible({ timeout: 10000 });
    });
});
