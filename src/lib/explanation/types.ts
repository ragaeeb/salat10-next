/**
 * Reference link to external resource (hadith, article, etc.)
 */
export type StepReference = {
    /** Display text for link */
    label: string;
    /** Full URL */
    url: string;
};

/**
 * Visual element to accompany explanation step
 * Can be world map, image, or achievement badge
 */
export type StepVisual =
    | { type: 'world-map'; latitude: number; longitude: number; caption: string }
    | { type: 'image'; src: string; alt: string; caption?: string }
    | { type: 'achievement'; accent?: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'summary' };

/**
 * Single step in the prayer time calculation explanation
 * Provides narrative description with optional visual and references
 */
export interface ExplanationStep {
    /** Unique identifier for this step */
    id: string;
    /** Short title for step */
    title: string;
    /** One-sentence summary */
    summary: string;
    /** Detailed explanation paragraphs */
    details: string[];
    /** Final computed value for this step (optional) */
    finalValue?: string;
    /** Links to external references (optional) */
    references?: StepReference[];
    /** Visual element for this step (optional) */
    visual?: StepVisual;
}

/**
 * Single line in the mathematical summary
 * Shows formula and result for key calculations
 */
export interface MathSummaryLine {
    /** Unique identifier */
    id: string;
    /** Human-readable label */
    label: string;
    /** Mathematical expression or formula */
    expression: string;
    /** Computed result */
    result: string;
}

/**
 * Summary section at end of explanation
 * Includes intro, math lines, and outro
 */
export interface ExplanationSummary {
    /** Introductory sentences */
    intro: string[];
    /** Array of mathematical summary lines */
    lines: MathSummaryLine[];
    /** Concluding sentences */
    outro: string[];
}

/**
 * Complete prayer time calculation explanation
 * Combines step-by-step narrative with mathematical summary
 */
export interface PrayerTimeExplanation {
    /** Ordered array of explanation steps */
    steps: ExplanationStep[];
    /** Mathematical summary section */
    summary: ExplanationSummary;
}
