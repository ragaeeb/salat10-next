import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Footer } from '@/components/footer';
import { StoreInitializer } from '@/components/store-initializer';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = { description: 'Salat10', title: 'Salat10' };

/**
 * Root layout with global fonts/styles.
 * Store hydration is handled per-page using useHasHydrated() where needed.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="color-scheme" content="only light" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <StoreInitializer>
                    <div className="flex min-h-screen flex-col">
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </div>
                </StoreInitializer>
                <Toaster />
            </body>
        </html>
    );
}
