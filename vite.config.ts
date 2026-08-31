import { cloudflare } from '@cloudflare/vite-plugin';
import { cdnAdapter } from '@vinext/cloudflare/cache/cdn-adapter';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: { exclude: ['next/link', 'next/router'] },
    plugins: [
        vinext({ cache: { cdn: cdnAdapter() } }),
        cloudflare({ viteEnvironment: { childEnvironments: ['ssr'], name: 'rsc' } }),
    ],
});
