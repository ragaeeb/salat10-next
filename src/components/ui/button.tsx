'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
    {
        defaultVariants: { size: 'default', variant: 'default' },
        variants: {
            size: { default: 'h-11 px-6', icon: 'h-11 w-11', lg: 'h-12 px-7', sm: 'h-9 px-4' },
            variant: {
                default:
                    'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-black/10 shadow-lg hover:bg-white/90',
                ghost: 'bg-transparent text-[var(--foreground)] hover:bg-white/10 hover:text-[var(--primary-foreground)]',
                outline:
                    'border border-white/35 bg-white/10 text-[var(--foreground)] shadow-sm hover:bg-white/20 hover:text-[var(--foreground)]',
                secondary:
                    'bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-black/5 shadow-sm hover:brightness-110',
            },
        },
    },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ asChild = false, className, size, variant, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />;
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
