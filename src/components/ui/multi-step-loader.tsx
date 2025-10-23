'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { memo, useEffect, useState } from 'react';

import type { ExplanationStep, ExplanationSummary } from '@/lib/explanation/types';
import { cn } from '@/lib/utils';

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

const StepTimeline = memo(
    ({
        steps,
        activeIndex,
        onSelect,
        onLoadMore,
        visibleCount,
    }: {
        steps: ExplanationStep[];
        activeIndex: number;
        onSelect: (index: number) => void;
        onLoadMore: () => void;
        visibleCount: number;
    }) => {
        const displayed = steps.slice(0, visibleCount);
        const hasMore = visibleCount < steps.length;
        const resolvedActiveIndex = Math.min(activeIndex, steps.length - 1);
        const displayActiveIndex = Math.min(resolvedActiveIndex, Math.max(displayed.length - 1, 0));

        return (
            <ScrollArea className="relative mx-auto mt-6 max-h-[65vh] w-full max-w-xl pr-2 md:mt-0 md:h-full md:max-h-none md:pr-3">
                <div className="flex flex-col gap-3">
                    {displayed.map((step, index) => {
                        const distance = Math.abs(index - displayActiveIndex);
                        const opacity = Math.max(1 - distance * 0.2, 0.25);
                        const isCurrent = displayActiveIndex === index;
                        const isComplete = index < resolvedActiveIndex;

                        return (
                            <motion.button
                                key={step.id}
                                type="button"
                                onClick={() => onSelect(index)}
                                className={cn(
                                    'flex w-full items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition',
                                    isCurrent
                                        ? 'bg-white text-emerald-950 shadow-lg'
                                        : 'bg-white/50 text-emerald-900 hover:border-orange-200 hover:bg-white/80',
                                )}
                                style={{ opacity }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="pt-1">
                                    {isComplete ? (
                                        <CheckFilled className="text-orange-500" />
                                    ) : (
                                        <CheckIcon className={cn(isCurrent ? 'text-orange-500' : 'text-emerald-700')} />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-emerald-700 text-xs uppercase tracking-wide">
                                        Step {index + 1}
                                    </p>
                                    <h3 className="font-semibold text-emerald-900 text-lg">{step.title}</h3>
                                    <p className="text-emerald-800 text-sm">{step.summary}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                    {hasMore ? (
                        <button
                            type="button"
                            onClick={onLoadMore}
                            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 border-dashed bg-white/50 px-4 py-3 font-semibold text-emerald-700 text-sm transition hover:border-orange-300 hover:text-orange-500"
                        >
                            Load more steps
                        </button>
                    ) : null}
                </div>
            </ScrollArea>
        );
    },
);
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
                <p className="text-emerald-700 text-xs">{step.visual.caption}</p>
            </div>
        );
    }

    if (step.visual.type === 'image') {
        return (
            <div className="space-y-2">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-emerald-100">
                    <Image
                        alt={step.visual.alt}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 420px, 90vw"
                        src={step.visual.src}
                        unoptimized
                    />
                </div>
                {step.visual.caption ? <p className="text-emerald-700 text-xs">{step.visual.caption}</p> : null}
            </div>
        );
    }

    if (step.visual.type === 'achievement') {
        return (
            <motion.div
                initial={{ opacity: 0.6, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-emerald-50 p-4 shadow-inner"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.35),transparent_55%)]" />
                <p className="relative font-semibold text-orange-600 text-sm">Achievement step</p>
                <p className="relative text-emerald-800 text-xs">A prayer time or key milestone was calculated here.</p>
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
            <p className="font-semibold text-emerald-900">Further reading</p>
            <ul className="list-disc space-y-1 pl-5 text-emerald-800">
                {references.map((reference) => (
                    <li key={reference.url}>
                        <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 underline-offset-4 hover:underline"
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
    <div className="flex items-center gap-2 rounded-full bg-emerald-100/70 p-1">
        <button
            type="button"
            onClick={() => onTabChange('story')}
            className={cn(
                'rounded-full px-3 py-1 font-semibold text-xs transition',
                activeTab === 'story' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-700 hover:text-emerald-900',
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
                        ? 'bg-white text-emerald-900 shadow'
                        : 'text-emerald-700 hover:text-emerald-900',
                )}
            >
                Math trail
            </button>
        )}
    </div>
);

const StepControls = ({
    canGoBack,
    canGoForward,
    onNext,
    onPrevious,
    onToggleDetails,
    showDetails,
    showDetailsButton,
}: {
    canGoBack: boolean;
    canGoForward: boolean;
    onNext: () => void;
    onPrevious: () => void;
    onToggleDetails: () => void;
    showDetails: boolean;
    showDetailsButton: boolean;
}) => (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onPrevious}
                className="rounded-full border border-emerald-300 bg-white px-4 py-2 font-semibold text-emerald-800 text-sm shadow-sm transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-300 disabled:shadow-none"
                disabled={!canGoBack}
            >
                Previous
            </button>
            <button
                type="button"
                onClick={onNext}
                className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-sm text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-white/70 disabled:shadow-none"
                disabled={!canGoForward}
            >
                Next
            </button>
        </div>
        {showDetailsButton ? (
            <button
                type="button"
                onClick={onToggleDetails}
                className="rounded-full bg-orange-500 px-4 py-2 font-semibold text-sm text-white shadow transition hover:bg-orange-400"
            >
                {showDetails ? 'Hide extra context' : 'Show extra context'}
            </button>
        ) : null}
    </div>
);

const StepDetail = memo(({ step, showDetails }: { step: ExplanationStep; showDetails: boolean }) => (
    <ScrollArea className="h-full pr-3">
        <div className="space-y-4 pr-1">
            <h3 className="font-bold text-2xl text-emerald-950">{step.title}</h3>
            <p className="text-base text-emerald-800">{step.summary}</p>

            {step.finalValue && (
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/80 px-3 py-1 font-semibold text-orange-700 text-sm shadow-sm">
                    <span className="text-orange-500 text-xs uppercase tracking-wide">Final value</span>
                    <span className="text-base text-orange-800">{step.finalValue}</span>
                </div>
            )}

            <StepVisual step={step} />

            {showDetails && step.details && (
                <div className="space-y-3 text-emerald-800 text-sm">
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
    <ScrollArea className="h-full pr-3">
        <div className="space-y-4 pr-1">
            {summary.intro.map((line) => (
                <p key={`intro-${line}`} className="text-emerald-800 text-sm">
                    {line}
                </p>
            ))}
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-inner">
                <h3 className="font-semibold text-emerald-700 text-sm uppercase tracking-wide">Math trail</h3>
                <ScrollArea className="mt-3 max-h-64 rounded-xl border border-emerald-100 pr-3">
                    <ul className="space-y-3 p-3 pr-1">
                        {summary.lines.map((line) => (
                            <li key={line.id} className="rounded-xl bg-emerald-50/70 px-3 py-2">
                                <p className="font-semibold text-emerald-700 text-xs uppercase tracking-wide">
                                    {line.label}
                                </p>
                                <p className="text-emerald-600 text-xs">{line.expression}</p>
                                <p className="font-semibold text-emerald-900 text-sm">{line.result}</p>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
            {summary.outro.map((line) => (
                <p key={`outro-${line}`} className="text-emerald-800 text-sm">
                    {line}
                </p>
            ))}
        </div>
    </ScrollArea>
));
SummaryView.displayName = 'SummaryView';

export type MultiStepLoaderProps = { steps: ExplanationStep[]; summary?: ExplanationSummary | null; open: boolean };

export const MultiStepLoader = ({ steps, summary, open }: MultiStepLoaderProps) => {
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
        if (open) {
            setCurrentStep(0);
            setShowDetails(true);
            setActiveTab('story');
            setVisibleCount(Math.min(steps.length, INITIAL_TIMELINE_STEPS));
        }
    }, [open, steps.length]);

    useEffect(() => {
        if (!open) {
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
            {open && hasSteps && activeStep && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/20 px-4 py-8 backdrop-blur-2xl"
                >
                    <div className="relative flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-2xl ring-1 ring-emerald-200 md:h-[85vh] md:max-h-[85vh] md:flex-row md:gap-8">
                        <div className="md:min-h-0 md:w-[42%]">
                            <StepTimeline
                                steps={steps}
                                activeIndex={currentStep}
                                onSelect={handleSelect}
                                onLoadMore={handleLoadMore}
                                visibleCount={visibleCount}
                            />
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl bg-white/90 p-6 shadow-inner">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-emerald-700 text-xs uppercase tracking-wide">
                                    Step {safeIndex + 1} of {steps.length}
                                </p>
                                <TabSwitcher
                                    activeTab={activeTab}
                                    hasSummary={Boolean(summary)}
                                    onTabChange={handleTabChange}
                                />
                            </div>

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
                </motion.div>
            )}
        </AnimatePresence>
    );
};
