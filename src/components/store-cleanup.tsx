'use client';

import { useEffect } from 'react';
import { usePrayerStore } from '@/store/usePrayerStore';

/**
 * Component to initialize the prayer store on app mount
 * Note: Initialization now happens automatically in onRehydrateStorage callback
 * This component only handles cleanup
 */
export function StoreCleanup({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Cleanup scheduled updates on unmount
        return () => {
            const store = usePrayerStore.getState();
            store._clearScheduledUpdate();
        };
    }, []);

    return <>{children}</>;
}
