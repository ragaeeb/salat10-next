"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
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
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-6 w-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export type LoaderReference = {
  label: string;
  url: string;
};

export type LoadingState = {
  title: string;
  summary: string;
  details?: string[];
  references?: LoaderReference[];
};

const LoaderCore = ({
  loadingStates,
  value = 0,
  onSelect,
}: {
  loadingStates: LoadingState[];
  value?: number;
  onSelect: (index: number) => void;
}) => {
  return (
    <div className="relative mx-auto mt-8 flex max-h-[70vh] w-full max-w-xl flex-col gap-3 overflow-y-auto pr-2">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0.2);

        const isCurrent = value === index;
        const isComplete = index < value;

        return (
          <motion.button
            key={loadingState.title}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-left transition",
              isCurrent
                ? "bg-white/90 text-green-900 shadow-lg"
                : "bg-white/40 text-green-900 hover:border-orange-300 hover:bg-white/70",
            )}
            style={{ opacity }}
            initial={{ opacity: 0, y: -(value * 24) }}
            animate={{ opacity, y: -(value * 24) }}
            transition={{ duration: 0.4 }}
          >
            <div className="pt-1">
              {isComplete ? (
                <CheckFilled className="text-orange-500" />
              ) : (
                <CheckIcon className={cn(isCurrent ? "text-orange-500" : "text-green-700") } />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Step {index + 1}
              </p>
              <h3 className="text-lg font-semibold text-green-900">{loadingState.title}</h3>
              <p className="text-sm text-green-800">{loadingState.summary}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2600,
  loop = false,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}) => {
  const [currentState, setCurrentState] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      setIsPaused(false);
      setShowDetails(false);
      return;
    }
  }, [loading]);

  useEffect(() => {
    if (!loading || isPaused || loadingStates.length === 0) {
      return;
    }
    if (!loop && currentState === loadingStates.length - 1) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCurrentState((prev) => {
        if (prev === loadingStates.length - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [currentState, duration, isPaused, loading, loadingStates.length, loop]);

  const activeState = useMemo(() => loadingStates[currentState], [currentState, loadingStates]);

  const handleSelect = (index: number) => {
    setCurrentState(index);
    setIsPaused(true);
    setShowDetails(true);
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
    setCurrentState((prev) => Math.min(prev + 1, loadingStates.length - 1));
    setIsPaused(true);
  };

  const handlePrevious = () => {
    setCurrentState((prev) => Math.max(prev - 1, 0));
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

  return (
    <AnimatePresence mode="wait">
      {loading && loadingStates.length > 0 && activeState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/20 backdrop-blur-2xl px-4 py-8"
        >
          <div className="relative flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/80 p-6 shadow-2xl ring-1 ring-green-300/60 md:flex-row md:gap-8">
            <div className="md:w-1/2">
              <LoaderCore loadingStates={loadingStates} onSelect={handleSelect} value={currentState} />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 rounded-2xl bg-white/90 p-6 shadow-inner">
              <div className="space-y-3 overflow-y-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Step {currentState + 1} of {loadingStates.length}
                </p>
                <h3 className="text-2xl font-bold text-green-900">{activeState.title}</h3>
                <p className="text-base text-green-800">{activeState.summary}</p>

                {showDetails && activeState.details && (
                  <div className="space-y-3 pt-2 text-sm text-green-800">
                    {activeState.details.map((detail, index) => (
                      <p key={index}>{detail}</p>
                    ))}
                  </div>
                )}

                {showDetails && activeState.references && activeState.references.length > 0 && (
                  <div className="space-y-2 pt-2 text-sm">
                    <p className="font-semibold text-green-900">Further reading</p>
                    <ul className="list-disc space-y-1 pl-5 text-green-800">
                      {activeState.references.map((reference) => (
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
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="rounded-full border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 transition hover:border-orange-400 hover:text-orange-500 disabled:cursor-not-allowed disabled:border-green-100 disabled:text-green-400"
                    disabled={currentState === 0}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full border border-green-300 px-4 py-2 text-sm font-semibold text-green-800 transition hover:border-orange-400 hover:text-orange-500 disabled:cursor-not-allowed disabled:border-green-100 disabled:text-green-400"
                    disabled={currentState === loadingStates.length - 1}
                  >
                    Next
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleDetails}
                    className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
                  >
                    {showDetails ? "Hide extra context" : "Show extra context"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      isPaused
                        ? "border border-green-400 text-green-700 hover:border-orange-400 hover:text-orange-500"
                        : "bg-green-700 text-white hover:bg-green-600",
                    )}
                  >
                    {isPaused ? "Resume autoplay" : "Pause here"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
