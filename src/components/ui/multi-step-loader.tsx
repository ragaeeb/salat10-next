'use client';

import { Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { memo, useEffect, useState } from 'react';

import type { ExplanationStep, ExplanationSummary } from '@/lib/explanation/types';
import { cn } from '@/lib/utils';

import { Button } from './button';
import { ScrollArea } from './scroll-area';
import WorldMap from './world-map';

const CheckIcon = ({ className }: { className?: string }) => (
    <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        focusable="false"
        className={cn('h-6 w-6', className)}
    >
        <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const CheckFilled = ({ className }: { className?: string }) => (
    <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        focusable="false"
        className={cn('h-6 w-6', className)}
    >
        <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
        />
    </svg>
);

type StepTimelineProps = {
    steps: ExplanationStep[];
    activeIndex: number;
    onSelect: (index: number) => void;
    onLoadMore: () => void;
    visibleCount: number;
};

const StepTimeline = memo(({ steps, activeIndex, onSelect, onLoadMore, visibleCount }: StepTimelineProps) => {
    const displayed = steps.slice(0, visibleCount);
    const hasMore = visibleCount < steps.length;
    const resolvedActiveIndex = Math.min(activeIndex, steps.length - 1);
    const displayActiveIndex = Math.min(resolvedActiveIndex, Math.max(displayed.length - 1, 0));

    return (
        <ScrollArea className="h-full min-h-0 pr-2">
            <div className="flex flex-col gap-3">
                {displayed.map((step, index) => {
                    const distance = Math.abs(index - displayActiveIndex);
                    const opacity = Math.max(1 - distance * 0.15, 0.3);
                    const isCurrent = displayActiveIndex === index;
                    const isComplete = index < resolvedActiveIndex;

                    return (
                        <motion.button
                            key={step.id}
                            type="button"
                            onClick={() => onSelect(index)}
                            className={cn(
                                'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                                isCurrent
                                    ? 'border-primary bg-primary/10 text-foreground shadow-lg'
                                    : 'border-transparent bg-card/70 text-muted-foreground hover:border-border/70 hover:bg-card hover:text-foreground',
                            )}
                            style={{ opacity }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="pt-1 text-primary">
                                {isComplete ? (
                                    <CheckFilled className="text-primary" />
                                ) : (
                                    <CheckIcon className="text-primary" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                                    Step {index + 1}
                                </p>
                                <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                                <p className="text-muted-foreground/80 text-sm">{step.summary}</p>
                            </div>
                        </motion.button>
                    );
                })}
                {hasMore ? (
                    <Button type="button" variant="outline" size="sm" onClick={onLoadMore} className="border-dashed">
                        Load more steps
                    </Button>
                ) : null}
            </div>
        </ScrollArea>
    );
});
StepTimeline.displayName = 'StepTimeline';

const INITIAL_TIMELINE_STEPS = 24;
const TIMELINE_INCREMENT = 16;

type IdleWindow = Window &
    typeof globalThis & {
        cancelIdleCallback?: (handle: number) => void;
        requestIdleCallback?: (callback: () => void) => number;
    };

const StepVisual = ({ step }: { step: ExplanationStep }) => {
    if (!step.visual) {
        return null;
    }

    if (step.visual.type === 'world-map') {
        return (
            <div className="space-y-2">
                <WorldMap
                    dots={[
                        {
                            end: { lat: step.visual.latitude, lng: step.visual.longitude },
                            start: { lat: step.visual.latitude, lng: step.visual.longitude },
                        },
                    ]}
                />
                <p className="text-muted-foreground text-xs">{step.visual.caption}</p>
            </div>
        );
    }

    if (step.visual.type === 'image') {
        return (
            <div className="space-y-2">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-border/60">
                    <Image
                        alt={step.visual.alt}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 420px, 90vw"
                        src={step.visual.src}
                        unoptimized
                    />
                </div>
                {step.visual.caption ? <p className="text-muted-foreground text-xs">{step.visual.caption}</p> : null}
            </div>
        );
    }

    if (step.visual.type === 'achievement') {
        return (
            <motion.div
                initial={{ opacity: 0.6, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-card to-secondary/40 p-4 shadow-inner"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary)_0%,transparent_55%)] opacity-30" />
                <p className="relative font-semibold text-primary text-sm">Achievement step</p>
                <p className="relative text-muted-foreground text-xs">
                    A prayer time or key milestone was calculated here.
                </p>
            </motion.div>
        );
    }

    return null;
};

const StepReferences = ({ references }: { references?: ExplanationStep['references'] }) => {
    if (!references?.length) {
        return null;
    }
    return (
        <div className="space-y-2 pt-2 text-sm">
            <p className="font-semibold text-foreground">Further reading</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {references.map((reference) => (
                    <li key={reference.url}>
                        <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            {reference.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TabSwitcher = ({
    activeTab,
    hasSummary,
    onTabChange,
}: {
    activeTab: 'story' | 'math';
    hasSummary: boolean;
    onTabChange: (tab: 'story' | 'math') => void;
}) => (
    <div className="flex items-center gap-2 rounded-full bg-primary/10 p-1">
        <button
            type="button"
            onClick={() => onTabChange('story')}
            className={cn(
                'rounded-full px-3 py-1 font-semibold text-xs transition',
                activeTab === 'story'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            Story
        </button>
        {hasSummary && (
            <button
                type="button"
                onClick={() => onTabChange('math')}
                className={cn(
                    'rounded-full px-3 py-1 font-semibold text-xs transition',
                    activeTab === 'math'
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground',
                )}
            >
                Math trail
            </button>
        )}
    </div>
);

type StepControlsProps = {
    canGoBack: boolean;
    canGoForward: boolean;
    onNext: () => void;
    onPrevious: () => void;
    onToggleDetails: () => void;
    showDetails: boolean;
    showDetailsButton: boolean;
};

const StepControls = ({
    canGoBack,
    canGoForward,
    onNext,
    onPrevious,
    onToggleDetails,
    showDetails,
    showDetailsButton,
}: StepControlsProps) => (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={!canGoBack}>
                Previous
            </Button>
            <Button type="button" size="sm" onClick={onNext} disabled={!canGoForward}>
                Next
            </Button>
        </div>
        {showDetailsButton ? (
            <Button type="button" variant="secondary" size="sm" onClick={onToggleDetails}>
                {showDetails ? 'Hide extra context' : 'Show extra context'}
            </Button>
        ) : null}
    </div>
);

const StepDetail = memo(({ step, showDetails }: { step: ExplanationStep; showDetails: boolean }) => (
    <ScrollArea className="h-full min-h-0 pr-2">
        <div className="space-y-4 pr-1">
            <h3 className="font-bold text-2xl text-foreground">{step.title}</h3>
            <p className="text-base text-muted-foreground">{step.summary}</p>

            {step.finalValue && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 font-semibold text-primary text-sm shadow-sm">
                    <span className="text-primary/80 text-xs uppercase tracking-wide">Final value</span>
                    <span className="text-base text-primary">{step.finalValue}</span>
                </div>
            )}

            <StepVisual step={step} />

            {showDetails && step.details && (
                <div className="space-y-3 text-muted-foreground text-sm">
                    {step.details.map((detail, index) => (
                        <p key={`${step.id}-detail-${index}`}>{detail}</p>
                    ))}
                </div>
            )}

            {showDetails && <StepReferences references={step.references} />}
        </div>
    </ScrollArea>
));
StepDetail.displayName = 'StepDetail';

const SummaryView = memo(({ summary }: { summary: ExplanationSummary }) => (
    <ScrollArea className="h-full min-h-0 pr-2">
        <div className="space-y-4 pr-1">
            {summary.intro.map((line) => (
                <p key={`intro-${line}`} className="text-muted-foreground text-sm">
                    {line}
                </p>
            ))}
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-inner">
                <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">Math trail</h3>
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-border/50 pr-1">
                    <ul className="space-y-3 p-3 pr-2">
                        {summary.lines.map((line) => (
                            <li key={line.id} className="rounded-xl bg-primary/10 px-3 py-2">
                                <p className="font-semibold text-muted-foreground/80 text-xs uppercase tracking-wide">
                                    {line.label}
                                </p>
                                <p className="text-muted-foreground text-xs">{line.expression}</p>
                                <p className="font-semibold text-foreground text-sm">{line.result}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {summary.outro.map((line) => (
                <p key={`outro-${line}`} className="text-muted-foreground text-sm">
                    {line}
                </p>
            ))}
        </div>
    </ScrollArea>
));
SummaryView.displayName = 'SummaryView';

export type MultiStepLoaderProps = {
    steps: ExplanationStep[];
    summary?: ExplanationSummary | null;
    open: boolean;
    loading?: boolean;
    onClose?: () => void;
};

export const MultiStepLoader = ({ steps, summary, open, loading = false, onClose }: MultiStepLoaderProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [showDetails, setShowDetails] = useState(true);
    const [activeTab, setActiveTab] = useState<'story' | 'math'>('story');
    const [visibleCount, setVisibleCount] = useState(() => Math.min(steps.length, INITIAL_TIMELINE_STEPS));

    useEffect(() => {
        if (steps.length === 0) {
            setCurrentStep(0);
            return;
        }
        setCurrentStep((prev) => Math.min(prev, steps.length - 1));
    }, [steps.length]);

    useEffect(() => {
        if (open && steps.length > 0) {
            setCurrentStep(0);
            setShowDetails(true);
            setActiveTab('story');
            setVisibleCount(Math.min(steps.length, INITIAL_TIMELINE_STEPS));
        }
    }, [open, steps.length]);

    useEffect(() => {
        if (!open || steps.length === 0) {
            return;
        }
        setVisibleCount(Math.min(steps.length, INITIAL_TIMELINE_STEPS));
        if (steps.length <= INITIAL_TIMELINE_STEPS) {
            return;
        }

        let cancelled = false;
        let idleHandle: number | null = null;
        let timeoutHandle: number | null = null;
        const idleWindow = typeof window === 'undefined' ? null : (window as IdleWindow);

        const schedule = () => {
            const grow = () => {
                if (cancelled) {
                    return;
                }
                setVisibleCount((prev) => {
                    if (prev >= steps.length) {
                        return prev;
                    }
                    const next = Math.min(prev + TIMELINE_INCREMENT, steps.length);
                    if (next < steps.length) {
                        schedule();
                    }
                    return next;
                });
            };

            if (idleWindow?.requestIdleCallback) {
                idleHandle = idleWindow.requestIdleCallback(grow);
            } else {
                timeoutHandle = window.setTimeout(grow, 40);
            }
        };

        schedule();

        return () => {
            cancelled = true;
            if (idleHandle !== null) {
                idleWindow?.cancelIdleCallback?.(idleHandle);
            }
            if (timeoutHandle !== null) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, [open, steps.length]);

    useEffect(() => {
        if (currentStep >= visibleCount - 3 && visibleCount < steps.length) {
            setVisibleCount((prev) => Math.min(prev + TIMELINE_INCREMENT, steps.length));
        }
    }, [currentStep, steps.length, visibleCount]);

    const hasSteps = steps.length > 0;
    const safeIndex = hasSteps ? Math.min(currentStep, steps.length - 1) : 0;
    const activeStep = hasSteps ? steps[safeIndex] : undefined;
    const displayedStep = activeStep;
    const shouldRender = open && (hasSteps || loading);

    const handleSelect = (index: number) => {
        setCurrentStep(index);
        setShowDetails(true);
        setActiveTab('story');
    };

    const handleNext = () => {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        setShowDetails(true);
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        setShowDetails(true);
    };

    const toggleDetails = () => {
        setShowDetails((prev) => !prev);
    };

    const handleTabChange = (tab: 'story' | 'math') => {
        setActiveTab(tab);
        if (tab === 'story') {
            setShowDetails(true);
        }
    };

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + TIMELINE_INCREMENT, steps.length));
    };

    return (
        <AnimatePresence mode="wait">
            {shouldRender && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col bg-background/98 text-foreground"
                >
                    <div className="flex flex-col gap-4 px-4 pt-4 md:px-8">
                        <div className="flex items-start gap-3">
                            <p className="flex-1 font-semibold text-primary/80 text-xs uppercase tracking-wide">
                                {hasSteps ? `Step ${safeIndex + 1} of ${steps.length}` : 'Preparing explanation'}
                            </p>
                            <div className="ml-auto flex items-center gap-2">
                                <TabSwitcher
                                    activeTab={activeTab}
                                    hasSummary={Boolean(summary)}
                                    onTabChange={handleTabChange}
                                />
                                {onClose ? (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Close explanation"
                                        onClick={onClose}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {hasSteps && activeStep ? (
                        <div className="flex flex-1 flex-col gap-6 overflow-hidden px-4 pt-4 pb-6 md:flex-row md:px-8 md:pt-6 md:pb-10">
                            <div className="flex h-72 flex-none flex-col rounded-3xl border border-border/60 bg-card/80 p-4 shadow-inner md:h-full md:w-[38%]">
                                <StepTimeline
                                    steps={steps}
                                    activeIndex={currentStep}
                                    onSelect={handleSelect}
                                    onLoadMore={handleLoadMore}
                                    visibleCount={visibleCount}
                                />
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-3xl border border-border/60 bg-card/90 p-4 shadow-xl">
                                <div className="min-h-0 flex-1">
                                    {activeTab === 'story' ? (
                                        displayedStep ? (
                                            <StepDetail step={displayedStep} showDetails={showDetails} />
                                        ) : null
                                    ) : summary ? (
                                        <SummaryView summary={summary} />
                                    ) : null}
                                </div>

                                <StepControls
                                    canGoBack={safeIndex > 0}
                                    canGoForward={safeIndex < steps.length - 1}
                                    onNext={handleNext}
                                    onPrevious={handlePrevious}
                                    onToggleDetails={toggleDetails}
                                    showDetails={showDetails}
                                    showDetailsButton={activeTab === 'story'}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center px-4 pb-10">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="font-semibold text-foreground">Building today’s explanation…</p>
                                <p className="max-w-sm text-muted-foreground text-sm">
                                    We are pulling in the narration, math trail, and illustrations for your chosen
                                    settings.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
