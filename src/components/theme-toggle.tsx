'use client';

import { MoonStar, SunMedium } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useThemeMode } from './theme-provider';

export function ThemeToggle() {
    const { ready, theme, toggleTheme } = useThemeMode();

    if (!ready) {
        return null;
    }

    const isDark = theme === 'dark';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    onClick={toggleTheme}
                    size="icon"
                    variant="ghost"
                >
                    {isDark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
    );
}
