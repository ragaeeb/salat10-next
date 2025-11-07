'use client';

import dynamic from 'next/dynamic';

export default dynamic(() => import('./client').then((m) => m.QiblaFinderClient), {
    loading: () => (
        <main className="flex h-screen items-center justify-center bg-black">
            <output className="text-center text-white" aria-live="polite">
                <div className="mb-4 text-lg">Loading Qibla Finder...</div>
            </output>
        </main>
    ),
    ssr: false,
});
