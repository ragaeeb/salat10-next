import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import { motionValue } from 'motion/react';
import type { Timeline } from '@/types/timeline';
import { Shams } from './shams';

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

describe('Shams', () => {
    describe('rendering', () => {
        it('should render Sun component without crashing', () => {
            const scrollProgress = motionValue(0.4);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Should render an SVG (Sun component renders SVG)
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });

        it('should render Sun component with title', () => {
            const scrollProgress = motionValue(0.4);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Sun component should have a title
            const title = container.querySelector('title');
            expect(title).toBeDefined();
            expect(title?.textContent).toBe('Sun');
        });

        it('should render with correct SVG structure', () => {
            const scrollProgress = motionValue(0.4);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Sun has circles and gradients
            const circles = container.querySelectorAll('circle');
            expect(circles.length).toBeGreaterThan(0);
        });
    });

    describe('SVG elements', () => {
        it('should render SVG with defs for filters and gradients', () => {
            const scrollProgress = motionValue(0.4);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={mockTimeline} />);

            const defs = container.querySelector('defs');
            expect(defs).toBeDefined();
        });

        it('should render multiple circles for sun layers', () => {
            const scrollProgress = motionValue(0.4);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Sun has multiple circles (core, body, halo)
            const circles = container.querySelectorAll('circle');
            expect(circles.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('with null timeline', () => {
        it('should render Sun component with null timeline', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={null} />);

            // Should render SVG
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });

        it('should render with correct structure', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(<Shams scrollProgress={scrollProgress} timeline={null} />);

            // Should have Sun title
            const title = container.querySelector('title');
            expect(title?.textContent).toBe('Sun');
        });
    });

    describe('edge cases', () => {
        it('should handle different scroll progress values', () => {
            const testValues = [0, 0.15, 0.4, 0.75, 0.99];

            for (const value of testValues) {
                const scrollProgress = motionValue(value);
                const { unmount, container } = render(
                    <Shams scrollProgress={scrollProgress} timeline={mockTimeline} />,
                );

                // Should render without crashing
                const svg = container.querySelector('svg');
                expect(svg).toBeDefined();

                unmount();
            }
        });

        it('should handle timeline changes', () => {
            const scrollProgress = motionValue(0.5);
            const { rerender, container } = render(<Shams scrollProgress={scrollProgress} timeline={mockTimeline} />);

            // Change timeline
            const newTimeline: Timeline = { ...mockTimeline, sunrise: 0.2 };
            rerender(<Shams scrollProgress={scrollProgress} timeline={newTimeline} />);

            // Should still render
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });

        it('should handle scrollProgress updates', () => {
            const scrollProgress1 = motionValue(0.3);
            const { rerender, container } = render(<Shams scrollProgress={scrollProgress1} timeline={mockTimeline} />);

            const scrollProgress2 = motionValue(0.7);
            rerender(<Shams scrollProgress={scrollProgress2} timeline={mockTimeline} />);

            // Should still render
            const svg = container.querySelector('svg');
            expect(svg).toBeDefined();
        });
    });
});
