'use client';

import { type MotionProps, motion } from 'motion/react';
import type React from 'react';

import { cn } from '@/lib/utils';

const animationProps: MotionProps = {
    animate: { '--x': '-100%' },
    initial: { '--x': '100%' },
    transition: {
        damping: 15,
        mass: 2,
        repeat: Infinity,
        repeatDelay: 1,
        repeatType: 'loop',
        stiffness: 20,
        type: 'spring',
    },
};

interface ShinyTextProps extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>, MotionProps {
    children: React.ReactNode;
    className?: string;
}

export const ShinyText = ({ children, className, ...props }: ShinyTextProps) => {
    return (
        <motion.span
            className={cn('relative inline-block', className)}
            {...animationProps}
            {...props}
            style={{ '--x': '100%' } as any}
        >
            <span className="relative block">{children}</span>
            <span
                className="absolute inset-0 z-10 block bg-gradient-to-r from-transparent via-white/60 to-transparent"
                style={{
                    maskImage:
                        'linear-gradient(-75deg, transparent calc(var(--x) + 15%), #000 calc(var(--x) + 25%), transparent calc(var(--x) + 35%))',
                    WebkitMaskImage:
                        'linear-gradient(-75deg, transparent calc(var(--x) + 15%), #000 calc(var(--x) + 25%), transparent calc(var(--x) + 35%))',
                }}
            />
        </motion.span>
    );
};

ShinyText.displayName = 'ShinyText';
