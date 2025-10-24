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
                        'border border-white/40 bg-white/20 text-foreground shadow-lg backdrop-blur transition hover:bg-white/40',
                        className,
                    )}
                />
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
    );
}
