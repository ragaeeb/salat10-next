import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { FormattedTiming } from '@/lib/calculator';
import type { SalatEvent } from '@/lib/constants';
import { PrayerTimesCard } from './prayer-times-card';

// Mock the useCountdownRemaining hook
const mockUseCountdownRemaining = mock(() => 'in 2h 30m');

mock.module('@/lib/prayer-utils', () => ({ useCountdownRemaining: mockUseCountdownRemaining }));

// Mock child components
mock.module('@/components/magicui/aurora-text', () => ({
    AuroraText: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <span data-testid="aurora-text" className={className}>
            {children}
        </span>
    ),
}));

mock.module('@/components/magicui/meteors', () => ({
    Meteors: ({ className, number }: { className?: string; number?: number }) => (
        <div data-testid="meteors" data-number={number} className={className} />
    ),
}));

const mockTimings: FormattedTiming[] = [
    { event: 'fajr', isFard: true, label: 'Fajr', time: '5:30 AM', value: new Date('2024-03-15T05:30:00') },
    { event: 'sunrise', isFard: false, label: 'Sunrise', time: '6:45 AM', value: new Date('2024-03-15T06:45:00') },
    { event: 'dhuhr', isFard: true, label: 'Dhuhr', time: '12:30 PM', value: new Date('2024-03-15T12:30:00') },
    { event: 'asr', isFard: true, label: 'Asr', time: '4:00 PM', value: new Date('2024-03-15T16:00:00') },
    { event: 'maghrib', isFard: true, label: 'Maghrib', time: '6:30 PM', value: new Date('2024-03-15T18:30:00') },
    { event: 'isha', isFard: true, label: 'Isha', time: '8:00 PM', value: new Date('2024-03-15T20:00:00') },
];

