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
                default: 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90',
                ghost: 'bg-transparent text-foreground hover:bg-primary/10 hover:text-primary',
                outline:
                    'border border-primary/40 bg-background/70 text-foreground shadow-sm hover:border-primary/60 hover:bg-primary/10',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
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
