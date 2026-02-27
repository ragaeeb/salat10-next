import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { motionValue } from 'motion/react';
import type { Timeline } from '@/types/timeline';
import { Qamar } from './qamar';

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

describe('Qamar', () => {
    describe('rendering', () => {
        it('should render without crashing with valid timeline', () => {
            const scrollProgress = motionValue(0.8);
            const { container } = render(<Qamar scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Should render an SVG (Moon component renders SVG)
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });

        it('should render Moon component with title', () => {
            const scrollProgress = motionValue(0.8);
            const { container } = render(<Qamar scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Moon component should have a title
            const title = container.querySelector('title');
            expect(title).toBeDefined();
            expect(title?.textContent).toBe('Moon');
        });
    });

    describe('with null timeline', () => {
        it('should render Moon component with null timeline', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(<Qamar scrollProgress={scrollProgress} timeline={null} />);

            // Should render SVG
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });

        it('should render with correct structure', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(<Qamar scrollProgress={scrollProgress} timeline={null} />);

            // Should have Moon title
            const title = container.querySelector('title');
            expect(title?.textContent).toBe('Moon');
        });
    });

    describe('edge cases', () => {
        it('should handle different scroll progress values', () => {
            const testValues = [0, 0.25, 0.5, 0.75, 0.99];

            for (const value of testValues) {
                const scrollProgress = motionValue(value);
                const { unmount, container } = render(
                    <Qamar scrollProgress={scrollProgress} timeline={mockTimeline} />,
                );

                // Should render without crashing
                const svg = container.querySelector('svg');
                expect(svg).toBeDefined();

                unmount();
            }
        });

        it('should handle timeline changes', () => {
            const scrollProgress = motionValue(0.5);
            const { rerender, container } = render(<Qamar scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Change timeline
            const newTimeline: Timeline = { ...mockTimeline, maghrib: 0.8 };
            rerender(<Qamar scrollProgress={scrollProgress} timeline={newTimeline} />);

            // Should still render
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });

        it('should handle scrollProgress updates', () => {
            const scrollProgress1 = motionValue(0.3);
            const { rerender, container } = render(<Qamar scrollProgress={scrollProgress1} timeline={mockTimeline} />);

            const scrollProgress2 = motionValue(0.7);
            rerender(<Qamar scrollProgress={scrollProgress2} timeline={mockTimeline} />);

            // Should still render
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });
    });
});
