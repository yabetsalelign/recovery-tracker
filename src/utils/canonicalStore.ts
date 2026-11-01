import type {
  CanonicalStorageEnvelope,
  CanonicalTrackerRecord,
  DayRecord,
  TrackerCategory,
  TrackingModality,
} from "../types/tracker";
import type { TrackerRecord, SpecializedTrackerData } from "../types";
import {
  migrateLegacyData,
  resolveBackupPayload,
  validateCanonicalTracker,
  validateMigrationIntegrity,
} from "./unifiedMigration.js";
import type { LegacyDataInput } from "./unifiedMigration.js";
import { createDeterministicTrackerId } from "./unifiedCalculations.js";

export const CANONICAL_STORAGE_KEY = "recovery_v3_trackers";

export const LEGACY_STORAGE_KEYS = {
  ADDICTIONS: "addictions",
  TRACKERS: "trackers",
  GENERAL_NOTES: "generalNotes",
  SESH_DATA: "seshData",
  WEED_DATA: "weedData",
  PORN_DATA: "pornData",
  PORN_NOTES: "pornNotes",
  SELECTED_DATE: "selectedDate",
  COUNTER_START_DATE: "counterStartDate",
  HAS_SESH: "hasSesh",
  HAS_WEED: "hasWeed",
  HAS_PORN: "hasPorn",
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

/**
 * Loads and validates the canonical envelope from storage.
 */
export function loadCanonicalEnvelope(storage: StorageLike): {
  envelope: CanonicalStorageEnvelope | null;
  isCorrupt: boolean;
  error?: string;
} {
  try {
    const raw = storage.getItem(CANONICAL_STORAGE_KEY);
    if (!raw) {
      return { envelope: null, isCorrupt: false };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        envelope: null,
        isCorrupt: true,
        error: "Canonical storage root is not an object",
      };
    }

    if (parsed.schemaVersion !== 3 || !Array.isArray(parsed.trackers)) {
      return {
        envelope: null,
        isCorrupt: true,
        error: "Canonical storage missing schemaVersion 3 or trackers array",
      };
    }

    for (let i = 0; i < parsed.trackers.length; i++) {
      const val = validateCanonicalTracker(parsed.trackers[i]);
      if (!val.valid) {
        return {
          envelope: null,
          isCorrupt: true,
          error: `Corrupt canonical tracker at index ${i}: ${val.errors.join("; ")}`,
        };
      }
    }

    return { envelope: parsed as CanonicalStorageEnvelope, isCorrupt: false };
  } catch (e: any) {
    return {
      envelope: null,
      isCorrupt: true,
      error: `JSON parse error reading canonical storage: ${e?.message || String(e)}`,
    };
  }
}

/**
 * Atomically persists canonical trackers in the versioned envelope.
 * Reads back and validates the written data before declaring success.
 */
