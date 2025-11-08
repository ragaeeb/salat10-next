import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DayData } from '@/types/timeline';
import { SEAM_FRAC } from './constants';

/**
 * Combines and merges class names using clsx and tailwind-merge
 * Resolves Tailwind CSS conflicts (e.g., "p-4 p-2" becomes "p-2")
 *
 * @param inputs - Class values to combine (strings, objects, arrays)
 * @returns Merged class name string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Clamp value to [0, 1] range
 *
 * @param v - Input value
 * @returns Value clamped between 0 and 1
 */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Inverse linear interpolation - convert value to 0-1 range
 * Returns where v sits between a and b as a fraction
 *
 * @param a - Range start
 * @param b - Range end
 * @param v - Value to map
 * @returns Position in range [0..1], clamped
 */
export const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : clamp01((v - a) / (b - a)));

/**
 * Linear interpolation - blend between two values
 *
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor [0..1]
 * @returns Interpolated value
 */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Find timing entry by event name from timings array
 * Convenience helper to avoid repeated find() calls
 *
 * @param timings - Array of timing entries
 * @param key - Event name to find
 * @returns Date value of the timing, or undefined if not found
 */
export const pick = (timings: DayData['timings'], key: string) => timings.find((t) => t.event === key)?.value;

/**
 * Calculate cross-fade opacities for parallax day transitions
 * Handles seamless transitions between adjacent days
 *
 * Top seam: Stars fade out at beginning of day (for previous day's night)
 * Bottom seam: Fajr fades in at end of day (for next day's dawn)
 *
 * @param pNow - Current timeline position [0..1]
 * @param currentDayIndex - Index of current day in days array
 * @param daysLength - Total number of days in buffer
 * @returns Opacity values and availability flags for seams
 */
export const crossFade = (pNow: number, currentDayIndex: number, daysLength: number) => {
    const hasPrev = currentDayIndex > 0;
    const hasNext = currentDayIndex < daysLength - 1;

    return {
        /** Opacity for next day's Fajr glow at bottom of current day */
        bottomSeamFajrOpacity: hasNext ? invLerp(1 - SEAM_FRAC, 1, pNow) : 0,
        /** Whether next day exists in buffer */
        hasNext,
        /** Whether previous day exists in buffer */
        hasPrev,
        /** Opacity for previous day's stars at top of current day */
        topSeamStarsOpacity: hasPrev ? 1 - invLerp(0, SEAM_FRAC, pNow) : 0,
    };
};