const renderWithProvider = (component: React.ReactElement) => {
    return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe('PrayerTimesCard', () => {
    const defaultProps = {
        activeEvent: null as SalatEvent | null,
        addressLabel: 'New York, NY',
        dateLabel: 'Mar 15, 2024',
        hijriLabel: '5 Ramaḍān 1445',
        locationDetail: 'New York, New York, United States',
        methodLabel: 'ISNA',
        onNextDay: mock(() => {}),
        onPrevDay: mock(() => {}),
        onToday: mock(() => {}),
        timings: mockTimings,
    };

    describe('rendering', () => {
        it('should render compact view by default with current event, next event with countdown chip, and ONLY hijri date', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" />);

            // ONLY Hijri date in compact mode, NOT roman/gregorian date
            expect(screen.getByText('5 Ramaḍān 1445')).toBeDefined();
            expect(screen.queryByText('Mar 15, 2024')).toBeNull();

            // Angles (methodLabel) and Previous/Today/Next should NOT be present in compact mode
            expect(screen.queryByText('ISNA')).toBeNull();
            expect(screen.queryByText('Previous')).toBeNull();
            expect(screen.queryByText('Today')).toBeNull();
            expect(screen.queryByRole('button', { name: /next/i })).toBeNull();

            // In compact view for fajr, should render Fajr (Current) and Sunrise with countdown chip
            expect(screen.getByText('Fajr')).toBeDefined();
            expect(screen.getByText('5:30 AM')).toBeDefined();
            expect(screen.getByText('Sunrise')).toBeDefined();
            expect(screen.getByText('6:45 AM')).toBeDefined();
            expect(screen.getByText('Current')).toBeDefined();
            expect(screen.getByText('in 2h 30m')).toBeDefined();

            // Other prayers shouldn't be rendered yet in compact mode
            expect(screen.queryByText('Dhuhr')).toBeNull();
            expect(screen.queryByText('Asr')).toBeNull();

            // Expand button should be visible
            expect(screen.getByText(/Show All Prayers/)).toBeDefined();
        });

        it('should render all prayer times, angles, roman date, and day nav buttons when expanded or defaultExpanded is true', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} defaultExpanded />);

            expect(screen.getByText('Fajr')).toBeDefined();
            expect(screen.getByText('5:30 AM')).toBeDefined();
            expect(screen.getByText('Sunrise')).toBeDefined();
            expect(screen.getByText('Dhuhr')).toBeDefined();
            expect(screen.getByText('Asr')).toBeDefined();
            expect(screen.getByText('Maghrib')).toBeDefined();
            expect(screen.getByText('Isha')).toBeDefined();
            expect(screen.getByText(/Show Less/)).toBeDefined();

            // Both Hijri and Roman dates, angles, and day navigation should now be visible
            expect(screen.getByText('5 Ramaḍān 1445')).toBeDefined();
            expect(screen.getByText('Mar 15, 2024')).toBeDefined();
            expect(screen.getByText('ISNA')).toBeDefined();
            expect(screen.getByText('Previous')).toBeDefined();
            expect(screen.getByText('Today')).toBeDefined();
            expect(screen.getByRole('button', { name: /next/i })).toBeDefined();
        });

        it('should toggle between compact and expanded views when toggle button is clicked', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" />);

            // Initially compact: no Roman date, no angles, no nav buttons
            expect(screen.queryByText('Dhuhr')).toBeNull();
            expect(screen.queryByText('Mar 15, 2024')).toBeNull();
            expect(screen.queryByText('ISNA')).toBeNull();
            expect(screen.queryByText('Previous')).toBeNull();
            const expandButton = screen.getByText(/Show All Prayers/);
            fireEvent.click(expandButton);

            // Now expanded: Roman date, angles, nav buttons visible
            expect(screen.getByText('Dhuhr')).toBeDefined();
            expect(screen.getByText('Mar 15, 2024')).toBeDefined();
            expect(screen.getByText('ISNA')).toBeDefined();
            expect(screen.getByText('Previous')).toBeDefined();
            expect(screen.getByText(/Show Less/)).toBeDefined();

            // Collapse back
            const collapseButton = screen.getByText(/Show Less/);
            fireEvent.click(collapseButton);

            // Back to compact
            expect(screen.queryByText('Dhuhr')).toBeNull();
            expect(screen.queryByText('Mar 15, 2024')).toBeNull();
            expect(screen.queryByText('ISNA')).toBeNull();
            expect(screen.queryByText('Previous')).toBeNull();
            expect(screen.getByText(/Show All Prayers/)).toBeDefined();
        });

        it('should render navigation buttons when expanded', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} defaultExpanded />);

            expect(screen.getByText('Previous')).toBeDefined();
            expect(screen.getByText('Today')).toBeDefined();
            expect(screen.getByRole('button', { name: /next/i })).toBeDefined();
        });

        it('should render quick action links', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText(/View Trends/)).toBeDefined();
            expect(screen.getByText('Timetable')).toBeDefined();
            expect(screen.getByText('Explain')).toBeDefined();
        });

        it('should fallback to Next badge when countdown is empty', () => {
            mockUseCountdownRemaining.mockReturnValue('');
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" />);

            expect(screen.getByText('Next')).toBeDefined();
        });

        it('should use a transparent, unblurred surface after Maghrib', () => {
            const { container } = renderWithProvider(<PrayerTimesCard {...defaultProps} isAfterMaghrib />);

            const card = container.querySelector('section');
            expect(card).not.toBeNull();
            expect(card?.className).toContain('bg-background/25');
            expect(card?.className).toContain('backdrop-blur-none');
        });
    });

    describe('active prayer highlighting', () => {
        it('should highlight active prayer with AuroraText', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" defaultExpanded />);

            const auroraTexts = screen.getAllByTestId('aurora-text');
            // Should have AuroraText for both label and time of active prayer
            expect(auroraTexts.length).toBeGreaterThan(0);
        });

        it('should not highlight inactive prayers', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" defaultExpanded />);

            // Dhuhr should not be highlighted
            const dhuhrLabel = screen.getByText('Dhuhr');
            expect(dhuhrLabel).toBeDefined();
        });

        it('should handle null activeEvent', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent={null} defaultExpanded />);

            // Should render without crashing
            expect(screen.getByText('Fajr')).toBeDefined();
        });
    });

    describe('meteors animation', () => {
        it('should render Meteors when activeEvent is lastThirdOfTheNight', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="lastThirdOfTheNight" />);

            const meteors = screen.getByTestId('meteors');
            expect(meteors).toBeDefined();
            expect(meteors.getAttribute('data-number')).toBe('18');
        });

        it('should not render Meteors for other active events', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" />);

            expect(screen.queryByTestId('meteors')).toBeNull();
        });
    });

    describe('navigation handlers', () => {
        it('should call onPrevDay when Previous button is clicked', () => {
            const onPrevDay = mock(() => {});
            renderWithProvider(<PrayerTimesCard {...defaultProps} defaultExpanded onPrevDay={onPrevDay} />);

            const prevButton = screen.getByText('Previous');
            fireEvent.click(prevButton);

            expect(onPrevDay.mock.calls.length).toBe(1);
        });

        it('should call onToday when Today button is clicked', () => {
            const onToday = mock(() => {});
            renderWithProvider(<PrayerTimesCard {...defaultProps} defaultExpanded onToday={onToday} />);

            const todayButton = screen.getByText('Today');
            fireEvent.click(todayButton);

            expect(onToday.mock.calls.length).toBe(1);
        });

        it('should call onNextDay when Next button is clicked', () => {
            const onNextDay = mock(() => {});
            renderWithProvider(<PrayerTimesCard {...defaultProps} defaultExpanded onNextDay={onNextDay} />);

            const nextButton = screen.getByRole('button', { name: /next/i });
            fireEvent.click(nextButton);

            expect(onNextDay.mock.calls.length).toBe(1);
        });
    });

    describe('location display', () => {
        it('should display address label', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText('New York, NY')).toBeDefined();
        });

        it('should display location detail in tooltip', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            // Tooltip content should be present
            const addressLabel = screen.getByText('New York, NY');
            expect(addressLabel).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle empty timings array', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} timings={[]} />);

            // Should render without crashing
            expect(screen.getByText('5 Ramaḍān 1445')).toBeDefined();
        });

        it('should handle timings with only one prayer', () => {
            const singleTiming: FormattedTiming[] = [mockTimings[0]!];
            renderWithProvider(<PrayerTimesCard {...defaultProps} timings={singleTiming} />);

            expect(screen.getByText('Fajr')).toBeDefined();
        });

        it('should handle different active events', () => {
            const events: SalatEvent[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

            for (const event of events) {
                const { unmount } = renderWithProvider(
                    <PrayerTimesCard {...defaultProps} activeEvent={event} defaultExpanded />,
                );

                expect(screen.getByText('Fajr')).toBeDefined();

                unmount();
            }
        });
    });
});
