import { expect, test } from './fixtures';

test.describe('Timetable Page (/timetable)', () => {
    test('renders the prayer timetable table', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');

        // Should show prayer time columns
        await expect(page.getByText('Fajr').first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Dhuhr').first()).toBeVisible();
    });

    test('shows date range selector', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');

        await expect(page.getByText('Fajr').first()).toBeVisible({ timeout: 15000 });

        // Should have a date range picker button
        const dateRangeButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i });
        await expect(dateRangeButton.first()).toBeVisible();
    });

    test('shows home navigation button', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');

        await expect(page.getByText('Fajr').first()).toBeVisible({ timeout: 15000 });

        // Should have a Home link
        await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    });

    test('shows date format selector', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');

        await expect(page.getByText('Fajr').first()).toBeVisible({ timeout: 15000 });

        // Should have a date format dropdown
        const formatSelect = page.locator('select');
        await expect(formatSelect).toBeVisible();
    });

    test('shows multiple days of prayer times', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');

        await expect(page.getByText('Fajr').first()).toBeVisible({ timeout: 15000 });

        // Should show a table with multiple rows (one per day)
        const tableRows = page.locator('table tbody tr').or(page.locator('[role="row"]'));
        const rowCount = await tableRows.count();
        expect(rowCount).toBeGreaterThan(1);
    });

    test('has correct page title', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');
        await expect(page).toHaveTitle(/Timetable|Schedule|Salat10/i);
    });

    test('navigates back to home', async ({ pageWithOttawa: page }) => {
        await page.goto('/timetable');

        await expect(page.getByText('Fajr').first()).toBeVisible({ timeout: 15000 });

        await page.getByRole('link', { name: /home/i }).click();
        await expect(page).toHaveURL('/');
    });
});
