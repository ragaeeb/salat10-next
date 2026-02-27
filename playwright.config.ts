import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    expect: {
        timeout: 10000,
    },
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    reporter: [['html', { open: 'never' }], ['list']],
    retries: process.env.CI ? 2 : 0,
    testDir: './e2e',
    use: {
        baseURL: 'http://localhost:3002',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        video: 'retain-on-failure',
    },
    webServer: {
        command: 'bun x next start -p 3002',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
        url: 'http://localhost:3002',
    },
    workers: process.env.CI ? 1 : undefined,
});
