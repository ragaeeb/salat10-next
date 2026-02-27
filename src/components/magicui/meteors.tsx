'use client';

import type React from 'react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface MeteorsProps {
    number?: number;
    minDelay?: number;
    maxDelay?: number;
    minDuration?: number;
    maxDuration?: number;
    angle?: number;
    className?: string;
}

interface MeteorStyleEntry {
    id: string;
    style: React.CSSProperties;
}

export const Meteors = ({
    number = 20,
    minDelay = 0.2,
    maxDelay = 1.2,
    minDuration = 2,
    maxDuration = 10,
    angle = 215,
    className,
}: MeteorsProps) => {
    const [meteorStyles, setMeteorStyles] = useState<MeteorStyleEntry[]>([]);

    useEffect(() => {
        const styles: MeteorStyleEntry[] = [...new Array(number)].map(() => ({
            id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
            style: {
                '--angle': `${-angle}deg`,
                animationDelay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
                animationDuration: `${Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)}s`,
                // bright, glowy head
                background:
                    'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.65) 70%, rgba(255,255,255,0) 100%)',
                boxShadow: '0 0 16px rgba(255, 255, 255, 0.70)',
                filter: 'brightness(1.4) saturate(1.1) drop-shadow(0 0 16px rgba(255,255,255,0.65))',
                left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
                top: '-5%',
            } as React.CSSProperties,
        }));
        setMeteorStyles(styles);
    }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

    return (
        <>
            {meteorStyles.map(({ id, style }) => (
                // Meteor head
                <span
                    key={id}
                    style={{ ...style }}
                    className={cn(
                        // slightly larger on retina so it reads bright
                        'pointer-events-none absolute h-[2.5px] w-[2.5px] rotate-[var(--angle)] animate-meteor rounded-full md:h-[3px] md:w-[3px]',
                        '[color-scheme:light] [forced-color-adjust:none]',
                        'supports-[mix-blend-mode:plus-lighter]:[mix-blend-mode:plus-lighter]',
                        '[mix-blend-mode:screen]',
                        'will-change-transform',
                        className,
                    )}
                >
                    {/* Meteor tail */}
                    <div
                        className="pointer-events-none absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2"
                        style={{
                            // pure white trail with stronger glow
                            background:
                                'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 80%, rgba(255,255,255,0) 100%)',
                            filter: 'brightness(1.35) drop-shadow(0 0 18px rgba(255,255,255,0.75))',
                        }}
                    />
                </span>
            ))}
        </>
    );
};
