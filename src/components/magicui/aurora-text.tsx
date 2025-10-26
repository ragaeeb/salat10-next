'use client';

import type React from 'react';
import { memo } from 'react';

interface AuroraTextProps {
    children: React.ReactNode;
    className?: string;
    colors?: string[];
    speed?: number;
}

export const AuroraText = memo(({ children, className = '', colors, speed = 1 }: AuroraTextProps) => {
    const defaultColors = ['#ffffff', '#bcd7ff', '#80b8ff'];
    const finalColors = colors || defaultColors;

    const gradientStyle = {
        animationDuration: `${10 / speed}s`,
        backgroundImage: `linear-gradient(135deg, ${finalColors.join(', ')}, ${finalColors[0]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };

    return (
        <span className={`relative inline-block ${className}`} style={{ color: finalColors[0] }}>
            <span className="sr-only">{children}</span>
            <span
                className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
                style={gradientStyle}
                aria-hidden="true"
            >
                {children}
            </span>
        </span>
    );
});

AuroraText.displayName = 'AuroraText';
