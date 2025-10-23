"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const STORAGE_KEY = "salat10-next:settings";

export const methodOptions = [
  { label: "Other (custom angles)", value: "Other" },
  { label: "Muslim World League", value: "MuslimWorldLeague" },
  { label: "Egyptian General Authority", value: "Egyptian" },
  { label: "Karachi (University of Islamic Sciences)", value: "Karachi" },
  { label: "Umm al-Qura (Makkah)", value: "UmmAlQura" },
  { label: "Dubai", value: "Dubai" },
  { label: "Moonsighting Committee Worldwide", value: "MoonsightingCommittee" },
  { label: "North America (ISNA)", value: "NorthAmerica" },
  { label: "Kuwait", value: "Kuwait" },
  { label: "Qatar", value: "Qatar" },
  { label: "Singapore", value: "Singapore" },
  { label: "Tehran", value: "Tehran" },
  { label: "Turkey (Diyanet)", value: "Turkey" },
] as const;

export type MethodValue = (typeof methodOptions)[number]["value"];

export type Settings = {
  address: string;
  fajrAngle: string;
  ishaAngle: string;
  latitude: string;
  longitude: string;
  method: MethodValue;
  timeZone: string;
};

export const methodLabelMap = methodOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export const getDefaultTimeZone = () => {
  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  }
  return "UTC";
};

export const defaultSettings: Settings = {
  address: "Ottawa, Canada",
  fajrAngle: "15",
  ishaAngle: "15",
  latitude: "45.3506",
  longitude: "-75.7930",
  method: "NorthAmerica",
  timeZone: getDefaultTimeZone(),
};

const mergeSettings = (stored: Partial<Settings> | null): Settings => ({
  ...defaultSettings,
  ...stored,
});

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        setSettings(mergeSettings(parsed));
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.warn("Failed to read stored settings", error);
      setSettings(defaultSettings);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((updater: Settings | ((prev: Settings) => Settings)) => {
    setSettings((prev) => (typeof updater === "function" ? (updater as (prev: Settings) => Settings)(prev) : updater));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const numeric = useMemo(() => ({
    latitude: Number.parseFloat(settings.latitude),
    longitude: Number.parseFloat(settings.longitude),
    fajrAngle: Number.parseFloat(settings.fajrAngle),
    ishaAngle: Number.parseFloat(settings.ishaAngle),
  }), [settings.fajrAngle, settings.ishaAngle, settings.latitude, settings.longitude]);

  return {
    settings,
    updateSetting,
    setSettings: updateSettings,
    resetSettings,
    hydrated,
    numeric,
  };
};
