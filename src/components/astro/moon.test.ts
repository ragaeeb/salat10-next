import { describe, expect, it } from 'bun:test';
import { getMoonPhasePath } from './moon';

describe('getMoonPhasePath', () => {
    it('renders distinct waxing and waning quarters and wraps the cycle', () => {
        expect(getMoonPhasePath(0)).toBe(getMoonPhasePath(1));
        expect(getMoonPhasePath(0.25)).not.toBe(getMoonPhasePath(0.75));
        expect(getMoonPhasePath(0.5)).toContain('A 28 28 0 0 0 40 12');
    });
});
