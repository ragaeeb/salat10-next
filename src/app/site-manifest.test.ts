import { describe, expect, it } from 'bun:test';

describe('site web manifest', () => {
    it('provides the manifest referenced by the site metadata', async () => {
        const manifest = await Bun.file(new URL('../../public/site.webmanifest', import.meta.url)).json();

        expect(manifest).toMatchObject({ display: 'standalone', name: 'Salat10', start_url: '/' });
    });
});
