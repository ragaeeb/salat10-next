'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export type PeriodNavigatorProps = {
    label: string;
    onNavigate: (direction: 1 | -1) => void;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    addon?: ReactNode;
};

export function PeriodNavigator({ label, onNavigate, previousDisabled, nextDisabled, addon }: PeriodNavigatorProps) {
    const handlePrevious = () => onNavigate(-1);
    const handleNext = () => onNavigate(1);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow">
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
            <div className="flex flex-1 flex-wrap items-center justify-center gap-3">
                <p className="text-center font-semibold text-foreground text-lg sm:text-xl">{label}</p>
                {addon ? <div className="flex items-center justify-center">{addon}</div> : null}
            </div>
            <Button variant="ghost" className="flex items-center gap-1" onClick={handleNext} disabled={nextDisabled}>
                <span aria-hidden>Next</span>
                <span className="sr-only">Next period</span>
                <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
        </div>
    );
}
