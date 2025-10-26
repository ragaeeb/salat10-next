'use client';

import { Download, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const logs: any[] = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (typeof window !== 'undefined') {
    const captureLog = (level: string, originalFn: typeof console.log) => {
        return (...args: any[]) => {
            const entry = {
                args,
                clientHeight: document.documentElement.clientHeight,
                level,
                scrollHeight: document.documentElement.scrollHeight,
                scrollY: window.scrollY,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
            };
            logs.push(entry);
            originalFn.apply(console, args);
        };
    };

    console.log = captureLog('log', originalConsoleLog);
    console.error = captureLog('error', originalConsoleError);
    console.warn = captureLog('warn', originalConsoleWarn);
}

export default function DebugLogger() {
    const [logCount, setLogCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogCount(logs.length);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const shareLogs = async () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const file = new File([blob], `debug-logs-${Date.now()}.json`, { type: 'application/json' });

        // Check if Web Share API is available AND supports files
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'Debug Logs' });
                return;
            } catch (err: any) {
                // User cancelled or share failed
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        // Fallback to download
        downloadLogs();
    };

    const downloadLogs = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 flex gap-2">
            <Button
                onClick={shareLogs}
                className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-white shadow-lg hover:bg-red-600"
            >
                <Share2 className="h-4 w-4" />
                Share Logs ({logCount})
            </Button>
        </div>
    );
}
