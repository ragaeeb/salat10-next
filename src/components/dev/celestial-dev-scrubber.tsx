'use client';

import { ChevronDown, ChevronUp, Eye, EyeOff, Moon, RotateCcw, Sparkles, Sun, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type CelestialPhaseInfo, getCelestialPhase } from '@/lib/celestial-phases';
import { getLunarPhaseForCycle, type LunarPhase } from '@/lib/lunar';
import { cn } from '@/lib/utils';
import type { Timeline } from '@/types/timeline';

export type DevPreset =
    | 'live'
    | 'day1Fajr'
    | 'day1Sunrise'
    | 'day1Dhuhr'
    | 'day1Asr'
    | 'day1SunsetTransition'
    | 'day1Maghrib'
    | 'day1Isha'
    | 'day1Midnight'
    | 'day1LastThird'
    | 'nightToDawnTransition'
    | 'day2Fajr'
    | 'day2Sunrise'
    | 'day2Dhuhr'
    | 'day2Maghrib'
    | 'day2LastThird';

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

const LUNAR_PRESETS = [
    { fraction: 0.0, title: '🌑 New' },
    { fraction: 0.125, title: '🌒 Wax. Crescent' },
    { fraction: 0.25, title: '🌓 1st Quarter' },
    { fraction: 0.375, title: '🌔 Wax. Gibbous' },
    { fraction: 0.5, title: '🌕 Full Moon' },
    { fraction: 0.625, title: '🌖 Wan. Gibbous' },
    { fraction: 0.75, title: '🌗 Last Quarter' },
    { fraction: 0.875, title: '🌘 Wan. Crescent' },
];

function getPresetProgress(preset: DevPreset, timeline: Timeline): number | null {
    switch (preset) {
        case 'live':
            return null;
        case 'day1Fajr':
            return 0.01;
        case 'day1Sunrise':
            return timeline.sunrise;
        case 'day1Dhuhr':
            return timeline.dhuhr;
        case 'day1Asr':
            return timeline.asr;
        case 'day1SunsetTransition':
            return (timeline.asr + timeline.maghrib) * 0.5;
        case 'day1Maghrib':
            return timeline.maghrib;
        case 'day1Isha':
            return timeline.isha;
        case 'day1Midnight':
            return timeline.midNight;
        case 'day1LastThird':
            return timeline.lastThird + 0.01;
        case 'nightToDawnTransition':
            return 0.98;
        case 'day2Fajr':
            return 1.01;
        case 'day2Sunrise':
            return 1.0 + timeline.sunrise;
        case 'day2Dhuhr':
            return 1.0 + timeline.dhuhr;
        case 'day2Maghrib':
            return 1.0 + timeline.maghrib;
        case 'day2LastThird':
            return 1.0 + timeline.lastThird + 0.01;
    }
}

