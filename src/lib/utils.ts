import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DayData } from '@/types/timeline';

/****
 * Combines and merges class names using `clsx` and resolves Tailwind CSS conflicts with `twMerge`.
 *
 * @param inputs - Class values to be combined and merged.
 * @returns A single string of merged class names with Tailwind CSS conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : clamp01((v - a) / (b - a)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const pick = (timings: DayData['timings'], key: string) => timings.find((t) => t.event === key)?.value;
