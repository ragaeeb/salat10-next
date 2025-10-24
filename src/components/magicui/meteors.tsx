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
                        'pointer-events-none absolute size-0.5 rotate-[var(--angle)] animate-meteor rounded-full bg-zinc-500 shadow-[0_0_0_1px_#ffffff10]',
                        className,
                    )}
                >
                    {/* Meteor Tail */}
                    <div className="-z-10 -translate-y-1/2 pointer-events-none absolute top-1/2 h-px w-[50px] bg-gradient-to-r from-zinc-500 to-transparent" />
                </span>
            ))}
        </>
    );
};
