'use client';

import { Eye, EyeOff, Moon, RotateCcw, Sun, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

type CelestialDevScrubberProps = {
    isForegroundVisible: boolean;
    isSimulating: boolean;
    lunarCycle: number;
    onResetToLive: () => void;
    onSetForegroundVisible: (visible: boolean) => void;
    onSetLunarCycle: (fraction: number | null) => void;
    onSetSimulatedProgress: (progress: number) => void;
    progress: number;
    simulatedLunarCycle: number | null;
    timeline: Timeline | null;
};

/**
 * Compact Developer Scrubber Panel for Testing Celestial Mechanics
 */
export function CelestialDevScrubber({
    isForegroundVisible,
    isSimulating,
    lunarCycle,
    onResetToLive,
    onSetForegroundVisible,
    onSetLunarCycle,
    onSetSimulatedProgress,
    progress,
    simulatedLunarCycle,
    timeline,
}: CelestialDevScrubberProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'time' | 'lunar'>('time');

    if (!timeline) {
        return null;
    }

    const activeLunarCycle = simulatedLunarCycle ?? lunarCycle;

    if (!isOpen) {
        return (
            <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
                <Button
                    aria-label="Open Dev Scrubber"
                    className="flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 text-white shadow-2xl backdrop-blur-xl transition hover:bg-black/80"
                    onClick={() => setIsOpen(true)}
                    size="sm"
                    variant="outline"
                >
                    <Wrench className="h-4 w-4 text-cyan-400" />
                    <span className="font-semibold text-xs">Dev</span>
                    {isSimulating && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
                </Button>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={150}>
            <div className="fixed right-4 bottom-4 z-50 w-[min(92vw,20rem)] overflow-hidden rounded-2xl border border-white/20 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-2xl transition-all sm:right-6 sm:bottom-6">
                {/* Compact Toolbar Action Icons */}
                <div className="flex items-center justify-between gap-1.5 pb-2.5">
                    {/* Time / Lunar Toggle Icons */}
                    <div className="flex items-center rounded-lg bg-white/10 p-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    aria-label="Time of Day Mode"
                                    className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded-md transition',
                                        mode === 'time'
                                            ? 'bg-cyan-500 text-black shadow'
                                            : 'text-white/70 hover:text-white',
                                    )}
                                    onClick={() => setMode('time')}
                                    type="button"
                                >
                                    <Sun className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Time of Day</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    aria-label="Lunar Phase Mode"
                                    className={cn(
                                        'flex h-7 w-7 items-center justify-center rounded-md transition',
                                        mode === 'lunar'
                                            ? 'bg-cyan-500 text-black shadow'
                                            : 'text-white/70 hover:text-white',
                                    )}
                                    onClick={() => setMode('lunar')}
                                    type="button"
                                >
                                    <Moon className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Lunar Phase</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Foreground Cards Toggle Icon */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    aria-label={isForegroundVisible ? 'Hide Cards' : 'Show Cards'}
                                    className={cn(
                                        'h-7 w-7 rounded-lg transition',
                                        isForegroundVisible
                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                            : 'bg-amber-500/30 text-amber-300 hover:bg-amber-500/40',
                                    )}
                                    onClick={() => onSetForegroundVisible(!isForegroundVisible)}
                                    size="icon"
                                    variant="ghost"
                                >
                                    {isForegroundVisible ? (
                                        <Eye className="h-3.5 w-3.5" />
                                    ) : (
                                        <EyeOff className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                {isForegroundVisible ? 'Hide Cards' : 'Show Cards'}
                            </TooltipContent>
                        </Tooltip>

                        {/* Reset to Live Clock Icon */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    aria-label="Reset to Live Clock"
                                    className={cn(
                                        'h-7 w-7 rounded-lg text-white/80 hover:bg-white/10 hover:text-white',
                                        isSimulating && 'text-amber-400 hover:text-amber-300',
                                    )}
                                    onClick={onResetToLive}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Reset to Live Clock</TooltipContent>
                        </Tooltip>

                        {/* Close Panel */}
                        <Button
                            aria-label="Close Dev Scrubber"
                            className="h-7 w-7 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                            onClick={() => setIsOpen(false)}
                            size="icon"
                            variant="ghost"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Scrubber Sliders */}
                {mode === 'time' ? (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-white/70">
                            <span>Trajectory</span>
                            <span className="font-mono font-semibold text-cyan-400">{progress.toFixed(3)}</span>
                        </div>
                        <input
                            aria-label="Time trajectory slider"
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-400"
                            max={2.0}
                            min={0.0}
                            onChange={(e) => onSetSimulatedProgress(Number.parseFloat(e.target.value))}
                            step={0.005}
                            type="range"
                            value={progress}
                        />
                        <div className="flex justify-between text-[9px] text-white/40">
                            <span>0.0</span>
                            <span>1.0</span>
                            <span>2.0</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-white/70">
                            <span>Lunar Phase</span>
                            <span className="font-mono font-semibold text-cyan-400">
                                {(activeLunarCycle * 100).toFixed(0)}%
                            </span>
                        </div>
                        <input
                            aria-label="Lunar phase slider"
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-400"
                            max={1.0}
                            min={0.0}
                            onChange={(e) => onSetLunarCycle(Number.parseFloat(e.target.value))}
                            step={0.01}
                            type="range"
                            value={activeLunarCycle}
                        />
                        <div className="flex justify-between text-[9px] text-white/40">
                            <span>🌑 0%</span>
                            <span>🌕 50%</span>
                            <span>🌑 100%</span>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
