import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import type { Timeline } from '@/types/timeline';
import { CelestialPhaseBanner } from './celestial-phase-banner';

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

describe('CelestialPhaseBanner', () => {
    it('should render celestial phase title and details', () => {
        const { getAllByText, getByText } = render(
            <CelestialPhaseBanner lunarCycle={0.5} progress={0.45} timeline={mockTimeline} />,
        );

        expect(getAllByText(/Dhuhr \(Zenith\)/).length).toBeGreaterThan(0);
        expect(getByText(/Zawāl/)).toBeDefined();
    });

    it('should return null when timeline is null', () => {
        const { container } = render(<CelestialPhaseBanner lunarCycle={0.5} progress={0.45} timeline={null} />);
        expect(container.firstChild).toBeNull();
    });
});
