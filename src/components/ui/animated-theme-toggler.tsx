'use client';

import { Moon, Sun } from 'lucide-react';
import { type ComponentPropsWithoutRef, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { useThemeMode } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

type ViewTransition = { ready: Promise<void> };

type AnimatedThemeTogglerProps = ComponentPropsWithoutRef<'button'> & { duration?: number };

/**
 * Animated theme switcher built on top of Magic UI's registry component.
 */
export const AnimatedThemeToggler = ({ className, duration = 400, ...props }: AnimatedThemeTogglerProps) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { ready, setTheme, theme } = useThemeMode();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (ready) {
            setIsDark(theme === 'dark');
        }
    }, [ready, theme]);

    const toggleTheme = useCallback(async () => {
        if (!ready) {
            return;
        }
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        const runToggle = () => {
            flushSync(() => {
                setIsDark(nextTheme === 'dark');
                setTheme(nextTheme);
            });
        };

        const startViewTransition = (
            document as unknown as { startViewTransition?: (cb: () => void) => ViewTransition }
        ).startViewTransition;

        if (!buttonRef.current || !startViewTransition) {
            runToggle();
            return;
        }

        const transition = startViewTransition(runToggle);
        await transition.ready;

        const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const maxRadius = Math.hypot(Math.max(left, window.innerWidth - left), Math.max(top, window.innerHeight - top));

        document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
            { duration, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
    }, [duration, ready, setTheme, theme]);

    return (
        <button
            ref={buttonRef}
            onClick={toggleTheme}
            className={cn('relative h-10 w-10 rounded-full', className)}
            {...props}
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
        </button>
    );
};
