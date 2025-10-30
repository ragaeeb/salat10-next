import { useMemo } from 'react';
import { SEAM_FRAC } from '@/lib/constants';
import { invLerp } from '@/lib/utils';

export function useCrossFade(pNow: number, currentDayIndex: number, daysLength: number) {
    const hasPrev = currentDayIndex > 0;
    const hasNext = currentDayIndex < daysLength - 1;

    const topSeamStarsOpacity = useMemo(() => (hasPrev ? 1 - invLerp(0, SEAM_FRAC, pNow) : 0), [hasPrev, pNow]);

    const bottomSeamFajrOpacity = useMemo(() => (hasNext ? invLerp(1 - SEAM_FRAC, 1, pNow) : 0), [hasNext, pNow]);

    return { bottomSeamFajrOpacity, hasNext, hasPrev, topSeamStarsOpacity };
}
