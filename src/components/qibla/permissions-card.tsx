'use client';

import { AlertCircle, Camera, Compass } from 'lucide-react';
import type { PermissionState } from '@/hooks/useQiblaCompass';

interface PermissionsCardProps {
    cameraGranted: boolean;
    orientationState: PermissionState;
    onRequestOrientation: () => void;
}

/**
 * Card showing permission status and request buttons
 */
export function PermissionsCard({ cameraGranted, orientationState, onRequestOrientation }: PermissionsCardProps) {
    // Don't show if all permissions granted
    if (cameraGranted && orientationState === 'granted') {
        return null;
    }

    return (
        <div className="rounded-lg bg-black/70 p-4 text-white backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">Permissions Required</span>
            </div>

            <div className="space-y-2 text-sm">
                {!cameraGranted && (
                    <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <span>Camera: waiting for access...</span>
                    </div>
                )}

                {orientationState === 'prompt' && (
                    <button
                        type="button"
                        onClick={onRequestOrientation}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                    >
                        <Compass className="h-4 w-4" />
                        Enable Compass
                    </button>
                )}

                {orientationState === 'denied' && (
                    <div className="mt-2 rounded bg-red-900/50 px-3 py-2 text-xs">
                        Compass permission denied. Please enable in browser settings.
                    </div>
                )}
            </div>
        </div>
    );
}
