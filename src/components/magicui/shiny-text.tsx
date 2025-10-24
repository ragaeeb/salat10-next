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
            <span
                className="relative block bg-gradient-to-r from-[#084c66] via-[#0a5a7b] to-[#0b6d8c] bg-clip-text text-transparent"
                style={{
                    maskImage:
                        'linear-gradient(-75deg, #000 calc(var(--x) + 20%), transparent calc(var(--x) + 30%), #000 calc(var(--x) + 100%))',
                    WebkitMaskImage:
                        'linear-gradient(-75deg, #000 calc(var(--x) + 20%), transparent calc(var(--x) + 30%), #000 calc(var(--x) + 100%))',
                }}
            >
                {children}
            </span>
            <span
                className="absolute inset-0 z-10 block bg-gradient-to-r from-white/10 via-white/80 to-white/10"
                style={{
                    maskImage:
                        'linear-gradient(-75deg, transparent calc(var(--x) + 20%), #000 calc(var(--x) + 25%), transparent calc(var(--x) + 30%))',
                    WebkitMaskImage:
                        'linear-gradient(-75deg, transparent calc(var(--x) + 20%), #000 calc(var(--x) + 25%), transparent calc(var(--x) + 30%))',
                }}
            />
        </motion.span>
    );
};

ShinyText.displayName = 'ShinyText';
