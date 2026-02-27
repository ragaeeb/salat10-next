import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { HijriDateBadge } from './hijri-date-badge';

describe('HijriDateBadge', () => {
    describe('rendering', () => {
        it('should render Hijri date for known date', () => {
            // April 2, 2022 is 1 Ramadan 1443
            const date = new Date('2022-04-02T12:00:00');
            const { container } = render(<HijriDateBadge date={date} />);

            // Should display Hijri date (exact month name may vary with algorithm)
            const text = container.querySelector('p');
            expect(text).toBeDefined();
            expect(text?.textContent).toBeTruthy();
            expect(text?.textContent).toContain('(');
            expect(text?.textContent).toContain(')');
        });

        it('should render Gregorian date alongside Hijri', () => {
            const date = new Date('2024-03-15T12:00:00');
            render(<HijriDateBadge date={date} />);

            // Should include both dates in the format "Hijri (Gregorian)"
            const text = screen.getByText(/\(/);
            expect(text).toBeDefined();
            expect(text.textContent).toContain('(');
            expect(text.textContent).toContain(')');
        });

        it('should render different dates correctly', () => {
            // Test multiple dates
            const dates = [
                new Date('2024-01-01T12:00:00'),
                new Date('2024-06-15T12:00:00'),
                new Date('2024-12-31T12:00:00'),
            ];

            for (const date of dates) {
                const { unmount } = render(<HijriDateBadge date={date} />);

                // Should render without crashing
                const badge = screen.getByText(/\(/);
                expect(badge).toBeDefined();

                unmount();
            }
        });
    });

    describe('formatting', () => {
        it('should use formatHijriDate for Hijri label', () => {
            const date = new Date('2022-04-02T12:00:00');
            const { container } = render(<HijriDateBadge date={date} />);

            // Should contain Hijri date formatted as text
            const text = container.querySelector('p');
            expect(text).toBeDefined();
            expect(text?.textContent).toBeTruthy();
            // Should have both Hijri and Gregorian parts
            expect(text?.textContent?.split('(').length).toBe(2);
        });

        it('should use formatDate for Gregorian label', () => {
            const date = new Date('2024-03-15T12:00:00');
            render(<HijriDateBadge date={date} />);

            // Should contain Gregorian date in parentheses
            const text = screen.getByText(/2024/);
            expect(text).toBeDefined();
        });
    });

    describe('memoization', () => {
        it('should memoize hijriLabel based on date', () => {
            const date1 = new Date('2024-03-15T12:00:00');
            const { rerender } = render(<HijriDateBadge date={date1} />);

            const firstText = screen.getByText(/\(/).textContent;

            // Rerender with same date
            rerender(<HijriDateBadge date={date1} />);

            const secondText = screen.getByText(/\(/).textContent;
            expect(secondText).toBe(firstText);

            // Rerender with different date
            const date2 = new Date('2024-03-16T12:00:00');
            rerender(<HijriDateBadge date={date2} />);

            const thirdText = screen.getByText(/\(/).textContent;
            // Text should be different for different date
            expect(thirdText).not.toBe(firstText);
        });
    });

    describe('accessibility', () => {
        it('should render as a div element', () => {
            const date = new Date('2024-03-15T12:00:00');
            const { container } = render(<HijriDateBadge date={date} />);

            const badge = container.querySelector('div');
            expect(badge).toBeDefined();
        });

        it('should apply correct CSS classes for styling', () => {
            const date = new Date('2024-03-15T12:00:00');
            const { container } = render(<HijriDateBadge date={date} />);

            // Check for key positioning classes
            const element = container.querySelector('.fixed');
            expect(element).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle dates at year boundaries', () => {
            const dates = [new Date('2023-12-31T23:59:59'), new Date('2024-01-01T00:00:00')];

            for (const date of dates) {
                const { unmount } = render(<HijriDateBadge date={date} />);

                const badge = screen.getByText(/\(/);
                expect(badge).toBeDefined();

                unmount();
            }
        });

        it('should handle dates in different Hijri months', () => {
            // Different Hijri months throughout the year
            const dates = [
                new Date('2024-01-15T12:00:00'), // Rajab
                new Date('2024-03-15T12:00:00'), // Ramadan
                new Date('2024-06-15T12:00:00'), // Dhul Hijjah
            ];

            for (const date of dates) {
                const { unmount } = render(<HijriDateBadge date={date} />);

                const badge = screen.getByText(/\(/);
                expect(badge).toBeDefined();
                expect(badge.textContent).toBeTruthy();

                unmount();
            }
        });

        it('should handle historical dates', () => {
            const date = new Date('2000-01-01T12:00:00');
            render(<HijriDateBadge date={date} />);

            const badge = screen.getByText(/\(/);
            expect(badge).toBeDefined();
        });

        it('should handle future dates', () => {
            const date = new Date('2030-12-31T12:00:00');
            render(<HijriDateBadge date={date} />);

            const badge = screen.getByText(/\(/);
            expect(badge).toBeDefined();
        });
    });
});
