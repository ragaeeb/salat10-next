import { useEffect, useState } from 'react';

export const useDevicePrefs = () => {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsMobile(window.matchMedia('(pointer:coarse)').matches);
    }, []);

    return { isMobile, mounted };
};
