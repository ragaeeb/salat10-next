'use client';

import { CopyIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMotivationalQuote } from '@/hooks/use-motivational-quote';

const QUOTE_WATERMARK = '\n\nShared from Salat10 [https://salat10.vercel.app]';

/**
 * Renders the motivational quote card with copy and animation affordances.
 */
export function QuoteCard() {
    const { quote } = useMotivationalQuote();

    const copyQuote = async () => {
        try {
            await navigator.clipboard.writeText(`"${quote!.text}" - [${quote!.citation}]${QUOTE_WATERMARK}`);
            toast.success('Copied');
        } catch (error) {
            console.warn('Clipboard copy failed', error);
            toast.success('Error');
        }
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
                            aria-label="Copy"
                            className="rounded-full"
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
