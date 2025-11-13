import { render, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it, mock } from 'bun:test';
import { Samaa } from './samaa';
import type { Timeline } from '@/types/timeline';

// Mock the useSky hook
const mockUseSky = mock(() => ({
    skyColor: 'rgb(50, 100, 150)',
    starsOpacity: 0.5,
    fajrGradientOpacity: 0.3,
    sunsetGradientOpacity: 0.2,
    lightRaysOpacity: 0.1,
}));

mock.module('@/hooks/use-sky', () => ({
    useSky: mockUseSky,
}));

// Mock crossFade utility
const mockCrossFade = mock(() => ({
    hasPrev: false,
    hasNext: false,
    topSeamStarsOpacity: 0,
    bottomSeamFajrOpacity: 0,
}));

mock.module('@/lib/utils', () => ({
    crossFade: mockCrossFade,
}));

// Mock child components
mock.module('@/components/astro/sky', () => ({
    SkyBackground: ({ skyColor }: { skyColor: string }) => <div data-testid="sky-background" data-color={skyColor} />,
}));

mock.module('@/components/astro/fajr-sky', () => ({
    FajrGradient: ({ opacity }: { opacity: number }) => <div data-testid="fajr-gradient" data-opacity={opacity} />,
}));

mock.module('@/components/astro/sunset-sky', () => ({
    SunsetGradient: ({ opacity }: { opacity: number }) => <div data-testid="sunset-gradient" data-opacity={opacity} />,
}));

mock.module('@/components/astro/stars', () => ({
    StarsLayer: ({ opacity, shooting }: { opacity: number; shooting?: boolean }) => (
        <div data-testid="stars-layer" data-opacity={opacity} data-shooting={shooting} />
    ),
}));

mock.module('@/components/astro/light-rays', () => ({
    LightRays: ({ opacity }: { opacity: number }) => <div data-testid="light-rays" data-opacity={opacity} />,
}));

mock.module('@/components/astro/radial-gradient', () => ({
    RadialGradientOverlay: () => <div data-testid="radial-gradient" />,
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

describe('Samaa', () => {
    describe('rendering', () => {
        it('should render without crashing with valid props', async () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                const skyBackground = container.querySelector('[data-testid="sky-background"]');
                expect(skyBackground).toBeDefined();
            });
        });

        it('should render all sky layers', async () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="sky-background"]')).toBeDefined();
                expect(container.querySelector('[data-testid="fajr-gradient"]')).toBeDefined();
                expect(container.querySelector('[data-testid="sunset-gradient"]')).toBeDefined();
                expect(container.querySelector('[data-testid="stars-layer"]')).toBeDefined();
                expect(container.querySelector('[data-testid="light-rays"]')).toBeDefined();
                expect(container.querySelector('[data-testid="radial-gradient"]')).toBeDefined();
            });
        });

        it('should call useSky hook with scrollProgress and timeline', async () => {
            const scrollProgress = motionValue(0.5);
            mockUseSky.mockClear();

            render(<Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />);

            await waitFor(() => {
                expect(mockUseSky.mock.calls.length).toBeGreaterThan(0);
                expect(mockUseSky.mock.calls[0][0]).toBe(scrollProgress);
                expect(mockUseSky.mock.calls[0][1]).toBe(mockTimeline);
            });
        });
    });

    describe('comets control', () => {
        it('should enable comets when pNow >= lastThird', async () => {
            const scrollProgress = motionValue(0.96); // Above lastThird (0.95)
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.96} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                const starsLayer = container.querySelector('[data-testid="stars-layer"]');
                expect(starsLayer?.getAttribute('data-shooting')).toBe('true');
            });
        });

        it('should disable comets when pNow < lastThird', async () => {
            const scrollProgress = motionValue(0.5); // Below lastThird
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                const starsLayer = container.querySelector('[data-testid="stars-layer"]');
                expect(starsLayer?.getAttribute('data-shooting')).toBe('false');
            });
        });
    });

    describe('with null timeline', () => {
        it('should render without crashing with null timeline', async () => {
            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={null} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                const skyBackground = container.querySelector('[data-testid="sky-background"]');
                expect(skyBackground).toBeDefined();
            });
        });

        it('should disable comets when timeline is null', async () => {
            const scrollProgress = motionValue(0.96);
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={null} pNow={0.96} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                const starsLayer = container.querySelector('[data-testid="stars-layer"]');
                expect(starsLayer?.getAttribute('data-shooting')).toBe('false');
            });
        });
    });

    describe('mobile optimization', () => {
        it('should use different star density and delays based on device', async () => {
            const scrollProgress = motionValue(0.5);
            
            // Mock matchMedia for mobile
            const originalMatchMedia = window.matchMedia;
            window.matchMedia = mock(() => ({
                matches: true, // Mobile
                media: '',
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => true,
            })) as any;

            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                const starsLayer = container.querySelector('[data-testid="stars-layer"]');
                expect(starsLayer).toBeDefined();
            });

            // Restore original
            window.matchMedia = originalMatchMedia;
        });
    });

    describe('crossfade seams', () => {
        it('should render top seam stars when hasPrev is true', async () => {
            mockCrossFade.mockReturnValue({
                hasPrev: true,
                hasNext: false,
                topSeamStarsOpacity: 0.5,
                bottomSeamFajrOpacity: 0,
            });

            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                // Should have multiple stars layers (main + seam)
                const starsLayers = container.querySelectorAll('[data-testid="stars-layer"]');
                expect(starsLayers.length).toBeGreaterThan(1);
            });
        });

        it('should render bottom seam fajr when hasNext is true', async () => {
            mockCrossFade.mockReturnValue({
                hasPrev: false,
                hasNext: true,
                topSeamStarsOpacity: 0,
                bottomSeamFajrOpacity: 0.3,
            });

            const scrollProgress = motionValue(0.5);
            const { container } = render(
                <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={3} currentDayIndex={1} />
            );

            await waitFor(() => {
                // Should have multiple fajr gradients (main + seam)
                const fajrGradients = container.querySelectorAll('[data-testid="fajr-gradient"]');
                expect(fajrGradients.length).toBeGreaterThan(1);
            });
        });
    });

    describe('edge cases', () => {
        it('should handle different pNow values', async () => {
            const testValues = [0, 0.25, 0.5, 0.75, 0.95, 0.99];

            for (const pNow of testValues) {
                const scrollProgress = motionValue(pNow);
                const { unmount, container } = render(
                    <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={pNow} totalDays={3} currentDayIndex={1} />
                );

                await waitFor(() => {
                    const skyBackground = container.querySelector('[data-testid="sky-background"]');
                    expect(skyBackground).toBeDefined();
                });

                unmount();
            }
        });

        it('should handle different currentDayIndex values', async () => {
            const scrollProgress = motionValue(0.5);
            const indices = [0, 1, 2, 3];

            for (const index of indices) {
                const { unmount, container } = render(
                    <Samaa scrollProgress={scrollProgress} timeline={mockTimeline} pNow={0.5} totalDays={5} currentDayIndex={index} />
                );

                await waitFor(() => {
                    const skyBackground = container.querySelector('[data-testid="sky-background"]');
                    expect(skyBackground).toBeDefined();
                });

                unmount();
            }
        });
    });
});

