import { describe, expect, it } from 'bun:test';
import {
    fajrGradientOpacityAt,
    getColorFor,
    lightRaysOpacityAt,
    moonOpacityAt,
    skyColorAt,
    starsOpacityAt,
    sunColorChannelAt,
    sunOpacityAt,
    sunsetGradientOpacityAt,
} from '@/lib/colors';
import type { Timeline } from '@/types/timeline';

const mockTimeline: Timeline = {
    asr: 0.6,
    dhuhr: 0.4,
    end: 1,
    fajr: 0,
    isha: 0.85,
    lastThird: 0.95,
    maghrib: 0.75,
    midNight: 0.9,
    sunrise: 0.15,
};

describe('skyColorAt', () => {
    it('should return night color before sunrise', () => {
        expect(skyColorAt(0.1, mockTimeline)).toBe('rgba(5, 7, 16, 0.98)');
    });

    it('should return day color between sunrise and dhuhr', () => {
        expect(skyColorAt(0.2, mockTimeline)).toBe('rgba(135, 206, 235, 0.30)');
    });

    it('should return afternoon color between dhuhr and asr', () => {
        expect(skyColorAt(0.5, mockTimeline)).toBe('rgba(150, 215, 245, 0.32)');
    });

    it('should return evening color between asr and maghrib', () => {
        expect(skyColorAt(0.7, mockTimeline)).toBe('rgba(160, 220, 255, 0.35)');
    });

    it('should transition between maghrib and isha', () => {
        const color = skyColorAt(0.8, mockTimeline);
        expect(color).toContain('rgba');
    });

    it('should return dusk color between isha and midnight', () => {
        expect(skyColorAt(0.87, mockTimeline)).toBe('rgba(10, 12, 28, 0.90)');
    });

    it('should return late night color between midnight and last third', () => {
        expect(skyColorAt(0.92, mockTimeline)).toBe('rgba(6, 8, 20, 0.95)');
    });

    it('should return pre-dawn color after last third', () => {
        expect(skyColorAt(0.97, mockTimeline)).toBe('rgba(5, 7, 16, 0.98)');
    });
});

describe('starsOpacityAt', () => {
    it('should return 0 before isha', () => {
        expect(starsOpacityAt(0.7, mockTimeline)).toBe(0);
    });

    it('should transition between isha and midnight', () => {
        const opacity = starsOpacityAt(0.87, mockTimeline);
        expect(opacity).toBeGreaterThan(0);
        expect(opacity).toBeLessThan(1);
    });

    it('should return 1 after midnight', () => {
        expect(starsOpacityAt(0.92, mockTimeline)).toBe(1);
    });
});

describe('fajrGradientOpacityAt', () => {
    it('should return 0 before fajr', () => {
        expect(fajrGradientOpacityAt(-0.1, mockTimeline)).toBe(0);
    });

    it('should be visible at fajr', () => {
        expect(fajrGradientOpacityAt(0, mockTimeline)).toBeGreaterThanOrEqual(0.7);
    });

    it('should increase between fajr and sunrise', () => {
        const opacity = fajrGradientOpacityAt(0.07, mockTimeline);
        expect(opacity).toBeGreaterThan(0.7);
    });

    it('should fade after sunrise', () => {
        const opacity = fajrGradientOpacityAt(0.16, mockTimeline);
        expect(opacity).toBeLessThan(1);
    });

    it('should return 0 well after sunrise', () => {
        expect(fajrGradientOpacityAt(0.3, mockTimeline)).toBe(0);
    });
});

describe('sunsetGradientOpacityAt', () => {
    it('should return 0 before halfway between asr and maghrib', () => {
        expect(sunsetGradientOpacityAt(0.6, mockTimeline)).toBe(0);
    });

    it('should increase after halfway point', () => {
        const orangeStart = (mockTimeline.asr + mockTimeline.maghrib) / 2;
        const opacity = sunsetGradientOpacityAt(orangeStart + 0.01, mockTimeline);
        expect(opacity).toBeGreaterThan(0);
    });

    it('should be at max during hold period', () => {
        expect(sunsetGradientOpacityAt(0.78, mockTimeline)).toBe(1);
    });

    it('should fade before isha', () => {
        const opacity = sunsetGradientOpacityAt(0.84, mockTimeline);
        expect(opacity).toBeLessThan(1);
    });

    it('should return 0 at isha', () => {
        expect(sunsetGradientOpacityAt(0.85, mockTimeline)).toBe(0);
    });
});

