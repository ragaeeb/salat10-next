import { useCallback, useEffect, useRef, useState } from 'react';

interface CameraState {
    stream: MediaStream | null;
    error: string | null;
    isReady: boolean;
}

/**
 * Hook to manage device camera access for AR experiences
 *
 * Requests rear-facing camera with optimal resolution for AR overlays.
 * Includes feature detection and fallbacks for older iOS Safari versions.
 * Automatically starts camera on mount and cleans up on unmount.
 *
 * @returns Camera state and control functions
 * @property {React.RefObject<HTMLVideoElement>} videoRef - Ref to attach to video element
 * @property {MediaStream | null} stream - Active media stream from camera
 * @property {string | null} error - User-friendly error message if camera access fails
 * @property {boolean} isReady - True when camera is active and ready for capture
 * @property {() => Promise<void>} startCamera - Function to manually restart camera
 *
 * @example
 * ```tsx
 * const { videoRef, error, isReady } = useCamera();
 *
 * return (
 *   <div>
 *     <video ref={videoRef} playsInline muted />
 *     {error && <p>{error}</p>}
 *     {isReady && <p>Camera ready!</p>}
 *   </div>
 * );
 * ```
 */
export function useCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [state, setState] = useState<CameraState>({ error: null, isReady: false, stream: null });

    const startCamera = useCallback(async () => {
        // Guard for non-browser runtimes (SSR/tests). Some CI environments may not
        // provide `navigator` as a global even if a DOM shim exists.
        if (typeof navigator === 'undefined') {
            setState({
                error: 'Camera is only available in a browser environment.',
                isReady: false,
                stream: null,
            });
            return;
        }

        // Feature detection - check if getUserMedia exists
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // Try older API as fallback for some browsers
            const legacyGetUserMedia =
                (navigator as any).getUserMedia ||
                (navigator as any).webkitGetUserMedia ||
                (navigator as any).mozGetUserMedia;

            if (!legacyGetUserMedia) {
                setState({
                    error: 'Camera access requires permission. Please allow camera access when prompted by your browser.',
                    isReady: false,
                    stream: null,
                });
                return;
            }
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: { ideal: 'environment' }, height: { ideal: 1080 }, width: { ideal: 1920 } },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setState({ error: null, isReady: true, stream });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            // Provide more helpful error messages
            let userFriendlyMessage = `Camera access denied: ${errorMessage}`;

            if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
                userFriendlyMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
            } else if (errorMessage.includes('NotFoundError')) {
                userFriendlyMessage = 'No camera found on this device.';
            } else if (errorMessage.includes('NotReadableError')) {
                userFriendlyMessage = 'Camera is already in use by another application.';
            }

            setState({ error: userFriendlyMessage, isReady: false, stream: null });
        }
    }, []);

    // Start camera on mount
    useEffect(() => {
        startCamera();
    }, [startCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                for (const track of tracks) {
                    track.stop();
                }
            }
        };
    }, []);

    return { videoRef, ...state, startCamera };
}
