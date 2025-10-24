'use client';

import type React from 'react';
import { memo } from 'react';
import { useThemeMode } from '@/components/theme-provider';

interface AuroraTextProps {
    children: React.ReactNode;
    className?: string;
    colors?: string[];
    speed?: number;
}

export const AuroraText = memo(({ children, className = '', colors, speed = 1 }: AuroraTextProps) => {
    const { theme } = useThemeMode();

    const defaultColors = theme === 'dark' ? ['#ffffff', '#bcd7ff', '#80b8ff'] : ['#084c66', '#0a5a7b', '#0b6d8c'];

    const finalColors = colors || defaultColors;

    const gradientStyle = {
        animationDuration: `${10 / speed}s`,
        backgroundImage: `linear-gradient(135deg, ${finalColors.join(', ')}, ${finalColors[0]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };

    const lightThemeStyle = { color: '#0b6d8c' };

    return (
        <span className={`relative inline-block ${className}`}>
            <span className="sr-only">{children}</span>
            {theme === 'dark' ? (
                <span
                    className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
                    style={gradientStyle}
                    aria-hidden="true"
                >
                    {children}
                </span>
            ) : (
                <span className="relative" style={lightThemeStyle} aria-hidden="true">
                    {children}
                </span>
            )}
        </span>
    );
});

AuroraText.displayName = 'AuroraText';
