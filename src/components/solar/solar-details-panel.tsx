import { memo } from 'react';
import type { FormattedTiming } from '@/lib/calculator';
import type { SolarPosition } from '@/lib/solar-position';

type SolarDetailsPanelProps = {
    /** Calculated prayer times for the active day */
    timings: FormattedTiming[];
    /** Display timezone */
    timeZone: string;
    /** Latest solar position */
    position: SolarPosition | null;
    /** Timestamp of the last solar calculation */
    timestamp: Date | null;
    /** Shadow ratio for current sun altitude */
    shadowRatio: number | null;
    /** Target ratio based on madhab */
    shadowThreshold: number;
    /** Indicates if Asr requirement is satisfied */
    isAsr: boolean;
};

/**
 * Side panel showing formatted prayer times and live solar telemetry.
 */
export const SolarDetailsPanel = memo(
    ({ timings, timeZone, position, timestamp, shadowRatio, shadowThreshold, isAsr }: SolarDetailsPanelProps) => {
        const formattedTimestamp = timestamp
            ? new Intl.DateTimeFormat('en-US', {
                  day: 'numeric',
                  hour: '2-digit',
                  hour12: true,
                  minute: '2-digit',
                  month: 'short',
                  second: '2-digit',
                  timeZone,
              }).format(timestamp)
            : '—';

        const altitude = position ? `${position.altitude.toFixed(2)}°` : '—';
        const azimuth = position ? `${position.azimuth.toFixed(0)}°` : '—';
        const ratio = shadowRatio ? `${shadowRatio.toFixed(2)}×` : '—';
        const threshold = `${shadowThreshold.toFixed(2)}×`;

        return (
            <div className="w-full max-w-5xl space-y-6">
                <div className="rounded-3xl border border-white/5 bg-white/5 px-6 py-5 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-200">
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Live telemetry</div>
                            <div className="mt-1 font-semibold text-slate-50">{formattedTimestamp}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs sm:grid-cols-4">
                            <div>
                                <div className="text-slate-300">Altitude</div>
                                <div className="font-semibold text-slate-50">{altitude}</div>
                            </div>
                            <div>
                                <div className="text-slate-300">Azimuth</div>
                                <div className="font-semibold text-slate-50">{azimuth}</div>
                            </div>
                            <div>
                                <div className="text-slate-300">Shadow ratio</div>
                                <div className="font-semibold text-slate-50">{ratio}</div>
                            </div>
                            <div>
                                <div className="text-slate-300">Asr threshold</div>
                                <div className="font-semibold text-slate-50">{threshold}</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-black/40 px-4 py-3 text-sm text-slate-200">
                        {isAsr ? 'The shadow satisfies the Asr requirement.' : 'The shadow has not reached the Asr requirement.'}
                    </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-white/5 px-6 py-6 backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-300">Prayer timetable</div>
                    <ul className="mt-4 divide-y divide-white/10 text-sm text-slate-100">
                        {timings.map((timing) => (
                            <li key={timing.event} className="flex items-center justify-between gap-4 py-2">
                                <span className="font-medium text-slate-50">{timing.label}</span>
                                <span className="tabular-nums text-slate-200">{timing.time}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    },
);

SolarDetailsPanel.displayName = 'SolarDetailsPanel';
