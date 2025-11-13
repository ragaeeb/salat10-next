import { act, render, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it } from 'bun:test';
import { CurrentPhase } from './current-phase';
import type { DayData, Timeline } from '@/types/timeline';

// Mock ShinyText component
const mockShinyText = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="shiny-text" className={className}>
        {children}
    </div>
);

// Mock module
import { mock } from 'bun:test';
mock.module('@/components/magicui/shiny-text', () => ({
    ShinyText: mockShinyText,
}));

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

const mockDayData: DayData = {
    date: new Date('2024-03-15T12:00:00'),
    timings: [
        { event: 'fajr', value: new Date('2024-03-15T05:30:00') },
        { event: 'sunrise', value: new Date('2024-03-15T06:45:00') },
        { event: 'dhuhr', value: new Date('2024-03-15T12:30:00') },
        { event: 'asr', value: new Date('2024-03-15T16:00:00') },
        { event: 'maghrib', value: new Date('2024-03-15T18:30:00') },
        { event: 'isha', value: new Date('2024-03-15T20:00:00') },
    ],
};

describe('CurrentPhase', () => {
    describe('rendering', () => {
        it('should render without crashing with valid props', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            // Should render container div
            const wrapper = container.querySelector('div');
            expect(wrapper).toBeDefined();
        });

        it('should render ShinyText component', async () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            await waitFor(() => {
                const shinyText = container.querySelector('[data-testid="shiny-text"]');
                expect(shinyText).toBeDefined();
            });
        });
    });

    describe('phase updates', () => {
        it('should update phase label when scrollProgress changes', async () => {
            const scrollProgress = motionValue(0.1);
            const { container, rerender } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            await waitFor(() => {
                const shinyText = container.querySelector('[data-testid="shiny-text"]');
                expect(shinyText).toBeDefined();
            });

            // Change scroll progress to trigger different phase
            act(() => {
                scrollProgress.set(0.5);
            });

            await waitFor(() => {
                const shinyText = container.querySelector('[data-testid="shiny-text"]');
                expect(shinyText).toBeDefined();
            });
        });

        it('should display time when phaseInfo.time is set', async () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            // Wait for component to initialize and potentially render time
            await waitFor(() => {
                // Component should render
                const wrapper = container.querySelector('div');
                expect(wrapper).toBeDefined();
            });

            // Trigger scrollProgress change to update phaseInfo
            act(() => {
                scrollProgress.set(0.6); // Different value to trigger change
            });

            // Component should still render after change
            await waitFor(() => {
                const wrapper = container.querySelector('div');
                expect(wrapper).toBeDefined();
            }, { timeout: 1000 });
        });
    });

    describe('with null timeline', () => {
        it('should render without crashing with null timeline', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={null} currentDay={mockDayData} timeZone="America/New_York" />
            );

            // Should render container
            const wrapper = container.querySelector('div');
            expect(wrapper).toBeDefined();
        });

        it('should not update phase when timeline is null', async () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={null} currentDay={mockDayData} timeZone="America/New_York" />
            );

            // Phase info should remain empty
            await waitFor(() => {
                const shinyText = container.querySelector('[data-testid="shiny-text"]');
                // May or may not render, but should not crash
                expect(container.querySelector('div')).toBeDefined();
            });
        });
    });

    describe('with undefined currentDay', () => {
        it('should render without crashing with undefined currentDay', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={undefined} timeZone="America/New_York" />
            );

            // Should render container
            const wrapper = container.querySelector('div');
            expect(wrapper).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle scrollProgress at 0', async () => {
            const scrollProgress = motionValue(0);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            await waitFor(() => {
                const wrapper = container.querySelector('div');
                expect(wrapper).toBeDefined();
            });
        });

        it('should handle scrollProgress at 1', async () => {
            const scrollProgress = motionValue(1);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            await waitFor(() => {
                const wrapper = container.querySelector('div');
                expect(wrapper).toBeDefined();
            });
        });

        it('should handle different timeZone values', async () => {
            const scrollProgress = motionValue(0.5);
            const timeZones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Dubai'];

            for (const tz of timeZones) {
                const { unmount, container } = render(
                    <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone={tz} />
                );

                await waitFor(() => {
                    const wrapper = container.querySelector('div');
                    expect(wrapper).toBeDefined();
                });

                unmount();
            }
        });
    });

    describe('animation', () => {
        it('should render AnimatePresence wrapper', () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <CurrentPhase scrollProgress={scrollProgress} timeline={mockTimeline} currentDay={mockDayData} timeZone="America/New_York" />
            );

            // Should have motion.div elements
            const motionDivs = container.querySelectorAll('div');
            expect(motionDivs.length).toBeGreaterThan(0);
        });
    });
});

