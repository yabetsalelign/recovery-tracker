import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
import {
  calculateConsecutiveStreak,
  calculateLongestConsecutiveStreak,
  calculateSpecializedZeroStreak,
  escapeCsvValue,
  buildRecoveryCsv,
} from "../utils/recoveryCalculations";

export const RecoveryContext = createContext<RecoveryContextType | null>(null);

const STORAGE_KEYS = {
  ADDICTIONS: "addictions",
  TRACKERS: "trackers",
  GENERAL_NOTES: "generalNotes",
  SESH_DATA: "seshData",
  WEED_DATA: "weedData",
  PORN_DATA: "pornData",
  SELECTED_DATE: "selectedDate",
  COUNTER_START_DATE: "counterStartDate",
} as const;

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
  // Initialize state from existing localStorage records safely
  const [trackers, setTrackers] = useState<TrackerRecord[]>(() => {
    const loadedTrackers = safeParse<unknown>(STORAGE_KEYS.TRACKERS, []);
    const loadedAddictions = safeParse<unknown>(STORAGE_KEYS.ADDICTIONS, []);

    // Filter out corrupted records or accidental "General" habit from past regression
    const validTrackers: TrackerRecord[] = Array.isArray(loadedTrackers)
      ? (loadedTrackers.filter(
          (t) => t && typeof t === "object" && "name" in t && (t as TrackerRecord).name.toLowerCase() !== "general"
        ) as TrackerRecord[])
      : [];

    const validAddictions: string[] = Array.isArray(loadedAddictions)
      ? loadedAddictions.filter(
          (a): a is string => typeof a === "string" && a.toLowerCase() !== "general"
        )
      : [];

    // Reconcile trackers and addictions without destructive mutation
    const reconciled = [...validTrackers];
    validAddictions.forEach((name, idx) => {
      const exists = reconciled.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        reconciled.push({
          id: idx + 1,
          name,
          category: "Substance Sobriety",
          modality: "abstinence",
          checkIns: {},
          notes: {},
        });
      }
    });

    return reconciled;
  });

  const [addictions, setAddictions] = useState<string[]>(() => {
    return trackers.map((t) => t.name);
  });

  const [generalNotes, setGeneralNotes] = useState<GeneralNotesMap>(() => {
    // Check if general notes exist, or if old trackers had a "General" tracker
    const existing = safeParse<GeneralNotesMap>(STORAGE_KEYS.GENERAL_NOTES, {});
    const rawTrackers = safeParse<TrackerRecord[]>(STORAGE_KEYS.TRACKERS, []);
    const oldGeneralTracker = Array.isArray(rawTrackers)
      ? rawTrackers.find((t) => t && t.name && t.name.toLowerCase() === "general")
      : null;

    if (oldGeneralTracker && oldGeneralTracker.notes) {
      return { ...oldGeneralTracker.notes, ...existing };
    }
    return existing;
  });

  const [seshData, setSeshData] = useState<SpecializedTrackerData>(() =>
    safeParse<SpecializedTrackerData>(STORAGE_KEYS.SESH_DATA, {})
  );
  const [weedData, setWeedData] = useState<SpecializedTrackerData>(() =>
    safeParse<SpecializedTrackerData>(STORAGE_KEYS.WEED_DATA, {})
  );
  const [pornData, setPornData] = useState<SpecializedTrackerData>(() =>
    safeParse<SpecializedTrackerData>(STORAGE_KEYS.PORN_DATA, {})
  );
  const [pornNotes, setPornNotes] = useState<string>(() => {
    const savedNotes = localStorage.getItem("pornNotes");
    if (savedNotes !== null) return savedNotes;
    const legacyData = safeParse<Record<string, unknown>>(STORAGE_KEYS.PORN_DATA, {});
    return typeof legacyData.notes === "string" ? legacyData.notes : "";
  });
  const [emotionalWeather, setEmotionalWeather] = useState<EmotionalWeatherMap>(loadEmotionalWeather);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_DATE) || format(new Date(), "yyyy-MM-dd");
  });

  const [counterStartDate, setCounterStartDate] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.COUNTER_START_DATE) || format(new Date(), "yyyy-MM-dd");
  });

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    safeSet(STORAGE_KEYS.TRACKERS, trackers);
    const names = trackers.map((t) => t.name);
    setAddictions(names);
    safeSet(STORAGE_KEYS.ADDICTIONS, names);
  }, [trackers]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.GENERAL_NOTES, generalNotes);
  }, [generalNotes]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.SESH_DATA, seshData);
  }, [seshData]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.WEED_DATA, weedData);
  }, [weedData]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.PORN_DATA, pornData);
  }, [pornData]);

  useEffect(() => {
    try {
      localStorage.setItem("pornNotes", pornNotes);
    } catch (e) {
      console.error('Error saving localStorage key "pornNotes":', e);
    }
  }, [pornNotes]);

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
      localStorage.setItem(STORAGE_KEYS.SELECTED_DATE, selectedDate);
    } catch (e) {}
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COUNTER_START_DATE, counterStartDate);
    } catch (e) {}
  }, [counterStartDate]);

  // Toggle check-in for a habit on any date
  const toggleCheckIn = useCallback((habitName: string, dateStr: string) => {
    if (!habitName || !dateStr) return;
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.name.toLowerCase() === habitName.toLowerCase()) {
          const newCheckIns = { ...t.checkIns };
          newCheckIns[dateStr] = !newCheckIns[dateStr];
          return { ...t, checkIns: newCheckIns };
        }
        return t;
      })
    );
  }, []);

  // Set explicit check-in value for a habit on any date
  const setCheckIn = useCallback((habitName: string, dateStr: string, isChecked: boolean) => {
    if (!habitName || !dateStr) return;
    setTrackers((prev) =>
      prev.map((t) => {
        if (t.name.toLowerCase() === habitName.toLowerCase()) {
          return { ...t, checkIns: { ...t.checkIns, [dateStr]: Boolean(isChecked) } };
        }
        return t;
      })
    );
  }, []);

  // Complete overall today's check-in
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
    setPornNotes(text);
  }, []);

  // Add new recovery goal
  const addGoal = useCallback((goalConfig: GoalConfig): ActionResult => {
    const title = (goalConfig?.title || goalConfig?.name || "").trim();
    if (!title) return { success: false, error: "Goal title cannot be empty" };

    if (title.toLowerCase() === "general") {
      return { success: false, error: "'General' is reserved for journal reflections" };
    }

    let isDuplicate = false;
    setTrackers((prev) => {
      if (prev.some((t) => t.name.toLowerCase() === title.toLowerCase())) {
        isDuplicate = true;
        return prev;
      }

      const newTracker: TrackerRecord = {
        id: Date.now(),
        name: title,
        category: goalConfig.category || "Substance Sobriety",
        modality: goalConfig.modality || "abstinence",
        limitVal: goalConfig.limitVal || 1,
        curfewTime: goalConfig.curfewTime || "22:30",
        startDate: goalConfig.startDate || format(new Date(), "yyyy-MM-dd"),
        checkIns: {},
        notes: goalConfig.rationale?.trim()
          ? { [goalConfig.startDate || format(new Date(), "yyyy-MM-dd")]: goalConfig.rationale.trim() }
          : {},
      };

      // Handle specialized tracking flags
      const lower = title.toLowerCase();
      if (lower === "sesh") {
        localStorage.setItem("hasSesh", "true");
        if (!localStorage.getItem("seshData")) localStorage.setItem("seshData", "{}");
      }
      if (lower === "weed") {
        localStorage.setItem("hasWeed", "true");
        if (!localStorage.getItem("weedData")) localStorage.setItem("weedData", "{}");
      }
      if (lower === "porn") {
        localStorage.setItem("hasPorn", "true");
        if (!localStorage.getItem("pornData")) localStorage.setItem("pornData", "{}");
      }

      return [...prev, newTracker];
    });

    if (isDuplicate) {
      return { success: false, error: `A goal named "${title}" already exists.` };
    }
    return { success: true };
  }, []);

  // Update existing goal name and parameters
  const updateGoal = useCallback((oldName: string, newConfig: Partial<GoalConfig>): ActionResult => {
    const trimmedNew = (newConfig?.name || newConfig?.title || oldName).trim();
    if (!trimmedNew) return { success: false, error: "Goal title cannot be empty" };

    if (trimmedNew.toLowerCase() === "general") {
      return { success: false, error: "'General' is reserved for journal reflections" };
    }

    let isDuplicate = false;
    setTrackers((prev) => {
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
          return {
            ...t,
            name: trimmedNew,
            category: newConfig.category || t.category || "Substance Sobriety",
            modality: newConfig.modality || t.modality || "abstinence",
            limitVal: newConfig.limitVal !== undefined ? newConfig.limitVal : t.limitVal,
            curfewTime: newConfig.curfewTime || t.curfewTime,
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

  // Delete goal
  const deleteGoal = useCallback((goalToDelete: string) => {
    if (!goalToDelete) return;
    setTrackers((prev) => prev.filter((t) => t.name.toLowerCase() !== goalToDelete.toLowerCase()));

    const lower = goalToDelete.toLowerCase();
    if (lower === "sesh") localStorage.removeItem("hasSesh");
    if (lower === "weed") localStorage.removeItem("hasWeed");
    if (lower === "porn") localStorage.removeItem("hasPorn");
  }, []);

  // Save note for habit or general reflection
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

    setTrackers((prev) =>
      prev.map((t) => {
        if (t.name.toLowerCase() === habitName.toLowerCase()) {
          const newNotes = { ...t.notes };
          if (trimmed) {
            newNotes[dateStr] = trimmed;
          } else {
            delete newNotes[dateStr];
          }
          return { ...t, notes: newNotes };
        }
        return t;
      })
    );
  }, []);

  // Delete note
  const deleteNote = useCallback((habitName: string, dateStr: string) => {
    if (!dateStr) return;
    if (!habitName || habitName.toLowerCase() === "general") {
      setGeneralNotes((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
    } else {
      setTrackers((prev) =>
        prev.map((t) => {
          if (t.name.toLowerCase() === habitName.toLowerCase()) {
            const nextNotes = { ...t.notes };
            delete nextNotes[dateStr];
            return { ...t, notes: nextNotes };
          }
          return t;
        })
      );
    }
  }, []);

  // Get note for a specific goal and date
  const getNote = useCallback(
    (habitName: string, dateStr: string): string => {
      if (!habitName || habitName.toLowerCase() === "general") {
        return generalNotes[dateStr] || "";
      }
      const t = trackers.find((tr) => tr.name.toLowerCase() === habitName.toLowerCase());
      return t?.notes?.[dateStr] || "";
    },
    [generalNotes, trackers]
  );

  // Compile all notes across trackers and general reflections
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

    // Habit notes
    trackers.forEach((t) => {
      Object.entries(t.notes || {}).forEach(([date, text]) => {
        if (text && text.trim()) {
          entries.push({
            id: `${t.name}-${date}`,
            habit: t.name,
            isGeneral: false,
            date,
            text: text.trim(),
          });
        }
      });
    });

    // Sort chronologically descending
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [generalNotes, trackers]);

  // Specialized tracker count logging
  const logSpecializedCount = useCallback((type: "sesh" | "weed" | "porn", dateStr: string, count: number | string) => {
    const val = Math.max(0, parseInt(String(count), 10) || 0);
    if (type === "sesh") {
      setSeshData((prev) => ({ ...prev, [dateStr]: val }));
    } else if (type === "weed") {
      setWeedData((prev) => ({ ...prev, [dateStr]: val }));
    } else if (type === "porn") {
      setPornData((prev) => ({ ...prev, [dateStr]: val }));
    }
  }, []);

  // Export full JSON backup
  const exportJSON = useCallback((): boolean => {
    const data: BackupPayload = {
      app: "Recovery Tracker",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      userName: localStorage.getItem("userName") || "",
      theme: localStorage.getItem("theme") || "light",
      fontScale: localStorage.getItem("fontScale") || "standard",
      gentleTransitions: localStorage.getItem("gentleTransitions") === "true",
      discreetMode: localStorage.getItem("discreetMode") === "true",
      counterStartDate: localStorage.getItem("counterStartDate") || format(new Date(), "yyyy-MM-dd"),
      addictions: trackers.map((t) => t.name),
      trackers,
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
  }, [trackers, generalNotes, seshData, weedData, pornData, pornNotes, emotionalWeather]);

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

  // Validate and import JSON backup safely without partial overwrite
  const validateAndImportJSON = useCallback(
    (content: string): ActionResult<BackupPayload> => {
      try {
        if (typeof content !== "string" || !content.trim()) {
          return { success: false, error: "Empty or invalid file content." };
        }

        const parsed = JSON.parse(content) as BackupPayload;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return { success: false, error: "Root must be a valid JSON object." };
        }

        // Validate trackers if present
        if (parsed.trackers !== undefined) {
          if (!Array.isArray(parsed.trackers)) {
            return { success: false, error: "Invalid backup: 'trackers' must be an array." };
          }
          for (const t of parsed.trackers) {
            if (!t || typeof t !== "object" || typeof t.name !== "string" || !t.name.trim()) {
              return { success: false, error: "Invalid backup: Each tracker must have a valid name." };
            }
            if (t.checkIns !== undefined && (typeof t.checkIns !== "object" || Array.isArray(t.checkIns))) {
              return { success: false, error: `Invalid backup: Tracker "${t.name}" checkIns must be an object.` };
            }
          }
        }

        // Validate addictions if present
        if (parsed.addictions !== undefined) {
          if (!Array.isArray(parsed.addictions)) {
            return { success: false, error: "Invalid backup: 'addictions' must be an array." };
          }
        }

        // Validate specialized data if present
        const specializedKeys: (keyof BackupPayload)[] = ["seshData", "weedData", "pornData", "generalNotes", "emotionalWeather"];
        for (const k of specializedKeys) {
          const val = parsed[k];
          if (val !== undefined && (typeof val !== "object" || Array.isArray(val))) {
            return { success: false, error: `Invalid backup: '${k}' must be an object.` };
          }
        }
        if (parsed.emotionalWeather) {
          for (const [date, entry] of Object.entries(parsed.emotionalWeather)) {
            if (
              !entry ||
              typeof entry !== "object" ||
              typeof entry.mood !== "string" ||
              typeof entry.note !== "string" ||
              typeof entry.checkedIn !== "boolean"
            ) {
              return { success: false, error: `Invalid backup: emotional weather for "${date}" is malformed.` };
            }
          }
        }
        if (parsed.pornNotes !== undefined && typeof parsed.pornNotes !== "string") {
          return { success: false, error: "Invalid backup: 'pornNotes' must be a string." };
        }

        // All validations passed! Apply updates atomically
        const newTrackers = Array.isArray(parsed.trackers)
          ? parsed.trackers.filter((t) => t.name.toLowerCase() !== "general")
          : trackers;

        const newGeneralNotes =
          parsed.generalNotes && typeof parsed.generalNotes === "object"
            ? parsed.generalNotes
            : generalNotes;

        const newSesh =
          parsed.seshData && typeof parsed.seshData === "object" ? parsed.seshData : seshData;
        const newWeed =
          parsed.weedData && typeof parsed.weedData === "object" ? parsed.weedData : weedData;
        const newPorn =
          parsed.pornData && typeof parsed.pornData === "object" ? parsed.pornData : pornData;
        const newEmotionalWeather = parsed.emotionalWeather || emotionalWeather;

        setTrackers(newTrackers);
        setGeneralNotes(newGeneralNotes);
        setSeshData(newSesh);
        setWeedData(newWeed);
        setPornData(newPorn);
        setEmotionalWeather(newEmotionalWeather);
        if (parsed.pornNotes !== undefined) setPornNotes(parsed.pornNotes);

        if (parsed.counterStartDate && typeof parsed.counterStartDate === "string") {
          setCounterStartDate(parsed.counterStartDate);
        }

        if (parsed.userName && typeof parsed.userName === "string") {
          localStorage.setItem("userName", parsed.userName);
        }

        return { success: true, data: parsed };
      } catch (e: any) {
        return { success: false, error: `Failed to parse JSON file: ${e.message}` };
      }
    },
    [trackers, generalNotes, seshData, weedData, pornData, emotionalWeather]
  );

  // Reset all application data safely
  const resetAllData = useCallback(() => {
    // Only remove app-specific storage keys
    const appKeys: string[] = [
      STORAGE_KEYS.ADDICTIONS,
      STORAGE_KEYS.TRACKERS,
      STORAGE_KEYS.GENERAL_NOTES,
      STORAGE_KEYS.SESH_DATA,
      STORAGE_KEYS.WEED_DATA,
      STORAGE_KEYS.PORN_DATA,
      "pornNotes",
      STORAGE_KEYS.SELECTED_DATE,
      STORAGE_KEYS.COUNTER_START_DATE,
      "hasSesh",
      "hasWeed",
      "hasPorn",
      "userName",
    ];

    // Also remove mood keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("mood_") || key.startsWith("moodNote_") || key.startsWith("checkedIn_"))) {
        appKeys.push(key);
      }
    }

    appKeys.forEach((k) => localStorage.removeItem(k));

    // Reset React state
    setTrackers([]);
    setAddictions([]);
    setGeneralNotes({});
    setSeshData({});
    setWeedData({});
    setPornData({});
    setPornNotes("");
    setEmotionalWeather({});
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setCounterStartDate(format(new Date(), "yyyy-MM-dd"));
  }, []);

  return (
    <RecoveryContext.Provider
      value={{
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
