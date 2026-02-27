import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Quote } from '@/types/quote';
import { QuoteCard } from './quote-card';

// Mock useMotivationalQuote hook
const mockUseMotivationalQuote = mock(() => ({ error: false, loading: false, quote: null }));

mock.module('@/hooks/use-motivational-quote', () => ({ useMotivationalQuote: mockUseMotivationalQuote }));

// Mock toast
const mockToastSuccess = mock(() => {});
const mockToastError = mock(() => {});

mock.module('sonner', () => ({ toast: { error: mockToastError, success: mockToastSuccess } }));

// Mock TextAnimate component
mock.module('@/components/magicui/text-animate', () => ({
    TextAnimate: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="text-animate" className={className}>
            {children}
        </div>
    ),
}));

// Mock formatCitation
const mockFormatCitation = mock((quote: Quote) => {
    const parts: string[] = [quote.title];
    if (quote.part_number !== undefined && quote.part_page !== undefined) {
        parts.push(`${quote.part_number}/${quote.part_page}`);
    }
    parts.push(quote.author);
    return parts.join(', ');
});

mock.module('@/lib/quotes', () => ({ formatCitation: mockFormatCitation }));

// Mock clipboard API
const mockWriteText = mock(() => Promise.resolve());

beforeEach(() => {
    // Mock navigator.clipboard using Object.defineProperty
    Object.defineProperty(global, 'navigator', {
        configurable: true,
        value: { ...global.navigator, clipboard: { writeText: mockWriteText } },
        writable: true,
    });
    mockWriteText.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    mockFormatCitation.mockClear();
});

afterEach(() => {
    mockUseMotivationalQuote.mockClear();
});

const renderWithProvider = (component: React.ReactElement) => {
    return render(<TooltipProvider>{component}</TooltipProvider>);
};

const mockQuote: Quote = {
    author: 'Test Author',
    body: 'Test quote body',
    title: 'Test Title',
    url: 'https://example.com',
};

const mockQuoteWithoutUrl: Quote = { author: 'Test Author', body: 'Test quote body', title: 'Test Title' };

describe('QuoteCard', () => {
    describe('rendering', () => {
        it('should return null when quote is null', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: null });
            const { container } = render(<QuoteCard />);

            expect(container.firstChild).toBeNull();
        });

        it('should render quote card when quote is available', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            renderWithProvider(<QuoteCard />);

            expect(screen.getByText('Test quote body')).toBeDefined();
        });

        it('should render quote body', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            renderWithProvider(<QuoteCard />);

            const textAnimate = screen.getByTestId('text-animate');
            expect(textAnimate.textContent).toBe('Test quote body');
        });

        it('should render citation', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            renderWithProvider(<QuoteCard />);

            expect(mockFormatCitation.mock.calls.length).toBeGreaterThan(0);
        });

        it('should render citation as link when URL is present', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            renderWithProvider(<QuoteCard />);

            const link = screen.getByRole('link');
            expect(link).toBeDefined();
            expect(link.getAttribute('href')).toBe('https://example.com');
        });

        it('should render citation as text when URL is not present', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuoteWithoutUrl });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            renderWithProvider(<QuoteCard />);

            const link = screen.queryByRole('link');
            expect(link).toBeNull();
            // Citation should still be rendered as text
            expect(screen.getByText(/Test Author/)).toBeDefined();
        });

        it('should render copy button', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            renderWithProvider(<QuoteCard />);

            const copyButton = screen.getByRole('button', { name: /copy/i });
            expect(copyButton).toBeDefined();
        });

        it('should render help text', () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            renderWithProvider(<QuoteCard />);

            expect(screen.getByText(/Tap the copy icon to share with friends/)).toBeDefined();
        });
    });

    describe('copy functionality', () => {
        it('should copy quote to clipboard when copy button is clicked', async () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            renderWithProvider(<QuoteCard />);

            const copyButton = screen.getByRole('button', { name: /copy/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockWriteText.mock.calls.length).toBe(1);
            });

            // Should include quote body, citation, and watermark
            const copiedText = mockWriteText.mock.calls[0]![0] as string;
            expect(copiedText).toContain('Test quote body');
            expect(copiedText).toContain('Test Title, Test Author');
        });

        it('should show success toast on successful copy', async () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            renderWithProvider(<QuoteCard />);

            const copyButton = screen.getByRole('button', { name: /copy/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockToastSuccess.mock.calls.length).toBe(1);
                expect(mockToastSuccess.mock.calls[0]![0]).toBe('Copied');
            });
        });

        it('should show error toast on copy failure', async () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: mockQuote });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            mockWriteText.mockRejectedValue(new Error('Clipboard error'));
            renderWithProvider(<QuoteCard />);

            const copyButton = screen.getByRole('button', { name: /copy/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockToastError.mock.calls.length).toBe(1);
                expect(mockToastError.mock.calls[0]![0]).toBe('Error');
            });
        });

        it('should not copy when quote is null', async () => {
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: null });
            const { container } = render(<QuoteCard />);

            // Component returns null, so no button to click
            expect(container.firstChild).toBeNull();
            expect(mockWriteText.mock.calls.length).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('should handle quote without part numbers', () => {
            const quoteWithoutParts: Quote = { author: 'Test Author', body: 'Test quote', title: 'Test Title' };
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: quoteWithoutParts });
            mockFormatCitation.mockReturnValue('Test Title, Test Author');
            renderWithProvider(<QuoteCard />);

            expect(screen.getByText('Test quote')).toBeDefined();
        });

        it('should handle quote with empty body', () => {
            const emptyQuote: Quote = { author: 'Test Author', body: '', title: 'Test Title' };
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: emptyQuote });
            renderWithProvider(<QuoteCard />);

            const textAnimate = screen.getByTestId('text-animate');
            expect(textAnimate.textContent).toBe('');
        });

        it('should handle quote with very long body', () => {
            const longQuote: Quote = { author: 'Test Author', body: 'A'.repeat(1000), title: 'Test Title' };
            mockUseMotivationalQuote.mockReturnValue({ error: false, loading: false, quote: longQuote });
            renderWithProvider(<QuoteCard />);

            const textAnimate = screen.getByTestId('text-animate');
            expect(textAnimate.textContent).toBe('A'.repeat(1000));
        });
    });
});
