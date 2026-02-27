import { test, expect } from '@playwright/test';

test('debug page title and content', async ({ page }) => {
    await page.route('**/api/track', async (route) => {
        console.log('MOCK: intercepted /api/track');
        await route.fulfill({ json: { success: true }, status: 200 });
    });
    
    await page.goto('/explanations');
    
    const title = await page.title();
    const url = page.url();
    
    console.log('URL:', url);
    console.log('Title:', title);
    
    // Just check the page loaded
    expect(url).toContain('localhost:3000');
});
