import type { Metadata } from 'next';

import { Geist, Geist_Mono } from 'next/font/google';

import { Footer } from '@/components/footer';

import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = { description: 'Salat10', title: 'Salat10' };

/**
 * Defines the root layout for the application, applying global fonts and styles.
 *
 * Wraps all page content with the configured font variables and sets the HTML language to English.
 *
 * @param children - The content to be rendered within the layout.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <div className="flex min-h-screen flex-col">
                    <main className="flex-1">{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
}
