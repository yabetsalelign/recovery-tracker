import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { format } from "date-fns";
import type {
  TrackerRecord,
  GoalConfig,
  GeneralNotesMap,
  SpecializedTrackerData,
  NoteEntry,
  EmotionalWeatherMap,
  ActionResult,
  BackupPayload,
  RecoveryContextType,
} from "../types";
import type {
  CanonicalTrackerRecord,
  CanonicalStorageEnvelope,
  DayRecord,
  TrackerCategory,
  TrackingModality,
} from "../types/tracker";
import {
  calculateConsecutiveStreak,
  calculateLongestConsecutiveStreak,
  calculateSpecializedZeroStreak,
  escapeCsvValue,
  buildRecoveryCsv,
} from "../utils/recoveryCalculations";
import {
  CANONICAL_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  initializeCanonicalData,
  persistCanonicalEnvelope,
  toLegacyTrackerRecord,
  extractSpecializedData,
  applyToggleCheckIn,
  applySetCheckIn,
  applySpecializedCount,
  applySaveNote,
  applyDeleteNote,
  applyTrackerDayRecord,
  applyTrackerDayStatus,
  applyTrackerGeneralNote,
  applyTrackerDayNote,
  applyDeleteTrackerDayNote,
} from "../utils/canonicalStore";
import { inferLegacyModality, resolveBackupPayload } from "../utils/unifiedMigration";
import { validateDayRecordStatus, isFiniteNonNegativeNumber } from "../utils/unifiedCalculations";
import { createCanonicalTracker } from "../utils/trackerCreation";

export const RecoveryContext = createContext<RecoveryContextType | null>(null);

