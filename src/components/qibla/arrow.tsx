'use client';

import { CheckCircle } from 'lucide-react';

interface QiblaArrowProps {
    relativeRotation: number | null;
    isAligned: boolean;
}

/**
 * AR compass arrow that points toward Qibla direction
 * Rotates based on device heading relative to Qibla bearing
 */
export function QiblaArrow({ relativeRotation, isAligned }: QiblaArrowProps) {
    if (relativeRotation === null) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Rotating arrow */}
            <div
                className="transition-transform duration-200 ease-out"
                style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))', transform: `rotate(${relativeRotation}deg)` }}
            >
                <svg width="80" height="200" viewBox="0 0 80 200" className="opacity-90" role="img">
                    <title>Qibla direction arrow</title>
                    {/* Arrow shaft */}
                    <rect x="35" y="40" width="10" height="160" fill="white" />
                    {/* Arrow head */}
                    <polygon points="40,0 60,40 20,40" fill="white" />
                    {/* Green tip for Kaaba direction */}
                    <circle cx="40" cy="15" r="8" fill="#22c55e" />
                    {/* Glow effect */}
                    <circle cx="40" cy="15" r="12" fill="#22c55e" opacity="0.3" />
                </svg>
            </div>

            {/* Center crosshair */}
            <div className="absolute">
                <div
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                        isAligned ? 'bg-green-500' : 'bg-white/50'
                    }`}
                />
            </div>

            {/* Success indicator when aligned */}
            {isAligned && (
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full bg-green-500/20 p-8 backdrop-blur-sm">
                    <CheckCircle className="h-16 w-16 text-green-400" />
                </div>
            )}
        </div>
    );
}
