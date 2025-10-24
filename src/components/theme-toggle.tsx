'use client';

import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { useThemeMode } from './theme-provider';

export function ThemeToggle({ className }: { className?: string }) {
    const { ready, theme } = useThemeMode();

    if (!ready) {
        return null;
    }

    const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <AnimatedThemeToggler
                    aria-label={label}
                    className={cn(
                        'border border-white/60 bg-white/80 text-primary shadow-lg backdrop-blur-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                        className,
                    )}
                    type="button"
                />
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
    );
}
