'use client';

import { useEffect, useState } from 'react';

export function HydratedProvider({ children }: { children: React.ReactNode }) {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    if (!hydrated) {
        return null; // or a loading skeleton
    }

    return <>{children}</>;
}
