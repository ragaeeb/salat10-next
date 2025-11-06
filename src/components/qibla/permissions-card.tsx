'use client';

import { AlertCircle, Camera, Compass, ExternalLink } from 'lucide-react';
import type { PermissionState } from '@/hooks/use-qibla-compass';

interface PermissionsCardProps {
    cameraGranted: boolean;
    orientationState: PermissionState;
    onRequestOrientation: () => void;
}

/**
 * Detect browser type for specific instructions
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    const isBrave = (navigator as any).brave !== undefined;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua);

    return { isBrave, isIOS, isSafari };
}

/**
 * Card showing permission status and request buttons
 */
export function PermissionsCard({ cameraGranted, orientationState, onRequestOrientation }: PermissionsCardProps) {
    const { isBrave, isIOS } = getBrowserInfo();

    // Don't show if all permissions granted
    if (cameraGranted && orientationState === 'granted') {
        return null;
    }

    return (
        <div className="rounded-lg bg-black/70 p-4 text-white backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">Setup Required</span>
            </div>

            <div className="space-y-3 text-sm">
                {!cameraGranted && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            <span>Camera: Permission needed</span>
                        </div>

                        {isBrave && isIOS && (
                            <div className="rounded bg-blue-900/50 px-3 py-2 text-xs">
                                <div className="mb-2 font-semibold">Enable Camera in Brave:</div>
                                <ol className="ml-4 list-decimal space-y-1">
                                    <li>
                                        Go to iPhone <strong>Settings</strong> app
                                    </li>
                                    <li>
                                        Scroll down and tap <strong>Brave</strong>
                                    </li>
                                    <li>
                                        Tap <strong>Camera</strong>
                                    </li>
                                    <li>
                                        Select <strong>"Allow"</strong>
                                    </li>
                                    <li>Return here and refresh the page</li>
                                </ol>
                            </div>
                        )}

                        {!isBrave && isIOS && (
                            <div className="rounded bg-blue-900/50 px-3 py-2 text-xs">
                                <div className="mb-2 font-semibold">Enable Camera in Safari:</div>
                                <ol className="ml-4 list-decimal space-y-1">
                                    <li>
                                        Go to iPhone <strong>Settings</strong> app
                                    </li>
                                    <li>
                                        Scroll down and tap <strong>Safari</strong>
                                    </li>
                                    <li>
                                        Find <strong>Camera</strong> setting
                                    </li>
                                    <li>
                                        Select <strong>"Allow"</strong>
                                    </li>
                                    <li>Return here and refresh the page</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {orientationState === 'prompt' && (
                    <button
                        type="button"
                        onClick={onRequestOrientation}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 active:bg-green-800"
                    >
                        <Compass className="h-4 w-4" />
                        Enable Compass
                    </button>
                )}

                {orientationState === 'denied' && (
                    <div className="space-y-2">
                        <div className="rounded bg-red-900/50 px-3 py-2 text-xs">
                            <div className="mb-2 font-semibold">Motion Sensors Blocked</div>

                            {isBrave && isIOS && (
                                <div className="space-y-3">
                                    <div>
                                        <div className="mb-1 font-semibold">Option 1: Use Safari Instead</div>
                                        <p className="text-white/90">
                                            Brave blocks motion sensors by default. The easiest solution is to open this
                                            page in Safari.
                                        </p>
                                    </div>

                                    <div>
                                        <div className="mb-1 font-semibold">Option 2: Enable in Brave Settings</div>
                                        <ol className="ml-4 list-decimal space-y-1 text-white/90">
                                            <li>
                                                Open this page in <strong>Brave on your Mac/PC</strong>
                                            </li>
                                            <li>
                                                Go to <strong>brave://settings/content/sensors</strong>
                                            </li>
                                            <li>Add this site to "Allowed" list</li>
                                            <li>Return to iPhone and it should work</li>
                                        </ol>
                                    </div>
                                </div>
                            )}

                            {!isBrave && isIOS && (
                                <div>
                                    <div className="mb-1 font-semibold">Enable Motion Sensors:</div>
                                    <ol className="ml-4 list-decimal space-y-1 text-white/90">
                                        <li>
                                            Go to iPhone <strong>Settings</strong> app
                                        </li>
                                        <li>
                                            Scroll down and tap <strong>Safari</strong>
                                        </li>
                                        <li>
                                            Find <strong>"Motion & Orientation Access"</strong>
                                        </li>
                                        <li>
                                            Toggle it <strong>ON</strong>
                                        </li>
                                        <li>Return here and click "Enable Compass" above</li>
                                    </ol>
                                </div>
                            )}

                            {!isIOS && (
                                <div className="text-white/90">
                                    Please check your browser settings to allow motion sensor access for this site.
                                </div>
                            )}
                        </div>

                        {isBrave && (
                            <a
                                href="https://support.brave.com/hc/en-us/articles/360050634931-How-Do-I-Manage-Site-Permissions-In-Brave"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-400 text-xs underline"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Learn more about Brave permissions
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
