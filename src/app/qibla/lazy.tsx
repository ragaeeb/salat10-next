'use client';

import dynamic from 'next/dynamic';

const QiblaFinderClient = dynamic(() => import('./client').then((m) => m.QiblaFinderClient), {
    loading: () => (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="text-center text-white">
                <div className="mb-4 text-lg">Loading Qibla Finder...</div>
            </div>
        </div>
    ),
    ssr: false,
});

export default function QiblaLazy(props: any) {
    return <QiblaFinderClient {...props} />;
}
