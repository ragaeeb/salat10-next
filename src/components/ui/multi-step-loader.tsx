"use client";

import { cn } from "@/lib/utils";
import type { ExplanationStep, ExplanationSummary } from "@/lib/explanation/types";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import WorldMap from "./world-map";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={cn("h-6 w-6", className)}
  >
    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CheckFilled = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("h-6 w-6", className)}>
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clipRule="evenodd"
    />
  </svg>
);

const StepTimeline = ({ steps, activeIndex, onSelect }: { steps: ExplanationStep[]; activeIndex: number; onSelect: (index: number) => void }) => (
  <div className="relative mx-auto mt-6 flex max-h-[70vh] w-full max-w-xl flex-col gap-3 overflow-y-auto pr-2">
    {steps.map((step, index) => {
      const distance = Math.abs(index - activeIndex);
      const opacity = Math.max(1 - distance * 0.2, 0.25);
      const isCurrent = activeIndex === index;
      const isComplete = index < activeIndex;

      return (
        <motion.button
          key={step.id}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "flex w-full items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition",
            isCurrent ? "bg-white text-emerald-950 shadow-lg" : "bg-white/50 text-emerald-900 hover:border-orange-200 hover:bg-white/80",
          )}
          style={{ opacity }}
          initial={{ opacity: 0, y: -(activeIndex * 20) }}
          animate={{ opacity, y: -(activeIndex * 20) }}
          transition={{ duration: 0.4 }}
        >
          <div className="pt-1">
            {isComplete ? <CheckFilled className="text-orange-500" /> : <CheckIcon className={cn(isCurrent ? "text-orange-500" : "text-emerald-700")} />}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Step {index + 1}</p>
            <h3 className="text-lg font-semibold text-emerald-900">{step.title}</h3>
            <p className="text-sm text-emerald-800">{step.summary}</p>
          </div>
        </motion.button>
      );
    })}
  </div>
);