export function persistCanonicalEnvelope(
  storage: StorageLike,
  trackers: CanonicalTrackerRecord[]
): { success: boolean; error?: string } {
  try {
    const envelope: CanonicalStorageEnvelope = {
      schemaVersion: 3,
      trackers,
      migratedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(envelope);
    storage.setItem(CANONICAL_STORAGE_KEY, serialized);

    // Read back verification
    const readBack = storage.getItem(CANONICAL_STORAGE_KEY);
    if (!readBack || readBack !== serialized) {
      return {
        success: false,
        error: "Atomic write verification failed: read-back mismatch",
      };
    }

    return { success: true };
  } catch (e: any) {
    return {
      success: false,
      error: `Storage write failure: ${e?.message || String(e)}`,
    };
  }
}

/**
 * Initializes canonical data on application startup.
 *
 * Rules:
 * - If valid canonical envelope exists: loads directly from canonical store.
 * - If canonical storage is corrupt: reports recoverable error without overwriting or falling back.
 * - If canonical storage does not exist: reads legacy data, migrates in memory, validates integrity,
 *   persists canonical envelope in one operation, verifies read-back, and preserves legacy data.
 * - If quota or storage error occurs during migration: falls back to in-memory mode without corrupting legacy data.
 */
export function initializeCanonicalData(storage: StorageLike): {
  trackers: CanonicalTrackerRecord[];
  migrated: boolean;
  error?: string;
  transferredJournalNotes?: Record<string, string>;
} {
  const existing = loadCanonicalEnvelope(storage);

  if (existing.isCorrupt) {
    return {
      trackers: [],
      migrated: false,
      error: existing.error || "Corrupt canonical tracker storage detected.",
    };
  }

  if (existing.envelope) {
    return {
      trackers: existing.envelope.trackers,
      migrated: false,
    };
  }

  // No canonical envelope yet: inspect legacy storage
  let rawTrackers: unknown[] = [];
  try {
    const item = storage.getItem(LEGACY_STORAGE_KEYS.TRACKERS);
    if (item) rawTrackers = JSON.parse(item);
  } catch {}

  let rawAddictions: string[] = [];
  try {
    const item = storage.getItem(LEGACY_STORAGE_KEYS.ADDICTIONS);
    if (item) rawAddictions = JSON.parse(item);
  } catch {}

  let rawSesh: Record<string, unknown> = {};
  try {
    const item = storage.getItem(LEGACY_STORAGE_KEYS.SESH_DATA);
    if (item) rawSesh = JSON.parse(item);
  } catch {}

  let rawWeed: Record<string, unknown> = {};
  try {
    const item = storage.getItem(LEGACY_STORAGE_KEYS.WEED_DATA);
    if (item) rawWeed = JSON.parse(item);
  } catch {}

  let rawPorn: Record<string, unknown> = {};
  try {
    const item = storage.getItem(LEGACY_STORAGE_KEYS.PORN_DATA);
    if (item) rawPorn = JSON.parse(item);
  } catch {}

  const rawPornNotes = storage.getItem(LEGACY_STORAGE_KEYS.PORN_NOTES) || "";
  const hasSesh = storage.getItem(LEGACY_STORAGE_KEYS.HAS_SESH);
  const hasWeed = storage.getItem(LEGACY_STORAGE_KEYS.HAS_WEED);
  const hasPorn = storage.getItem(LEGACY_STORAGE_KEYS.HAS_PORN);

  const hasLegacyData =
    (Array.isArray(rawTrackers) && rawTrackers.length > 0) ||
    (Array.isArray(rawAddictions) && rawAddictions.length > 0) ||
    Object.keys(rawSesh).length > 0 ||
    Object.keys(rawWeed).length > 0 ||
    Object.keys(rawPorn).length > 0 ||
    Boolean(rawPornNotes) ||
    Boolean(hasSesh) ||
    Boolean(hasWeed) ||
    Boolean(hasPorn);

  if (!hasLegacyData) {
    // Brand new user: initialize empty canonical store
    persistCanonicalEnvelope(storage, []);
    return {
      trackers: [],
      migrated: false,
    };
  }

  // Migrate legacy data in memory
  const legacyPayload: LegacyDataInput = {
    trackers: rawTrackers,
    addictions: rawAddictions,
    seshData: rawSesh,
    weedData: rawWeed,
    pornData: rawPorn,
    pornNotes: rawPornNotes,
    hasSesh: hasSesh ?? undefined,
    hasWeed: hasWeed ?? undefined,
    hasPorn: hasPorn ?? undefined,
  };

  const migration = migrateLegacyData(legacyPayload);
  if (!migration.success) {
    return {
      trackers: [],
      migrated: false,
      error: "Legacy migration failed",
    };
  }

  const integrity = validateMigrationIntegrity(legacyPayload, migration);
  if (!integrity.valid) {
    return {
      trackers: [],
      migrated: false,
      error: `Migration integrity validation failed: ${integrity.errors.join("; ")}`,
    };
  }

  // Persist canonical envelope
  const persistResult = persistCanonicalEnvelope(storage, migration.trackers);
  if (!persistResult.success) {
    // Quota or write error: preserve in-memory without corrupting legacy data
    return {
      trackers: migration.trackers,
      migrated: true,
      error: `Migration succeeded in-memory, but persistence failed: ${persistResult.error}`,
      transferredJournalNotes: migration.transferredJournalNotes,
    };
  }

  return {
    trackers: migration.trackers,
    migrated: true,
    transferredJournalNotes: migration.transferredJournalNotes,
  };
}

/**
 * Derives a backward-compatible legacy TrackerRecord projection from a canonical tracker.
 */
export function toLegacyTrackerRecord(ct: CanonicalTrackerRecord): TrackerRecord {
  const checkIns: Record<string, boolean> = {};
  const notes: Record<string, string> = {};

  for (const [date, rec] of Object.entries(ct.records || {})) {
    if (
      rec.status === "confirmed_clean" ||
      rec.status === "completed" ||
      rec.status === "adhered" ||
      rec.rawLegacyCheckIn === true
    ) {
      checkIns[date] = true;
    }
    if (rec.note) {
      notes[date] = rec.note;
    }
  }

  return {
    id: ct.id,
    name: ct.name,
    category: ct.category,
    modality: ct.modality,
    limitVal: ct.target.rule === "at_most" ? ct.target.limit : undefined,
    curfewTime: ct.target.rule === "before_time" ? ct.target.cutoff : undefined,
    startDate: ct.startDate,
    checkIns,
    notes,
  };
}

/**
 * Derives specialized tracker data (e.g. Sesh, Weed, Porn) from canonical trackers.
 */
export function extractSpecializedData(
  trackers: CanonicalTrackerRecord[],
  trackerName: "Sesh" | "Weed" | "Porn"
): SpecializedTrackerData {
  const match = trackers.find((t) => t.name.toLowerCase() === trackerName.toLowerCase());
  if (!match) return {};

  const result: SpecializedTrackerData = {};
  for (const [date, rec] of Object.entries(match.records || {})) {
    if (rec.status === "recorded" && typeof rec.value === "number") {
      result[date] = rec.value;
    }
  }
  return result;
}

/**
 * Toggles a check-in on a canonical tracker immutably.
 */
export function applyToggleCheckIn(
  trackers: CanonicalTrackerRecord[],
  habitName: string,
  dateStr: string
): CanonicalTrackerRecord[] {
  const lower = habitName.toLowerCase();
  return trackers.map((t) => {
    if (t.name.toLowerCase() !== lower) return t;

    const currentRec = t.records[dateStr];
    const isChecked =
      currentRec &&
      (currentRec.status === "confirmed_clean" ||
        currentRec.status === "completed" ||
        currentRec.status === "adhered" ||
        currentRec.rawLegacyCheckIn === true);

    const newRecords = { ...t.records };

    if (isChecked) {
      // Toggle off: return to unlogged
      if (currentRec.note) {
        newRecords[dateStr] = { note: currentRec.note };
      } else {
        delete newRecords[dateStr];
      }
    } else {
      // Toggle on: set status according to modality
      let status: DayRecord["status"] = "completed";
      if (t.modality === "abstinence") {
        status = "confirmed_clean";
      } else if (t.modality === "boundary") {
        status = "adhered";
      } else if (t.modality === "daily_habit") {
        status = "completed";
      } else if (t.modality === "frequency") {
        if (t.target.rule === "zero") {
          status = "recorded";
        }
      }

      newRecords[dateStr] = {
        ...(currentRec ? currentRec : {}),
        status,
        ...(status === "recorded" ? { value: 0 } : {}),
        rawLegacyCheckIn: undefined,
      };
    }

    return { ...t, records: newRecords };
  });
}

/**
 * Sets explicit check-in status on a canonical tracker immutably.
 */
export function applySetCheckIn(
  trackers: CanonicalTrackerRecord[],
  habitName: string,
  dateStr: string,
  isChecked: boolean
): CanonicalTrackerRecord[] {
  const lower = habitName.toLowerCase();
  return trackers.map((t) => {
    if (t.name.toLowerCase() !== lower) return t;

    const currentRec = t.records[dateStr];
    const newRecords = { ...t.records };

    if (!isChecked) {
      if (currentRec?.note) {
        newRecords[dateStr] = { note: currentRec.note };
      } else {
        delete newRecords[dateStr];
      }
    } else {
      let status: DayRecord["status"] = "completed";
      if (t.modality === "abstinence") {
        status = "confirmed_clean";
      } else if (t.modality === "boundary") {
        status = "adhered";
      } else if (t.modality === "daily_habit") {
        status = "completed";
      } else if (t.modality === "frequency" && t.target.rule === "zero") {
        status = "recorded";
      }

      newRecords[dateStr] = {
        ...(currentRec ? currentRec : {}),
        status,
        ...(status === "recorded" ? { value: 0 } : {}),
        rawLegacyCheckIn: undefined,
      };
    }

    return { ...t, records: newRecords };
  });
}

/**
 * Logs a specialized frequency count on a canonical tracker immutably.
 * Creates the specialized tracker if it does not already exist.
 */
export function applySpecializedCount(
  trackers: CanonicalTrackerRecord[],
  type: "sesh" | "weed" | "porn",
  dateStr: string,
  count: number
): CanonicalTrackerRecord[] {
  const nameMap = { sesh: "Sesh", weed: "Weed", porn: "Porn" } as const;
  const targetName = nameMap[type];
  const lower = targetName.toLowerCase();

  const numVal = Math.max(0, parseInt(String(count), 10) || 0);

  const existingIdx = trackers.findIndex((t) => t.name.toLowerCase() === lower);
  if (existingIdx >= 0) {
    return trackers.map((t, idx) => {
      if (idx !== existingIdx) return t;
      const currentRec = t.records[dateStr];
      return {
        ...t,
        records: {
          ...t.records,
          [dateStr]: {
            ...currentRec,
            status: "recorded",
            value: numVal,
          },
        },
      };
    });
  }

  // Create specialized tracker if missing
  const newTracker: CanonicalTrackerRecord = {
    id: type,
    name: targetName,
    category: type === "porn" ? "Digital & Behavioral" : "Substance Sobriety",
    modality: "frequency",
    target: { rule: "zero" },
    startDate: dateStr,
    records: {
      [dateStr]: {
        status: "recorded",
        value: numVal,
      },
    },
  };

  return [...trackers, newTracker];
}

/**
 * Saves a date-keyed note on a canonical tracker immutably.
 */
export function applySaveNote(
  trackers: CanonicalTrackerRecord[],
  habitName: string,
  dateStr: string,
  text: string
): CanonicalTrackerRecord[] {
  const trimmed = (text || "").trim();
  const lower = habitName.toLowerCase();

  return trackers.map((t) => {
    if (t.name.toLowerCase() !== lower) return t;

    const currentRec = t.records[dateStr];
    const newRecords = { ...t.records };

    if (trimmed) {
      newRecords[dateStr] = {
        ...(currentRec ? currentRec : {}),
        note: trimmed,
      };
    } else {
      if (currentRec?.status !== undefined || currentRec?.rawLegacyCheckIn) {
        newRecords[dateStr] = { ...currentRec, note: undefined };
      } else {
        delete newRecords[dateStr];
      }
    }

    return { ...t, records: newRecords };
  });
}

/**
 * Deletes a date-keyed note from a canonical tracker immutably.
 */
export function applyDeleteNote(
  trackers: CanonicalTrackerRecord[],
  habitName: string,
  dateStr: string
): CanonicalTrackerRecord[] {
  const lower = habitName.toLowerCase();
  return trackers.map((t) => {
    if (t.name.toLowerCase() !== lower) return t;

    const currentRec = t.records[dateStr];
    if (!currentRec || currentRec.note === undefined) return t;

    const newRecords = { ...t.records };
    if (currentRec.status !== undefined || currentRec.rawLegacyCheckIn) {
      newRecords[dateStr] = { ...currentRec, note: undefined };
    } else {
      delete newRecords[dateStr];
    }

    return { ...t, records: newRecords };
  });
}

/** Replace or deliberately remove one dated record by canonical tracker ID. */
export function applyTrackerDayRecord(
  trackers: CanonicalTrackerRecord[],
  trackerId: string,
  dateStr: string,
  record: DayRecord | null
): CanonicalTrackerRecord[] {
  return trackers.map((tracker) => {
    if (tracker.id !== trackerId) return tracker;
    const records = { ...tracker.records };
    if (record) records[dateStr] = record;
    else delete records[dateStr];
    return { ...tracker, records };
  });
}

export function applyTrackerGeneralNote(
  trackers: CanonicalTrackerRecord[],
  trackerId: string,
  note: string
): CanonicalTrackerRecord[] {
  return trackers.map((tracker) => tracker.id === trackerId
    ? { ...tracker, generalNote: note.trim() }
    : tracker);
}
