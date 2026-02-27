import { motion } from 'motion/react';
import { formatDate, formatHijriDate } from '@/lib/formatting';
import { writeIslamicDate } from '@/lib/hijri';

type HijriDateBadgeProps = { date: Date };

export function HijriDateBadge({ date }: HijriDateBadgeProps) {
    const hijriLabel = formatHijriDate(writeIslamicDate(0, date));

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2"
        >
            <div className="rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-md">
                <p className="font-medium text-white/90 text-xs tracking-wide">
                    {hijriLabel} ({formatDate(date)})
                </p>
            </div>
        </motion.div>
    );
}
