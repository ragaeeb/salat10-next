'use client';

import { useEffect } from 'react';
import { usePrayerStore } from '@/store/usePrayerStore';

/**
 * Component to initialize the prayer store on app mount
 */
export function StoreInitializer({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const store = usePrayerStore.getState();
        store.initialize();

        return () => {
            store._clearScheduledUpdate();
        };
    }, []);

    return <>{children}</>;
}
