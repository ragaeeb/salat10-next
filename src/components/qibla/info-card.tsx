'use client';

import { CheckCircle, Compass } from 'lucide-react';
import { formatDirectionInstruction } from '@/lib/qibla';

interface QiblaInfoCardProps {
    qiblaBearing: number;
    currentHeading: number | null;
    relativeRotation: number | null;
    isAligned: boolean;
    quality: { text: string; color: string } | null;
    latitude: number;
    longitude: number;
}

/**
 * Information card showing Qibla direction, device heading, and accuracy
 */
export function QiblaInfoCard({
    qiblaBearing,
    currentHeading,
    relativeRotation,
    isAligned,
    quality,
    latitude,
    longitude,
}: QiblaInfoCardProps) {
    return (
        <div className="space-y-2 rounded-lg bg-black/70 p-4 text-white backdrop-blur-md">
            {/* Bearings */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-white/60 text-xs">Qibla Direction</div>
                    <div className="font-mono font-semibold text-green-400 text-lg">{qiblaBearing.toFixed(1)}°</div>
                </div>
                <div>
                    <div className="text-white/60 text-xs">Your Heading</div>
                    <div className="font-mono font-semibold text-lg">
                        {currentHeading !== null ? currentHeading.toFixed(1) : '—'}°
                    </div>
                </div>
            </div>

            {/* Direction instruction */}
            {relativeRotation !== null && (
                <div className="border-white/20 border-t pt-2">
                    <div className="mb-1 text-white/60 text-xs">Turn</div>
                    <div className="flex items-center gap-2">
                        <div
                            className={`font-mono font-semibold text-lg ${isAligned ? 'text-green-400' : 'text-white'}`}
                        >
                            {isAligned ? 'Aligned!' : formatDirectionInstruction(relativeRotation)}
                        </div>
                        {isAligned && <CheckCircle className="h-5 w-5 text-green-400" />}
                    </div>
                </div>
            )}

            {/* Compass accuracy */}
            {quality && (
                <div className="flex items-center gap-2 border-white/20 border-t pt-2 text-xs">
                    <Compass className="h-4 w-4" />
                    <span className="text-white/60">Accuracy:</span>
                    <span className={quality.color}>{quality.text}</span>
                </div>
            )}

            {/* Location */}
            <div className="border-white/20 border-t pt-2 text-white/60 text-xs">
                {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
            </div>
        </div>
    );
}
