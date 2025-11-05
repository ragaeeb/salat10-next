import { AnimatePresence, type MotionValue, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ShinyText } from '@/components/magicui/shiny-text';
import { phaseLabelAndTime } from '@/lib/formatting';
import type { DayData, Timeline } from '@/types/timeline';

type CurrentPhaseProps = {
    scrollProgress: MotionValue<number>;
    timeline: Timeline | null;
    currentDay: DayData | undefined;
    timeZone: string;
};

export const CurrentPhase = ({ scrollProgress, timeline, currentDay, timeZone }: CurrentPhaseProps) => {
    const [phaseInfo, setPhaseInfo] = useState<{ label: string; time: string }>({ label: '', time: '' });

    useEffect(() => {
        if (!timeline || !currentDay) {
            return;
        }
        const unsub = scrollProgress.on('change', (p) => {
            const info = phaseLabelAndTime(p, timeline, currentDay.timings, timeZone);
            setPhaseInfo((prev) => (prev.label === info.label && prev.time === info.time ? prev : info));
        });
        return () => unsub();
    }, [scrollProgress, timeline, currentDay, timeZone]);

    return (
        <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-25">
            <AnimatePresence mode="wait">
                <motion.div
                    key={phaseInfo.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                    <ShinyText className="block text-balance text-center font-extrabold text-[clamp(2rem,8vw,4.5rem)] text-foreground/60 leading-tight drop-shadow-sm">
                        {phaseInfo.label}
                    </ShinyText>
                </motion.div>
            </AnimatePresence>
            {!!phaseInfo.time && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phaseInfo.time}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="mt-4 text-center font-semibold text-[clamp(1.5rem,4vw,2.5rem)] text-foreground/50"
                    >
                        {phaseInfo.time}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};
