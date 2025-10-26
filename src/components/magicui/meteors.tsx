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
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.45)',
                left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
                top: '-5%',
            },
        }));
        setMeteorStyles(styles);
    }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);

    return (
        <>
            {meteorStyles.map(({ id, style }) => (
                // Meteor Head
                <span
                    key={id}
                    style={{ ...style }}
                    className={cn(
                        'pointer-events-none absolute size-0.5 rotate-[var(--angle)] animate-meteor rounded-full',
                        className,
                    )}
                >
                    {/* Meteor Tail */}
                    <div
                        className="-z-10 -translate-y-1/2 pointer-events-none absolute top-1/2 h-px w-[60px]"
                        style={{
                            background:
                                'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(46,185,223,0.45) 40%, rgba(46,185,223,0) 100%)',
                            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.35))',
                        }}
                    />
                </span>
            ))}
        </>
    );
};