const StepVisual = ({ step }: { step: ExplanationStep }) => {
  if (!step.visual) return null;

  if (step.visual.type === "world-map") {
    return (
      <div className="space-y-2">
        <WorldMap
          dots={[
            {
              start: { lat: step.visual.latitude, lng: step.visual.longitude },
              end: { lat: step.visual.latitude, lng: step.visual.longitude },
            },
          ]}
        />
        <p className="text-xs text-emerald-700">{step.visual.caption}</p>
      </div>
    );
  }

  if (step.visual.type === "achievement") {
    return (
      <motion.div
        initial={{ opacity: 0.6, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-emerald-50 p-4 shadow-inner"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.35),transparent_55%)]" />
        <p className="relative text-sm font-semibold text-orange-600">Achievement step</p>
        <p className="relative text-xs text-emerald-800">A prayer time or key milestone was calculated here.</p>
      </motion.div>
    );
  }

  return null;
};

const StepReferences = ({ references }: { references?: ExplanationStep["references"] }) => {
  if (!references?.length) return null;
  return (
    <div className="space-y-2 pt-2 text-sm">
      <p className="font-semibold text-emerald-900">Further reading</p>
      <ul className="list-disc space-y-1 pl-5 text-emerald-800">
        {references.map((reference) => (
          <li key={reference.url}>
            <a href={reference.url} target="_blank" rel="noreferrer" className="text-orange-600 underline-offset-4 hover:underline">
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
  activeTab: "story" | "math";
  hasSummary: boolean;
  onTabChange: (tab: "story" | "math") => void;
}) => (
  <div className="flex items-center gap-2 rounded-full bg-emerald-100/70 p-1">
    <button
      type="button"
      onClick={() => onTabChange("story")}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition",
        activeTab === "story" ? "bg-white text-emerald-900 shadow" : "text-emerald-700 hover:text-emerald-900",
      )}
    >
      Story
    </button>
    {hasSummary && (
      <button
        type="button"
        onClick={() => onTabChange("math")}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold transition",
          activeTab === "math" ? "bg-white text-emerald-900 shadow" : "text-emerald-700 hover:text-emerald-900",
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
  onPause,
  onPrevious,
  onToggleDetails,
  showDetails,
  showDetailsButton,
  isPaused,
}: {
  canGoBack: boolean;
  canGoForward: boolean;
  onNext: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onToggleDetails: () => void;
  showDetails: boolean;
  showDetailsButton: boolean;
  isPaused: boolean;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-400"
        disabled={!canGoBack}
      >
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:border-emerald-100 disabled:text-emerald-400"
        disabled={!canGoForward}
      >
        Next
      </button>
    </div>
    <div className="flex items-center gap-2">
      {showDetailsButton && (
        <button
          type="button"
          onClick={onToggleDetails}
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
        >
          {showDetails ? "Hide extra context" : "Show extra context"}
        </button>
      )}
      <button
        type="button"
        onClick={onPause}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition",
          isPaused
            ? "border border-emerald-400 text-emerald-700 hover:border-orange-400 hover:text-orange-500"
            : "bg-emerald-700 text-white hover:bg-emerald-600",
        )}
      >
        {isPaused ? "Resume autoplay" : "Pause here"}
      </button>
    </div>
  </div>
);

const StepDetail = ({
  step,
  showDetails,
}: {
  step: ExplanationStep;
  showDetails: boolean;
}) => (
  <div className="space-y-4 overflow-y-auto">
    <h3 className="text-2xl font-bold text-emerald-950">{step.title}</h3>
    <p className="text-base text-emerald-800">{step.summary}</p>

    {step.finalValue && (
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/80 px-3 py-1 text-sm font-semibold text-orange-700 shadow-sm">
        <span className="text-xs uppercase tracking-wide text-orange-500">Final value</span>
        <span className="text-base text-orange-800">{step.finalValue}</span>
      </div>
    )}

    <StepVisual step={step} />

    {showDetails && step.details && (
      <div className="space-y-3 text-sm text-emerald-800">
        {step.details.map((detail, index) => (
          <p key={index}>{detail}</p>
        ))}
      </div>
    )}

    {showDetails && <StepReferences references={step.references} />}
  </div>
);

const SummaryView = ({ summary }: { summary: ExplanationSummary }) => (
  <div className="space-y-4 overflow-y-auto">
    {summary.intro.map((line, index) => (
      <p key={`intro-${index}`} className="text-sm text-emerald-800">
        {line}
      </p>
    ))}
    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-inner">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Math trail</h3>
      <ul className="mt-3 space-y-3">
        {summary.lines.map((line) => (
          <li key={line.id} className="rounded-xl bg-emerald-50/70 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{line.label}</p>
            <p className="text-xs text-emerald-600">{line.expression}</p>
            <p className="text-sm font-semibold text-emerald-900">{line.result}</p>
          </li>
        ))}
      </ul>
    </div>
    {summary.outro.map((line, index) => (
      <p key={`outro-${index}`} className="text-sm text-emerald-800">
        {line}
      </p>
    ))}
  </div>
);

export type MultiStepLoaderProps = {
  steps: ExplanationStep[];
  summary?: ExplanationSummary | null;
  loading?: boolean;
  duration?: number;
  loop?: boolean;
};

export const MultiStepLoader = ({ steps, summary, loading, duration = 3200, loop = false }: MultiStepLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"story" | "math">("story");

  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      setIsPaused(false);
      setShowDetails(false);
      setActiveTab("story");
    }
  }, [loading]);

  useEffect(() => {
    if (!loading || isPaused || steps.length === 0 || activeTab !== "story") {
      return;
    }
    if (!loop && currentStep === steps.length - 1) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCurrentStep((prev) => {
        if (prev === steps.length - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [activeTab, currentStep, duration, isPaused, loading, loop, steps.length]);

  const activeStep = useMemo(() => steps[currentStep], [currentStep, steps]);

  const handleSelect = (index: number) => {
    setCurrentStep(index);
    setIsPaused(true);
    setShowDetails(true);
    setActiveTab("story");
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        setShowDetails(true);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    setIsPaused(true);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setIsPaused(true);
  };

  const toggleDetails = () => {
    setShowDetails((prev) => {
      const next = !prev;
      if (next) {
        setIsPaused(true);
      }
      return next;
    });
  };

  const handleTabChange = (tab: "story" | "math") => {
    setActiveTab(tab);
    if (tab === "math") {
      setIsPaused(true);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading && steps.length > 0 && activeStep && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/20 backdrop-blur-2xl px-4 py-8"
        >
          <div className="relative flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-2xl ring-1 ring-emerald-200 md:flex-row md:gap-8">
            <div className="md:w-1/2">
              <StepTimeline steps={steps} activeIndex={currentStep} onSelect={handleSelect} />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 rounded-2xl bg-white/90 p-6 shadow-inner">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <TabSwitcher activeTab={activeTab} hasSummary={Boolean(summary)} onTabChange={handleTabChange} />
              </div>

              {activeTab === "story" ? (
                <StepDetail step={activeStep} showDetails={showDetails} />
              ) : summary ? (
                <SummaryView summary={summary} />
              ) : null}

              <StepControls
                canGoBack={currentStep > 0}
                canGoForward={currentStep < steps.length - 1}
                onNext={handleNext}
                onPause={handleTogglePause}
                onPrevious={handlePrevious}
                onToggleDetails={toggleDetails}
                showDetails={showDetails}
                showDetailsButton={activeTab === "story"}
                isPaused={isPaused}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
