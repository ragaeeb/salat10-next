'use client';

import { AlertCircle, Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopyFeedback } from '@/hooks/use-copy-feedback';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';

const QUOTE_WATERMARK = '\n\nShared from Salat10 [https://salat10.vercel.app]';

/**
 * Renders the motivational quote card with copy and animation affordances.
 */
export function QuoteCard() {
    const { copy, status: copyStatus } = useCopyFeedback();
    const { quote } = useMotivationalQuote();

    const copyLabel = useMemo(() => {
        if (copyStatus === 'copied') {
            return 'Copied!';
        }
        if (copyStatus === 'error') {
            return 'Copy failed';
        }
        return 'Copy quote';
    }, [copyStatus]);

    const copyIcon = copyStatus === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />;

    const copyQuote = async () => {
        await copy(`"${quote!.text}" - [${quote!.citation}]${QUOTE_WATERMARK}`);
    };

    return (
        <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full rounded-3xl border border-white/20 bg-card p-6 text-foreground shadow-lg backdrop-blur"
            initial={{ opacity: 0, y: 12 }}
        >
            <div className="flex items-start justify-between gap-4">
                {quote && (
                    <blockquote className="space-y-4 text-base md:text-lg">
                        <TextAnimate
                            animation="fadeIn"
                            as="p"
                            by="line"
                            className="font-medium text-foreground leading-relaxed"
                        >
                            {`“${quote.text}”`}
                        </TextAnimate>
                        <footer className="text-foreground/80 text-sm italic">— {quote.citation}</footer>
                    </blockquote>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            aria-label={copyLabel}
                            className="rounded-full"
                            onClick={copyQuote}
                            size="icon"
                            variant="ghost"
                        >
                            {copyStatus === 'error' ? <AlertCircle className="h-4 w-4" /> : copyIcon}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copyLabel}</TooltipContent>
                </Tooltip>
            </div>
            <p className="mt-4 text-foreground/60 text-xs">
                Tap the copy icon to share with friends. Copies include a small watermark: {QUOTE_WATERMARK}
            </p>
        </motion.section>
    );
}