// Safe JSON parser helper
const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (e) {
    console.warn(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

// Safe JSON serializer helper
const safeSet = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving localStorage key "${key}":`, e);
  }
};

const loadEmotionalWeather = (): EmotionalWeatherMap => {
  const dates = new Set<string>();
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("mood_")) dates.add(key.slice("mood_".length));
    if (key?.startsWith("moodNote_")) dates.add(key.slice("moodNote_".length));
    if (key?.startsWith("checkedIn_")) dates.add(key.slice("checkedIn_".length));
  }
  const entries: EmotionalWeatherMap = {};
  dates.forEach((date) => {
    entries[date] = {
      mood: localStorage.getItem(`mood_${date}`) || "",
      note: localStorage.getItem(`moodNote_${date}`) || "",
      checkedIn: localStorage.getItem(`checkedIn_${date}`) === "true",
    };
  });
  return entries;
};

export {
  calculateConsecutiveStreak,
  calculateLongestConsecutiveStreak,
  calculateSpecializedZeroStreak,
  escapeCsvValue,
};

export const RecoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Canonical State: Single source of truth for unified tracker records
  const [initResult] = useState(() => initializeCanonicalData(localStorage));

  const [canonicalTrackers, setCanonicalTrackers] = useState<CanonicalTrackerRecord[]>(
    () => initResult.trackers
  );

  const [migrationError] = useState<string | null>(
    () => initResult.error || null
  );

  // 2. Backward-compatible projections derived dynamically from canonical trackers
  const trackers = useMemo<TrackerRecord[]>(
    () => canonicalTrackers.map(toLegacyTrackerRecord),
    [canonicalTrackers]
  );

  const addictions = useMemo<string[]>(
    () => canonicalTrackers.map((t) => t.name),
    [canonicalTrackers]
  );

  const seshData = useMemo<SpecializedTrackerData>(
    () => extractSpecializedData(canonicalTrackers, "Sesh"),
    [canonicalTrackers]
  );

  const weedData = useMemo<SpecializedTrackerData>(
    () => extractSpecializedData(canonicalTrackers, "Weed"),
    [canonicalTrackers]
  );

  const pornData = useMemo<SpecializedTrackerData>(
    () => extractSpecializedData(canonicalTrackers, "Porn"),
    [canonicalTrackers]
  );

  const pornNotes = useMemo<string>(() => {
    const porn = canonicalTrackers.find((t) => t.name.toLowerCase() === "porn");
    return porn?.generalNote || "";
  }, [canonicalTrackers]);

  // 3. Journal general notes and emotional weather
  const [generalNotes, setGeneralNotes] = useState<GeneralNotesMap>(() => {
    const existing = safeParse<GeneralNotesMap>(LEGACY_STORAGE_KEYS.GENERAL_NOTES, {});
    if (initResult.transferredJournalNotes && Object.keys(initResult.transferredJournalNotes).length > 0) {
      return { ...initResult.transferredJournalNotes, ...existing };
    }
    return existing;
  });

  const [emotionalWeather, setEmotionalWeather] = useState<EmotionalWeatherMap>(loadEmotionalWeather);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return localStorage.getItem(LEGACY_STORAGE_KEYS.SELECTED_DATE) || format(new Date(), "yyyy-MM-dd");
  });

  const [counterStartDate, setCounterStartDate] = useState<string>(() => {
    return localStorage.getItem(LEGACY_STORAGE_KEYS.COUNTER_START_DATE) || format(new Date(), "yyyy-MM-dd");
  });

  // 4. Persistence Effect: Atomically persist canonical trackers to CANONICAL_STORAGE_KEY only
  // Existing legacy keys are NEVER dual-written or automatically deleted.
  useEffect(() => {
    persistCanonicalEnvelope(localStorage, canonicalTrackers);
  }, [canonicalTrackers]);

  useEffect(() => {
    safeSet(LEGACY_STORAGE_KEYS.GENERAL_NOTES, generalNotes);
  }, [generalNotes]);

  useEffect(() => {
    try {
      Object.entries(emotionalWeather).forEach(([date, entry]) => {
        localStorage.setItem(`mood_${date}`, entry.mood);
        localStorage.setItem(`moodNote_${date}`, entry.note);
        localStorage.setItem(`checkedIn_${date}`, String(entry.checkedIn));
      });
      const currentDates = new Set(Object.keys(emotionalWeather));
      const staleKeys: string[] = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        const prefix = key?.startsWith("moodNote_")
          ? "moodNote_"
          : key?.startsWith("checkedIn_")
          ? "checkedIn_"
          : key?.startsWith("mood_")
          ? "mood_"
          : null;
        if (key && prefix && !currentDates.has(key.slice(prefix.length))) staleKeys.push(key);
      }
      staleKeys.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error("Error saving emotional weather records:", e);
    }
  }, [emotionalWeather]);

  useEffect(() => {
    try {
      localStorage.setItem(LEGACY_STORAGE_KEYS.SELECTED_DATE, selectedDate);
    } catch (e) {}
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem(LEGACY_STORAGE_KEYS.COUNTER_START_DATE, counterStartDate);
    } catch (e) {}
  }, [counterStartDate]);

  // 5. Operations updating canonical state immutably

  const toggleCheckIn = useCallback((habitName: string, dateStr: string) => {
    if (!habitName || !dateStr) return;
    setCanonicalTrackers((prev) => applyToggleCheckIn(prev, habitName, dateStr));
  }, []);

  const setCheckIn = useCallback((habitName: string, dateStr: string, isChecked: boolean) => {
    if (!habitName || !dateStr) return;
    setCanonicalTrackers((prev) => applySetCheckIn(prev, habitName, dateStr, isChecked));
  }, []);

  const setTrackerDayRecord = useCallback((trackerId: string, dateStr: string, record: DayRecord | null) => {
    setCanonicalTrackers((prev) => applyTrackerDayRecord(prev, trackerId, dateStr, record));
  }, []);

  const logTrackerDayStatus = useCallback((trackerId: string, dateStr: string, status: DayRecord["status"], value?: number) => {
    if (!status) return;
    const tracker = canonicalTrackers.find((item) => item.id === trackerId);
    if (!tracker || !validateDayRecordStatus(tracker.modality, status)) return;
    if (tracker.modality === "frequency" && !isFiniteNonNegativeNumber(value ?? 0)) return;
    setCanonicalTrackers((prev) => applyTrackerDayStatus(prev, trackerId, dateStr, status, value));
  }, [canonicalTrackers]);

  const saveTrackerGeneralNote = useCallback((trackerId: string, note: string) => {
    setCanonicalTrackers((prev) => applyTrackerGeneralNote(prev, trackerId, note));
  }, []);

  const saveTrackerDayNote = useCallback((trackerId: string, dateStr: string, note: string) => {
    setCanonicalTrackers((prev) => applyTrackerDayNote(prev, trackerId, dateStr, note));
  }, []);

  const deleteTrackerDayNote = useCallback((trackerId: string, dateStr: string) => {
    setCanonicalTrackers((prev) => applyDeleteTrackerDayNote(prev, trackerId, dateStr));
  }, []);

  const completeDailyCheckin = useCallback(
    (dateStr: string, mood = "okay", note = "") => {
      if (!dateStr) return;
      setEmotionalWeather((prev) => ({
        ...prev,
        [dateStr]: { mood, note, checkedIn: true },
      }));
    },
    []
  );

  const savePornNotes = useCallback((text: string) => {
    const trimmed = text.trim();
    setCanonicalTrackers((prev) =>
      prev.map((t) => {
        if (t.name.toLowerCase() === "porn") {
          return { ...t, generalNote: trimmed };
        }
        return t;
      })
    );
  }, []);

  const addGoal = useCallback((goalConfig: GoalConfig): ActionResult => {
    const title = (goalConfig?.title || goalConfig?.name || "").trim();
    const requestedModality = goalConfig.modality;
    const supportedModalities: TrackingModality[] = ["abstinence", "frequency", "daily_habit", "boundary"];
    const explicitModality = requestedModality && supportedModalities.includes(requestedModality as TrackingModality)
      ? requestedModality as TrackingModality
      : undefined;
    const inferred = explicitModality ? undefined : inferLegacyModality({ ...goalConfig, name: title });
    const modality = explicitModality || inferred!.modality;
    const target = goalConfig.target || inferred?.target || (modality === "abstinence" || modality === "frequency"
      ? { rule: "zero" as const }
      : modality === "daily_habit" ? { rule: "at_least" as const, minimum: 1 } : { rule: "before_time" as const, cutoff: "22:00" });
    const created = createCanonicalTracker({
      name: title,
      category: (goalConfig.category || "Personal Goal") as TrackerCategory,
      modality,
      target,
      startDate: goalConfig.startDate,
      rationale: goalConfig.rationale,
    }, canonicalTrackers);
    if (!created.success || !created.data) return { success: false, error: created.error };
    setCanonicalTrackers((prev) => [...prev, created.data!]);
    return { success: true, data: created.data };
  }, [canonicalTrackers]);

  const updateGoal = useCallback((oldName: string, newConfig: Partial<GoalConfig>): ActionResult => {
    const trimmedNew = (newConfig?.name || newConfig?.title || oldName).trim();
    if (!trimmedNew) return { success: false, error: "Goal title cannot be empty" };

    if (trimmedNew.toLowerCase() === "general") {
      return { success: false, error: "'General' is reserved for journal reflections" };
    }

    let isDuplicate = false;
    setCanonicalTrackers((prev) => {
      const collision = prev.find(
        (t) =>
          t.name.toLowerCase() === trimmedNew.toLowerCase() &&
          t.name.toLowerCase() !== oldName.toLowerCase()
      );
      if (collision) {
        isDuplicate = true;
        return prev;
      }

      return prev.map((t) => {
        if (t.name.toLowerCase() === oldName.toLowerCase()) {
          const updatedCategory = (newConfig.category || t.category) as TrackerCategory;
          let updatedModality = t.modality;
          let updatedTarget = t.target;

          if (newConfig.modality && newConfig.modality !== t.modality) {
            const inferred = inferLegacyModality({
              ...newConfig,
              name: trimmedNew,
              category: updatedCategory,
            });
            updatedModality = inferred.modality;
            updatedTarget = inferred.target;
          }

          return {
            ...t,
            name: trimmedNew,
            category: updatedCategory,
            modality: updatedModality,
            target: updatedTarget,
            startDate: newConfig.startDate || t.startDate,
          };
        }
        return t;
      });
    });

    if (isDuplicate) {
      return { success: false, error: `A goal named "${trimmedNew}" already exists.` };
    }
    return { success: true };
  }, []);

  const deleteGoal = useCallback((goalToDelete: string) => {
    if (!goalToDelete) return;
    setCanonicalTrackers((prev) =>
      prev.filter((t) => t.name.toLowerCase() !== goalToDelete.toLowerCase())
    );
  }, []);

  const saveNote = useCallback((habitName: string, dateStr: string, text: string) => {
    const trimmed = (text || "").trim();
    if (!dateStr) return;

    if (!habitName || habitName.toLowerCase() === "general") {
      setGeneralNotes((prev) => {
        const next = { ...prev };
        if (trimmed) {
          next[dateStr] = trimmed;
        } else {
          delete next[dateStr];
        }
        return next;
      });
      return;
    }

    setCanonicalTrackers((prev) => applySaveNote(prev, habitName, dateStr, text));
  }, []);

  const deleteNote = useCallback((habitName: string, dateStr: string) => {
    if (!dateStr) return;
    if (!habitName || habitName.toLowerCase() === "general") {
      setGeneralNotes((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
    } else {
      setCanonicalTrackers((prev) => applyDeleteNote(prev, habitName, dateStr));
    }
  }, []);

  const getNote = useCallback(
    (habitName: string, dateStr: string): string => {
      if (!habitName || habitName.toLowerCase() === "general") {
        return generalNotes[dateStr] || "";
      }
      const t = canonicalTrackers.find((tr) => tr.name.toLowerCase() === habitName.toLowerCase());
      return t?.records?.[dateStr]?.note || "";
    },
    [generalNotes, canonicalTrackers]
  );

  const getAllNotes = useCallback((): NoteEntry[] => {
    const entries: NoteEntry[] = [];

    // General reflections
    Object.entries(generalNotes || {}).forEach(([date, text]) => {
      if (text && text.trim()) {
        entries.push({
          id: `general-${date}`,
          habit: "General Reflection",
          isGeneral: true,
          date,
          text: text.trim(),
        });
      }
    });

    // Tracker-specific daily notes
    canonicalTrackers.forEach((t) => {
      Object.entries(t.records || {}).forEach(([date, rec]) => {
        if (rec.note && rec.note.trim()) {
          entries.push({
            id: `tracker-${t.id}-${date}`,
            habit: t.name,
            isGeneral: false,
            date,
            text: rec.note.trim(),
            trackerId: t.id,
          });
        }
      });
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [generalNotes, canonicalTrackers]);

  const logSpecializedCount = useCallback(
    (type: "sesh" | "weed" | "porn", dateStr: string, count: number | string) => {
      const numVal = Math.max(0, parseInt(String(count), 10) || 0);
      setCanonicalTrackers((prev) => applySpecializedCount(prev, type, dateStr, numVal));
    },
    []
  );

  // Export full JSON backup containing canonical trackers and backward-compatible projections
  const exportJSON = useCallback((): boolean => {
    const data: BackupPayload & { schemaVersion: number; canonicalTrackers: CanonicalTrackerRecord[] } = {
      app: "Recovery Tracker",
      version: "3.0",
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      userName: localStorage.getItem("userName") || "",
      theme: localStorage.getItem("theme") || "light",
      fontScale: localStorage.getItem("fontScale") || "standard",
      gentleTransitions: localStorage.getItem("gentleTransitions") === "true",
      discreetMode: localStorage.getItem("discreetMode") === "true",
      counterStartDate: localStorage.getItem(LEGACY_STORAGE_KEYS.COUNTER_START_DATE) || format(new Date(), "yyyy-MM-dd"),
      canonicalTrackers,
      trackers,
      addictions,
      generalNotes,
      seshData,
      weedData,
      pornData,
      pornNotes,
      emotionalWeather,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recovery-archive-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, [canonicalTrackers, trackers, addictions, generalNotes, seshData, weedData, pornData, pornNotes, emotionalWeather]);

  // Export RFC 4180 compliant CSV
  const exportCSV = useCallback((): boolean => {
    const csvContent = buildRecoveryCsv({
      trackers,
      generalNotes,
      emotionalWeather,
      seshData,
      weedData,
      pornData,
      pornNotes,
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recovery-data-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }, [trackers, generalNotes, emotionalWeather, seshData, weedData, pornData, pornNotes]);

  // Validate and import JSON backup safely using resolveBackupPayload
  const validateAndImportJSON = useCallback(
    (content: string): ActionResult<BackupPayload> => {
      try {
        if (typeof content !== "string" || !content.trim()) {
          return { success: false, error: "Empty or invalid file content." };
        }

        const parsed = JSON.parse(content);
        const resolved = resolveBackupPayload(parsed);

        if (!resolved.success) {
          const errMsg = resolved.issues.map((i) => i.message).join("; ");
          return { success: false, error: errMsg || "Failed to validate backup payload." };
        }

        // Persist and verify before changing in-memory state. Roll back the
        // canonical key if verification fails so a failed restore is non-destructive.
        const previousCanonical = localStorage.getItem(CANONICAL_STORAGE_KEY);
        const persistence = persistCanonicalEnvelope(localStorage, resolved.trackers);
        if (!persistence.success) {
          if (previousCanonical === null) localStorage.removeItem(CANONICAL_STORAGE_KEY);
          else localStorage.setItem(CANONICAL_STORAGE_KEY, previousCanonical);
          return { success: false, error: persistence.error || "Unable to persist restored backup." };
        }
        setCanonicalTrackers(resolved.trackers);

        const importedGeneralNotes = {
          ...(resolved.transferredJournalNotes || {}),
          ...(parsed.generalNotes && typeof parsed.generalNotes === "object" ? parsed.generalNotes : {}),
        } as GeneralNotesMap;
        setGeneralNotes(importedGeneralNotes);

        if (parsed.emotionalWeather && typeof parsed.emotionalWeather === "object") {
          setEmotionalWeather(parsed.emotionalWeather);
        }

        if (parsed.counterStartDate && typeof parsed.counterStartDate === "string") {
          setCounterStartDate(parsed.counterStartDate);
        }

        if (parsed.userName && typeof parsed.userName === "string") {
          localStorage.setItem("userName", parsed.userName);
        }

        return { success: true, data: parsed as BackupPayload };
      } catch (e: any) {
        return { success: false, error: `Failed to parse JSON file: ${e.message}` };
      }
    },
    []
  );

  const resetAllData = useCallback(() => {
    localStorage.removeItem(CANONICAL_STORAGE_KEY);

    const appKeys: string[] = [
      LEGACY_STORAGE_KEYS.ADDICTIONS,
      LEGACY_STORAGE_KEYS.TRACKERS,
      LEGACY_STORAGE_KEYS.GENERAL_NOTES,
      LEGACY_STORAGE_KEYS.SESH_DATA,
      LEGACY_STORAGE_KEYS.WEED_DATA,
      LEGACY_STORAGE_KEYS.PORN_DATA,
      LEGACY_STORAGE_KEYS.PORN_NOTES,
      LEGACY_STORAGE_KEYS.SELECTED_DATE,
      LEGACY_STORAGE_KEYS.COUNTER_START_DATE,
      LEGACY_STORAGE_KEYS.HAS_SESH,
      LEGACY_STORAGE_KEYS.HAS_WEED,
      LEGACY_STORAGE_KEYS.HAS_PORN,
      "userName",
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("mood_") || key.startsWith("moodNote_") || key.startsWith("checkedIn_"))) {
        appKeys.push(key);
      }
    }

    appKeys.forEach((k) => localStorage.removeItem(k));

    setCanonicalTrackers([]);
    setGeneralNotes({});
    setEmotionalWeather({});
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setCounterStartDate(format(new Date(), "yyyy-MM-dd"));
  }, []);

  return (
    <RecoveryContext.Provider
      value={{
        canonicalTrackers,
        setTrackerDayRecord,
        logTrackerDayStatus,
        saveTrackerGeneralNote,
        saveTrackerDayNote,
        deleteTrackerDayNote,
        migrationError,
        trackers,
        addictions,
        generalNotes,
        seshData,
        weedData,
        pornData,
        pornNotes,
        emotionalWeather,
        selectedDate,
        setSelectedDate,
        counterStartDate,
        setCounterStartDate,
        toggleCheckIn,
        setCheckIn,
        completeDailyCheckin,
        savePornNotes,
        addGoal,
        updateGoal,
        deleteGoal,
        saveNote,
        deleteNote,
        getNote,
        getAllNotes,
        logSpecializedCount,
        calculateStreak: calculateConsecutiveStreak,
        calculateLongestStreak: calculateLongestConsecutiveStreak,
        calculateSpecializedStreak: calculateSpecializedZeroStreak,
        exportJSON,
        exportCSV,
        validateAndImportJSON,
        resetAllData,
      }}
    >
      {children}
    </RecoveryContext.Provider>
  );
};

export const useRecovery = (): RecoveryContextType => {
  const context = useContext(RecoveryContext);
  if (!context) {
    throw new Error("useRecovery must be used within a RecoveryProvider");
  }
  return context;
};