describe('sunColorChannelAt', () => {
    it('should return day color before orange start', () => {
        expect(sunColorChannelAt(0.6, mockTimeline, 'r')).toBe(255);
        expect(sunColorChannelAt(0.6, mockTimeline, 'g')).toBe(223);
        expect(sunColorChannelAt(0.6, mockTimeline, 'b')).toBe(102);
    });

    it('should transition to dusk color', () => {
        const r = sunColorChannelAt(0.7, mockTimeline, 'r');
        const g = sunColorChannelAt(0.7, mockTimeline, 'g');
        const b = sunColorChannelAt(0.7, mockTimeline, 'b');

        expect(r).toBe(255);
        expect(g).toBeLessThan(223);
        expect(b).toBeLessThan(102);
    });

    it('should reach dusk color at maghrib', () => {
        expect(sunColorChannelAt(0.75, mockTimeline, 'r')).toBe(255);
        expect(sunColorChannelAt(0.75, mockTimeline, 'g')).toBe(140);
        expect(sunColorChannelAt(0.75, mockTimeline, 'b')).toBe(0);
    });
});

describe('sunOpacityAt', () => {
    it('should return 0 before sunrise', () => {
        expect(sunOpacityAt(0.1, mockTimeline)).toBe(0);
    });

    it('should be visible after sunrise', () => {
        expect(sunOpacityAt(0.2, mockTimeline)).toBe(1);
    });

    it('should fade before maghrib', () => {
        const opacity = sunOpacityAt(0.74, mockTimeline);
        expect(opacity).toBeLessThan(1);
    });

    it('should be 0 at maghrib', () => {
        expect(sunOpacityAt(0.75, mockTimeline)).toBe(0);
    });

    it('should remain 0 after maghrib', () => {
        expect(sunOpacityAt(0.8, mockTimeline)).toBe(0);
    });
});

describe('moonOpacityAt', () => {
    it('should return 0 before appear start', () => {
        expect(moonOpacityAt(0.6, mockTimeline)).toBe(0);
    });

    it('should start appearing before maghrib', () => {
        const opacity = moonOpacityAt(0.74, mockTimeline);
        expect(opacity).toBeGreaterThan(0);
        expect(opacity).toBeLessThan(1);
    });

    it('should be fully visible at maghrib', () => {
        expect(moonOpacityAt(0.75, mockTimeline)).toBe(1);
    });

    it('should remain visible after maghrib', () => {
        expect(moonOpacityAt(0.8, mockTimeline)).toBe(1);
    });
});

describe('lightRaysOpacityAt', () => {
    it('should return 0 before fajr', () => {
        expect(lightRaysOpacityAt(-0.1, mockTimeline)).toBe(0);
    });

    it('should increase between fajr and sunrise', () => {
        const opacity = lightRaysOpacityAt(0.07, mockTimeline);
        expect(opacity).toBeGreaterThan(0);
        expect(opacity).toBeLessThanOrEqual(0.4);
    });

    it('should fade after sunrise', () => {
        const opacity = lightRaysOpacityAt(0.16, mockTimeline);
        expect(opacity).toBeLessThan(0.4);
    });

    it('should return 0 well after sunrise', () => {
        expect(lightRaysOpacityAt(0.3, mockTimeline)).toBe(0);
    });
});

describe('getColorFor', () => {
    it('should return series color for known events', () => {
        // Assuming SERIES_COLORS has fajr defined
        const color = getColorFor('fajr', 0);
        expect(typeof color).toBe('string');
        expect(color).toMatch(/^#/);
    });

    it('should return fallback color for unknown events', () => {
        const color = getColorFor('unknown_event', 0);
        expect(typeof color).toBe('string');
        expect(color).toMatch(/^#/);
    });

    it('should cycle through fallback colors', () => {
        const color1 = getColorFor('unknown1', 0);
        const color2 = getColorFor('unknown2', 1);
        expect(color1).not.toBe(color2);
    });
});