/**
 * Developer Dev Scrubber Panel for Testing Celestial Mechanics
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
    const [isMinimized, setIsMinimized] = useState(false);

    if (!timeline) {
        return null;
    }

    const phaseInfo: CelestialPhaseInfo = getCelestialPhase(progress, timeline);
    const activeLunarCycle = simulatedLunarCycle ?? lunarCycle;
    const lunarPhase = getLunarPhaseForCycle(activeLunarCycle);

    const applyPreset = (preset: DevPreset) => {
        const targetP = getPresetProgress(preset, timeline);
        if (targetP === null) {
            onResetToLive();
        } else {
            onSetSimulatedProgress(targetP);
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
                <Button
                    aria-label="Open Dev Scrubber"
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-white shadow-2xl backdrop-blur-xl transition hover:bg-black/70"
                    onClick={() => setIsOpen(true)}
                    size="sm"
                    variant="outline"
                >
                    <Wrench className="h-4 w-4 text-cyan-400" />
                    <span className="font-semibold text-xs">Dev Scrubber</span>
                    {isSimulating && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
            <div className="w-[min(92vw,28rem)] overflow-hidden rounded-3xl border border-white/20 bg-black/80 p-5 text-white shadow-2xl backdrop-blur-2xl transition-all">
                <DevHeader
                    isMinimized={isMinimized}
                    onClose={() => setIsOpen(false)}
                    onToggleMinimize={() => setIsMinimized(!isMinimized)}
                />

                {!isMinimized && (
                    <div className="mt-4 space-y-4">
                        <DevModeBar
                            isForegroundVisible={isForegroundVisible}
                            mode={mode}
                            onSetForegroundVisible={onSetForegroundVisible}
                            onSetMode={setMode}
                        />

                        <PhaseDiagnosticsCard
                            isSimulating={isSimulating}
                            lunarPhase={lunarPhase}
                            phaseInfo={phaseInfo}
                            progress={progress}
                        />

                        {mode === 'time' ? (
                            <TimeScrubberControls
                                onApplyPreset={applyPreset}
                                onSetProgress={onSetSimulatedProgress}
                                progress={progress}
                            />
                        ) : (
                            <LunarScrubberControls
                                activeLunarCycle={activeLunarCycle}
                                onSetLunarCycle={onSetLunarCycle}
                                simulatedLunarCycle={simulatedLunarCycle}
                            />
                        )}

                        <Button
                            className="w-full rounded-xl bg-white/10 py-2.5 font-semibold text-white text-xs hover:bg-white/20"
                            onClick={onResetToLive}
                            variant="ghost"
                        >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to Live Clock
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function DevHeader({
    isMinimized,
    onToggleMinimize,
    onClose,
}: {
    isMinimized: boolean;
    onClose: () => void;
    onToggleMinimize: () => void;
}) {
    return (
        <div className="flex items-center justify-between border-white/10 border-b pb-3">
            <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Sparkles className="h-4 w-4" />
                </span>
                <div>
                    <h3 className="font-bold text-sm tracking-wide">Celestial Dev Scrubber</h3>
                    <p className="text-[11px] text-white/60">Simulator & solar/lunar testing</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    aria-label={isMinimized ? 'Expand' : 'Minimize'}
                    className="h-7 w-7 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                    onClick={onToggleMinimize}
                    size="icon"
                    variant="ghost"
                >
                    {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                    aria-label="Close"
                    className="h-7 w-7 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                    onClick={onClose}
                    size="icon"
                    variant="ghost"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function DevModeBar({
    mode,
    onSetMode,
    isForegroundVisible,
    onSetForegroundVisible,
}: {
    isForegroundVisible: boolean;
    mode: 'time' | 'lunar';
    onSetForegroundVisible: (v: boolean) => void;
    onSetMode: (m: 'time' | 'lunar') => void;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex rounded-xl bg-white/10 p-1 text-xs">
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition',
                        mode === 'time' ? 'bg-cyan-500 text-black shadow' : 'text-white/70 hover:text-white',
                    )}
                    onClick={() => onSetMode('time')}
                >
                    <Sun className="h-3.5 w-3.5" /> Time of Day
                </button>
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition',
                        mode === 'lunar' ? 'bg-cyan-500 text-black shadow' : 'text-white/70 hover:text-white',
                    )}
                    onClick={() => onSetMode('lunar')}
                >
                    <Moon className="h-3.5 w-3.5" /> Lunar Phase
                </button>
            </div>

            <Button
                aria-label="Toggle foreground visibility"
                className={cn(
                    'flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1 font-semibold text-xs backdrop-blur-md transition',
                    isForegroundVisible
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'border-amber-400/40 bg-amber-500/30 text-amber-300 hover:bg-amber-500/40',
                )}
                onClick={() => onSetForegroundVisible(!isForegroundVisible)}
                size="sm"
                variant="outline"
            >
                {isForegroundVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {isForegroundVisible ? 'Cards: On' : 'Sky Only'}
            </Button>
        </div>
    );
}

function PhaseDiagnosticsCard({
    progress,
    phaseInfo,
    lunarPhase,
    isSimulating,
}: {
    isSimulating: boolean;
    lunarPhase: LunarPhase;
    phaseInfo: CelestialPhaseInfo;
    progress: number;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider',
                            progress < 1.0
                                ? 'border border-cyan-400/30 bg-cyan-500/20 text-cyan-300'
                                : 'border border-purple-400/30 bg-purple-500/20 text-purple-300',
                        )}
                    >
                        {progress < 1.0 ? 'Day 1' : 'Day 2'}
                    </span>
                    <span className="font-bold text-white text-xs">{phaseInfo.title}</span>
                </div>
                <span className="font-mono text-[11px] text-white/60">
                    Cycle: {((progress % 1.0) * 100).toFixed(1)}%
                </span>
            </div>
            <p className="mt-1.5 text-[11px] text-white/80">{phaseInfo.detail}</p>
            <div className="mt-2 flex items-center justify-between border-white/10 border-t pt-2 text-[10px] text-white/60">
                <span>
                    🌙 {lunarPhase.name} ({Math.round(lunarPhase.illuminatedFraction * 100)}% lit)
                </span>
                {isSimulating ? (
                    <span className="font-bold text-amber-400">● SIMULATED</span>
                ) : (
                    <span className="font-bold text-emerald-400">● LIVE TIME</span>
                )}
            </div>
        </div>
    );
}

function TimeScrubberControls({
    progress,
    onSetProgress,
    onApplyPreset,
}: {
    onApplyPreset: (preset: DevPreset) => void;
    onSetProgress: (progress: number) => void;
    progress: number;
}) {
    return (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-white/70 text-xs">
                    <span>2-Day Trajectory Slider</span>
                    <span className="font-bold font-mono text-cyan-400">p = {progress.toFixed(3)}</span>
                </div>
                <input
                    aria-label="Time of day trajectory"
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-400"
                    max={2.0}
                    min={0.0}
                    onChange={(e) => onSetProgress(Number.parseFloat(e.target.value))}
                    step={0.005}
                    type="range"
                    value={progress}
                />
                <div className="flex justify-between text-[10px] text-white/50">
                    <span>Day 1 (0.0)</span>
                    <span className="text-cyan-300">Midnight (1.0)</span>
                    <span>Day 2 (2.0)</span>
                </div>
            </div>

            <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-purple-500/40 bg-purple-500/20 p-2.5 text-left transition hover:bg-purple-500/30"
                onClick={() => onApplyPreset('nightToDawnTransition')}
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-300" />
                    <div>
                        <div className="font-bold text-white text-xs">✨ Last 1/3 Night → Dawn Bridge (p=0.98)</div>
                        <div className="text-[10px] text-white/70">Comets & stars transitioning into pre-Fajr dawn</div>
                    </div>
                </div>
            </button>

            <div className="space-y-2">
                <span className="font-semibold text-[11px] text-white/60 uppercase tracking-wider">
                    Astronomical Presets
                </span>
                <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                    <PresetBtn label="🌅 Fajr Dawn" onClick={() => onApplyPreset('day1Fajr')} />
                    <PresetBtn label="🌄 Sunrise" onClick={() => onApplyPreset('day1Sunrise')} />
                    <PresetBtn label="☀️ Dhuhr (Zenith)" onClick={() => onApplyPreset('day1Dhuhr')} />
                    <PresetBtn label="🌤️ ʿAṣr Afternoon" onClick={() => onApplyPreset('day1Asr')} />
                    <PresetBtn label="🌇 Sun/Moon Shift" onClick={() => onApplyPreset('day1SunsetTransition')} />
                    <PresetBtn label="🌆 Maġrib Dusk" onClick={() => onApplyPreset('day1Maghrib')} />
                    <PresetBtn label="🌌 ʿIshāʾ Night" onClick={() => onApplyPreset('day1Isha')} />
                    <PresetBtn label="🌕 Midnight" onClick={() => onApplyPreset('day1Midnight')} />
                    <PresetBtn label="✨ Last 1/3 Night" onClick={() => onApplyPreset('day1LastThird')} />
                    <PresetBtn label="🌅 Day 2 Fajr" onClick={() => onApplyPreset('day2Fajr')} />
                </div>
            </div>
        </>
    );
}

function LunarScrubberControls({
    activeLunarCycle,
    onSetLunarCycle,
    simulatedLunarCycle,
}: {
    activeLunarCycle: number;
    onSetLunarCycle: (fraction: number | null) => void;
    simulatedLunarCycle: number | null;
}) {
    return (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-white/70 text-xs">
                    <span>Lunar Cycle Slider</span>
                    <span className="font-bold font-mono text-cyan-400">{(activeLunarCycle * 100).toFixed(1)}%</span>
                </div>
                <input
                    aria-label="Lunar cycle"
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-400"
                    max={1.0}
                    min={0.0}
                    onChange={(e) => onSetLunarCycle(Number.parseFloat(e.target.value))}
                    step={0.01}
                    type="range"
                    value={activeLunarCycle}
                />
            </div>

            <div className="space-y-2">
                <span className="font-semibold text-[11px] text-white/60 uppercase tracking-wider">
                    Canonical Lunar Phases
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                    {LUNAR_PRESETS.map((lp) => (
                        <PresetBtn
                            key={lp.fraction}
                            isActive={
                                simulatedLunarCycle !== null && Math.abs(simulatedLunarCycle - lp.fraction) < 0.04
                            }
                            label={lp.title}
                            onClick={() => onSetLunarCycle(lp.fraction)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

function PresetBtn({ label, onClick, isActive }: { isActive?: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            className={cn(
                'truncate rounded-xl px-2.5 py-1.5 text-left font-medium text-[11px] transition',
                isActive
                    ? 'bg-cyan-500 font-bold text-black shadow'
                    : 'bg-white/5 text-white/85 hover:bg-white/15 hover:text-white',
            )}
            onClick={onClick}
        >
            {label}
        </button>
    );
}
