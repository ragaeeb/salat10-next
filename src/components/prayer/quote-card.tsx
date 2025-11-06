'use client';

import { CopyIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';
import { formatCitation } from '@/lib/quotes';

const QUOTE_WATERMARK = '\n\nShared from Salat10 [https://salat10.app]';

/**
 * Renders the motivational quote card with copy and animation affordances.
 */
export function QuoteCard() {
    const { quote } = useMotivationalQuote();

    const copyQuote = async () => {
        if (!quote) {
            return;
        }

        try {
            const citation = formatCitation(quote);
            await navigator.clipboard.writeText(`"${quote.body}" - [${citation}]${QUOTE_WATERMARK}`);
            toast.success('Copied');
        } catch (error) {
            console.warn('Clipboard copy failed', error);
            toast.error('Error');
        }
    };

    if (!quote) {
        return null;
    }

    const citation = formatCitation(quote);

    return (
        <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full rounded-3xl border border-white/20 bg-card p-6 text-foreground shadow-lg backdrop-blur"
            initial={{ opacity: 0, y: 12 }}
        >
            <div className="flex items-start justify-between gap-4">
                <blockquote className="flex-1 space-y-4 text-base md:text-lg">
                    <TextAnimate
                        animation="fadeIn"
                        as="div"
                        by="line"
                        className="whitespace-pre-wrap font-medium text-foreground leading-relaxed"
                    >
                        {`"${quote.body}"`}
                    </TextAnimate>
                    <footer className="text-foreground/80 text-sm italic">
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
                            className="shrink-0 rounded-full"
                            onClick={copyQuote}
                            size="icon"
                            variant="ghost"
                        >
                            <CopyIcon className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                </Tooltip>
            </div>
            <p className="mt-4 text-foreground/60 text-xs">Tap the copy icon to share with friends.</p>
        </motion.section>
    );
}
