import { CopyIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SITE_NAME, SITE_URL } from '@/config/seo';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { formatCitation } from '@/lib/quotes';
import { cn } from '@/lib/utils';

/**
 * Watermark appended to copied quotes for attribution
 */
const QUOTE_WATERMARK = `\n\nShared from ${SITE_NAME} [${SITE_URL}]`;

/**
 * Character limit beyond which a quote is truncated with click-to-expand
 */
const QUOTE_TRUNCATE_LENGTH = 160;

type QuoteCardProps = {
    /** Whether the sky is past Maghrib, so the moon can show through the card */
    isAfterMaghrib?: boolean;
};

/**
 * Displays a motivational Islamic quote with copy functionality and expandable truncation.
 *
 * Features:
 * - Truncation with click-to-expand for long quotes (above threshold)
 * - Animated text reveal (fade-in by line)
 * - Formatted citation with optional URL link
 * - Copy to clipboard with attribution watermark
 * - Toast notifications for copy feedback
 *
 * @returns Quote card with copy button, or null if no quote available
 */
export function QuoteCard({ isAfterMaghrib = false }: QuoteCardProps) {
    const { quote } = useMotivationalQuote();
    const [isExpanded, setIsExpanded] = useState(false);

    const copyQuote = async () => {
        if (!quote) {
            return;
        }

        try {
            const citation = formatCitation(quote);
            await navigator.clipboard.writeText(`${quote.body} - [${citation}]${QUOTE_WATERMARK}`);
            toast.success('Copied');
        } catch (error) {
            console.warn('Clipboard copy failed', error);
            toast.error('Error');
        }
    };

    if (!quote) {
        return null;
    }

    const isLong = quote.body.length > QUOTE_TRUNCATE_LENGTH;
    const displayText = isLong && !isExpanded ? `${quote.body.slice(0, QUOTE_TRUNCATE_LENGTH).trim()}…` : quote.body;
    const citation = formatCitation(quote);

    return (
        <section
            className={cn(
                'relative w-full rounded-2xl border border-white/15 p-3.5 text-foreground shadow-lg sm:p-4',
                isAfterMaghrib ? 'bg-background/25 backdrop-blur-none' : 'bg-background/60 backdrop-blur-xl',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <blockquote className="flex-1 space-y-2 text-xs sm:text-sm">
                    <div className="text-foreground/90 leading-relaxed">
                        <TextAnimate animation="fadeIn" as="span" by="line" className="whitespace-pre-wrap font-medium">
                            {displayText}
                        </TextAnimate>
                        {isLong && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded((prev) => !prev)}
                                className="ml-1.5 inline-flex cursor-pointer items-center font-semibold text-primary/90 text-xs underline underline-offset-2 transition-colors hover:text-primary"
                            >
                                {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                    <footer className="text-[11px] text-foreground/75 italic sm:text-xs">
                        —{' '}
                        {quote.url ? (
                            <Link
                                href={quote.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline transition-colors hover:text-foreground"
                            >
                                {citation}
                            </Link>
                        ) : (
                            citation
                        )}
                    </footer>
                </blockquote>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            aria-label="Copy"
                            className="h-7 w-7 shrink-0 rounded-full"
                            onClick={copyQuote}
                            size="icon"
                            variant="ghost"
                        >
                            <CopyIcon className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                </Tooltip>
            </div>
            <p className="mt-2 text-[10px] text-foreground/50 sm:text-xs">Tap the copy icon to share with friends.</p>
        </section>
    );
}
