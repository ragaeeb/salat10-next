'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = { ready: boolean; theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'salat10-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const prefersDarkQuery = useRef<MediaQueryList | null>(null);
    const [theme, setThemeState] = useState<Theme>('light');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        prefersDarkQuery.current = window.matchMedia('(prefers-color-scheme: dark)');
        const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
        const resolved = stored ?? (prefersDarkQuery.current.matches ? 'dark' : 'light');
        setThemeState(resolved);
        setReady(true);
    }, []);

    useEffect(() => {
        if (!ready || typeof document === 'undefined') {
            return;
        }
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.setAttribute('data-theme', theme);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, theme);
        }
    }, [ready, theme]);

    useEffect(() => {
        if (!prefersDarkQuery.current) {
            return;
        }
        const handler = (event: MediaQueryListEvent) => {
            if (window.localStorage.getItem(STORAGE_KEY)) {
                return;
            }
            setThemeState(event.matches ? 'dark' : 'light');
        };
        prefersDarkQuery.current.addEventListener('change', handler);
        return () => prefersDarkQuery.current?.removeEventListener('change', handler);
    }, []);

    const setTheme = useCallback((value: Theme) => {
        setThemeState(value);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(() => ({ ready, setTheme, theme, toggleTheme }), [ready, setTheme, theme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within a ThemeProvider');
    }
    return context;
}
