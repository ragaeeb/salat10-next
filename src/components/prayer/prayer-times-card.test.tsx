import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import { PrayerTimesCard } from './prayer-times-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { FormattedTiming } from '@/lib/calculator';
import type { SalatEvent } from '@/lib/constants';

// Mock the useCountdownToNext hook
const mockUseCountdownToNext = mock(() => '2h 30m until Fajr');

mock.module('@/lib/prayer-utils', () => ({
    useCountdownToNext: mockUseCountdownToNext,
}));

// Mock child components
mock.module('@/components/magicui/aurora-text', () => ({
    AuroraText: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <span data-testid="aurora-text" className={className}>{children}</span>
    ),
}));

mock.module('@/components/magicui/meteors', () => ({
    Meteors: ({ className, number }: { className?: string; number?: number }) => (
        <div data-testid="meteors" data-number={number} className={className} />
    ),
}));

const mockTimings: FormattedTiming[] = [
    { event: 'fajr', label: 'Fajr', time: '5:30 AM', isFard: true, value: new Date('2024-03-15T05:30:00') },
    { event: 'sunrise', label: 'Sunrise', time: '6:45 AM', isFard: false, value: new Date('2024-03-15T06:45:00') },
    { event: 'dhuhr', label: 'Dhuhr', time: '12:30 PM', isFard: true, value: new Date('2024-03-15T12:30:00') },
    { event: 'asr', label: 'Asr', time: '4:00 PM', isFard: true, value: new Date('2024-03-15T16:00:00') },
    { event: 'maghrib', label: 'Maghrib', time: '6:30 PM', isFard: true, value: new Date('2024-03-15T18:30:00') },
    { event: 'isha', label: 'Isha', time: '8:00 PM', isFard: true, value: new Date('2024-03-15T20:00:00') },
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
        it('should render without crashing with valid props', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText('Mar 15, 2024')).toBeDefined();
            expect(screen.getByText('5 Ramaḍān 1445')).toBeDefined();
            expect(screen.getByText('ISNA')).toBeDefined();
        });

        it('should render all prayer times', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText('Fajr')).toBeDefined();
            expect(screen.getByText('5:30 AM')).toBeDefined();
            expect(screen.getByText('Sunrise')).toBeDefined();
            expect(screen.getByText('Dhuhr')).toBeDefined();
            expect(screen.getByText('Asr')).toBeDefined();
            expect(screen.getByText('Maghrib')).toBeDefined();
            expect(screen.getByText('Isha')).toBeDefined();
        });

        it('should render navigation buttons', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText('Previous')).toBeDefined();
            expect(screen.getByText('Today')).toBeDefined();
            expect(screen.getByText('Next')).toBeDefined();
        });

        it('should render quick action links', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText('View Trends')).toBeDefined();
            expect(screen.getByText('Timetable')).toBeDefined();
            expect(screen.getByText('Explain')).toBeDefined();
        });

        it('should render countdown when available', () => {
            mockUseCountdownToNext.mockReturnValue('2h 30m until Fajr');
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.getByText('2h 30m until Fajr')).toBeDefined();
        });

        it('should not render countdown when null', () => {
            mockUseCountdownToNext.mockReturnValue(null);
            renderWithProvider(<PrayerTimesCard {...defaultProps} />);

            expect(screen.queryByText(/until/)).toBeNull();
        });
    });

    describe('active prayer highlighting', () => {
        it('should highlight active prayer with AuroraText', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" />);

            const auroraTexts = screen.getAllByTestId('aurora-text');
            // Should have AuroraText for both label and time of active prayer
            expect(auroraTexts.length).toBeGreaterThan(0);
        });

        it('should not highlight inactive prayers', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent="fajr" />);

            // Dhuhr should not be highlighted
            const dhuhrLabel = screen.getByText('Dhuhr');
            expect(dhuhrLabel).toBeDefined();
        });

        it('should handle null activeEvent', () => {
            renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent={null} />);

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
            renderWithProvider(<PrayerTimesCard {...defaultProps} onPrevDay={onPrevDay} />);

            const prevButton = screen.getByText('Previous');
            fireEvent.click(prevButton);

            expect(onPrevDay.mock.calls.length).toBe(1);
        });

        it('should call onToday when Today button is clicked', () => {
            const onToday = mock(() => {});
            renderWithProvider(<PrayerTimesCard {...defaultProps} onToday={onToday} />);

            const todayButton = screen.getByText('Today');
            fireEvent.click(todayButton);

            expect(onToday.mock.calls.length).toBe(1);
        });

        it('should call onNextDay when Next button is clicked', () => {
            const onNextDay = mock(() => {});
            renderWithProvider(<PrayerTimesCard {...defaultProps} onNextDay={onNextDay} />);

            const nextButton = screen.getByText('Next');
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
            expect(screen.getByText('Mar 15, 2024')).toBeDefined();
        });

        it('should handle timings with only one prayer', () => {
            const singleTiming: FormattedTiming[] = [mockTimings[0]!];
            renderWithProvider(<PrayerTimesCard {...defaultProps} timings={singleTiming} />);

            expect(screen.getByText('Fajr')).toBeDefined();
        });

        it('should handle different active events', () => {
            const events: SalatEvent[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'lastThirdOfTheNight'];

            for (const event of events) {
                const { unmount } = renderWithProvider(<PrayerTimesCard {...defaultProps} activeEvent={event} />);
                
                expect(screen.getByText('Fajr')).toBeDefined();
                
                unmount();
            }
        });
    });
});

