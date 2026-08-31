import { describe, expect, it } from 'bun:test';

describe('Wrangler configuration', () => {
    it('declares the geocoding key as a Worker secret', async () => {
        const config = await Bun.file(new URL('../../wrangler.jsonc', import.meta.url)).json();

        expect(config.secrets.required).toContain('GEOCODE_API_KEY');
    });
});
