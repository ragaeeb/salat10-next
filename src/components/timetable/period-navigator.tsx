'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';

export type PeriodNavigatorProps = {
    label: string;
    onNavigate: (direction: 1 | -1) => void;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
};

export function PeriodNavigator({ label, onNavigate, previousDisabled, nextDisabled }: PeriodNavigatorProps) {
    const handlePrevious = useCallback(() => onNavigate(-1), [onNavigate]);
    const handleNext = useCallback(() => onNavigate(1), [onNavigate]);

    return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
            <Button
                variant="ghost"
                className="flex items-center gap-1"
                onClick={handlePrevious}
                disabled={previousDisabled}
            >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                <span className="sr-only">Previous period</span>
                <span aria-hidden>Prev</span>
            </Button>
            <p className="text-center text-lg font-semibold text-foreground sm:text-xl">{label}</p>
            <Button variant="ghost" className="flex items-center gap-1" onClick={handleNext} disabled={nextDisabled}>
                <span aria-hidden>Next</span>
                <span className="sr-only">Next period</span>
                <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
        </div>
    );
}
