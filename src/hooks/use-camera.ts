import { useCallback, useEffect, useRef, useState } from 'react';

interface CameraState {
    stream: MediaStream | null;
    error: string | null;
    isReady: boolean;
}

/**
 * Hook to manage device camera access
 * Requests rear-facing camera for AR experience
 */
export function useCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [state, setState] = useState<CameraState>({ error: null, isReady: false, stream: null });

    const startCamera = useCallback(async () => {
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
            setState({
                error: `Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}`,
                isReady: false,
                stream: null,
            });
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
