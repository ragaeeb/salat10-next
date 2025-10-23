export type StepReference = {
  label: string;
  url: string;
};

export type StepVisual =
  | {
      type: "world-map";
      latitude: number;
      longitude: number;
      caption: string;
    }
  | {
      type: "achievement";
      accent?: "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha" | "summary";
    };

export interface ExplanationStep {
  id: string;
  title: string;
  summary: string;
  details: string[];
  finalValue?: string;
  references?: StepReference[];
  visual?: StepVisual;
}

export interface MathSummaryLine {
  id: string;
  label: string;
  expression: string;
  result: string;
}

export interface ExplanationSummary {
  intro: string[];
  lines: MathSummaryLine[];
  outro: string[];
}

export interface PrayerTimeExplanation {
  steps: ExplanationStep[];
  summary: ExplanationSummary;
}
