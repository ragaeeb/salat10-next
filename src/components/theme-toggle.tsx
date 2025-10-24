'use client';

import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { useThemeMode } from './theme-provider';

export function ThemeToggle({ className }: { className?: string }) {
    const { ready, theme } = useThemeMode();

    if (!ready) {
        return null;
    }

    const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    const themedStyles =
        theme === 'dark'
            ? 'border-white/70 bg-white text-[var(--primary-foreground)] hover:bg-white/90'
            : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <AnimatedThemeToggler
                    aria-label={label}
                    className={cn(
                        'shadow-lg backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                        themedStyles,
                        className,
                    )}
                    type="button"
                />
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
    );
}
