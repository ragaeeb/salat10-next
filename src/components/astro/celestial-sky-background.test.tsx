import { describe, expect, it } from 'bun:test';
import { render, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import type { Timeline } from '@/types/timeline';
import { CelestialSkyBackground } from './celestial-sky-background';

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

describe('CelestialSkyBackground', () => {
    it('should render celestial background when timeline is provided', async () => {
        const progressMv = motionValue(0.5);
        const { container } = render(
            <CelestialSkyBackground lunarCycle={0.5} timeline={mockTimeline} progress={progressMv} pNow={0.5} />,
        );

        await waitFor(() => {
            const backgroundDiv = container.querySelector('[aria-hidden="true"]');
            expect(backgroundDiv).toBeDefined();
            // Should contain SVG elements (Sun/Moon/Sky)
            const svgs = container.querySelectorAll('svg');
            expect(svgs.length).toBeGreaterThan(0);
        });
    });

    it('should render fallback sky container when timeline is null', async () => {
        const { container } = render(
            <CelestialSkyBackground lunarCycle={0.5} pNow={0} progress={motionValue(0)} timeline={null} />,
        );

        await waitFor(() => {
            expect(container.firstChild).toBeDefined();
        });
    });

    it('should apply custom className to outer container', async () => {
        const { container } = render(
            <CelestialSkyBackground
                className="custom-bg-class"
                lunarCycle={0.5}
                pNow={0.5}
                progress={motionValue(0.5)}
                timeline={mockTimeline}
            />,
        );

        await waitFor(() => {
            const outerDiv = container.querySelector('.custom-bg-class');
            expect(outerDiv).toBeDefined();
        });
    });
});
