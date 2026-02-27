import { expect, test } from './fixtures';

test.describe('Qibla Page (/qibla)', () => {
    test('renders the qibla page with back button', async ({ pageWithOttawa: page }) => {
        await page.goto('/qibla');

        // Should show the back button (always visible in the page.tsx server component)
        await expect(page.locator('a[href="/"]').or(page.getByRole('link', { name: /go back/i }))).toBeVisible({
            timeout: 10000,
        });
    });

    test('shows loading state or content', async ({ pageWithOttawa: page }) => {
        await page.goto('/qibla');

        // The lazy-loaded component shows a loading state or actual content
        // Either the loading text or the actual content should be visible
        const loadingOrContent = page
            .getByText(/Loading Qibla Finder/i)
            .or(page.getByText(/Loading/i))
            .or(page.locator('video'))
            .or(page.locator('[aria-live="polite"]'))
            .or(page.getByText(/camera/i))
            .or(page.getByText(/compass/i));

        await expect(loadingOrContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/qibla');
        await expect(page).toHaveTitle(/Qibla|Salat10/i);
    });

    test('back button navigates to home', async ({ pageWithOttawa: page }) => {
        await page.goto('/qibla');

        // Click the back button
        const backButton = page.locator('a[href="/"]').or(page.getByRole('link', { name: /go back/i }));
        await expect(backButton).toBeVisible({ timeout: 10000 });
        await backButton.click();

        await expect(page).toHaveURL('/');
    });

    test('page has black background for AR view', async ({ pageWithOttawa: page }) => {
        await page.goto('/qibla');

        // The qibla page uses a black background
        const container = page.locator('.bg-black').first();
        await expect(container).toBeVisible({ timeout: 10000 });
    });
});
