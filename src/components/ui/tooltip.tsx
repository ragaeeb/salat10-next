'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipPortal = TooltipPrimitive.Portal;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                'z-50 overflow-hidden rounded-xl bg-[var(--tooltip-bg)] px-3 py-2 text-xs text-[var(--tooltip-foreground)] shadow-lg ring-1 ring-[var(--tooltip-ring)]',
                'data-[state=delayed-open]:data-[side=top]:fade-in data-[state=delayed-open]:data-[side=top]:animate-in',
                'data-[state=delayed-open]:data-[side=top]:zoom-in-95',
                'data-[state=closed]:fade-out data-[state=closed]:animate-out',
                className,
            )}
            {...props}
        />
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger };
