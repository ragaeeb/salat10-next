'use client';

import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useThemeMode } from './theme-provider';

export function ThemeToggle() {
    const { ready, theme } = useThemeMode();

    if (!ready) {
        return null;
    }

    const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <AnimatedThemeToggler aria-label={label} className="bg-background/60 shadow-lg backdrop-blur" />
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
    );
}
