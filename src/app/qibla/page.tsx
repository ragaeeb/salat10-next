import { IconArrowLeft } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QiblaFinderClient } from './client';

export const metadata: Metadata = { description: 'Find the Qibla direction using AR', title: 'Qibla Finder - Salat10' };

export default function QiblaPage() {
    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            <div className="absolute top-4 left-4 z-50">
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="icon"
                >
                    <Link aria-label="Go back" href="/">
                        <IconArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            <QiblaFinderClient />
        </div>
    );
}
