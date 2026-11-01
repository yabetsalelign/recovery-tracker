import type {
  CanonicalTrackerRecord,
  DayRecord,
  TrackerTarget,
  TrackingModality,
  TrackerCategory,
} from "../types/tracker";
import {
  isValidDateFormat,
  isValidTimeFormat,
  isFiniteNonNegativeNumber,
  createDeterministicTrackerId,
} from "./unifiedCalculations.js";

export interface MigrationIssue {
  severity: "warning" | "error";
  source: string;
  message: string;
  date?: string;
}

export interface MigrationSummary {
  totalSourceTrackers: number;
  migratedTrackers: number;
  totalRecordsMigrated: number;
  noteOnlyRecordsMigrated: number;
  warningsCount: number;
  errorsCount: number;
}

export interface MigrationResult {
  success: boolean;
  trackers: CanonicalTrackerRecord[];
  issues: MigrationIssue[];
  summary: MigrationSummary;
  transferredJournalNotes?: Record<string, string>;
}

export interface LegacyDataInput {
  trackers?: any[];
  addictions?: string[];
  seshData?: Record<string, unknown>;
  weedData?: Record<string, unknown>;
  pornData?: Record<string, unknown>;
  pornNotes?: string;
  generalNotes?: Record<string, string>;
  hasSesh?: boolean | string;
  hasWeed?: boolean | string;
  hasPorn?: boolean | string;
  version?: string;
  schemaVersion?: number;
  [key: string]: unknown;
}

/**
 * Infers Canonical Schema v3 tracking modality and target from legacy tracker configuration.
 * Adheres strictly to the conservative migration policy:
 * - Does not silently assume arbitrary habits are abstinence trackers.
 * - Emits structured warnings when modality is missing or inferred from category.
 */
export function inferLegacyModality(legacyTracker: any): {
  modality: TrackingModality;
  target: TrackerTarget;
  warning?: string;
  isInferred: boolean;
  originalModality?: string;
  originalCategory?: string;
} {
  const name = typeof legacyTracker?.name === "string" ? legacyTracker.name.trim() : "Unknown";
  const rawModality =
    typeof legacyTracker?.modality === "string" ? legacyTracker.modality.trim().toLowerCase() : "";
  const rawCategory =
    typeof legacyTracker?.category === "string" ? legacyTracker.category.trim() : "";
  const originalModality =
    legacyTracker?.modality !== undefined && legacyTracker?.modality !== null
      ? String(legacyTracker.modality)
      : undefined;
  const originalCategory =
    legacyTracker?.category !== undefined && legacyTracker?.category !== null
      ? String(legacyTracker.category)
      : undefined;

  // 1. Explicit legacy modalities
  if (rawModality === "abstinence") {
    return {
      modality: "abstinence",
      target: { rule: "zero" },
      isInferred: false,
      originalModality,
      originalCategory,
    };
  }

  if (rawModality === "harm_reduction" || rawModality === "moderation") {
    const limit = isFiniteNonNegativeNumber(legacyTracker?.limitVal)
      ? legacyTracker.limitVal
      : 1;
    return {
      modality: "frequency",
      target: { rule: "at_most", limit },
      isInferred: false,
      originalModality,
      originalCategory,
    };
  }

  if (rawModality === "time_restriction" || rawModality === "boundary") {
    const cutoff = isValidTimeFormat(legacyTracker?.curfewTime)
      ? legacyTracker.curfewTime
      : "22:30";
    return {
      modality: "boundary",
      target: { rule: "before_time", cutoff },
      isInferred: false,
      originalModality,
      originalCategory,
    };
  }

  if (rawModality === "daily_habit" || rawModality === "habit") {
    return {
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      isInferred: false,
      originalModality,
      originalCategory,
    };
  }

  if (rawModality === "specialized") {
    const lowerName = name.toLowerCase();
    if (lowerName === "sesh" || lowerName === "weed" || lowerName === "porn") {
      return {
        modality: "frequency",
        target: { rule: "zero" },
        isInferred: false,
        originalModality,
        originalCategory,
      };
    }
  }

  // 2. Missing, empty, or unknown legacy modality: conservative inference by category
  if (rawCategory === "Substance Sobriety") {
    return {
      modality: "abstinence",
      target: { rule: "zero" },
      warning: `Tracker "${name}" had missing or unrecognized modality "${rawModality || "(none)"}"; inferred "abstinence" based on "Substance Sobriety" category.`,
      isInferred: true,
      originalModality,
      originalCategory,
    };
  }

  if (
    rawCategory === "Personal Goal" ||
    rawCategory === "Physical Health" ||
    rawCategory === "Emotional & Mental" ||
    rawCategory === "Digital & Behavioral"
  ) {
    return {
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      warning: `Tracker "${name}" had missing or unrecognized modality "${rawModality || "(none)"}"; inferred "daily_habit" based on "${rawCategory}" category.`,
      isInferred: true,
      originalModality,
      originalCategory,
    };
  }

  // 3. Fallback when both modality and category are missing/unrecognized
  return {
    modality: "daily_habit",
    target: { rule: "at_least", minimum: 1 },
    warning: `Tracker "${name}" had missing modality and category; defaulted conservatively to "daily_habit" to avoid assuming abstinence.`,
    isInferred: true,
    originalModality,
    originalCategory,
  };
}

/**
 * Deterministically generates or preserves a unique tracker ID.
 * Preserves legacy IDs whenever present and valid.
 * Resolves ID collisions deterministically without randomness.
 */
function resolveUniqueTrackerId(
  tracker: any,
  allocatedIds: Set<string>,
  issues: MigrationIssue[]
): string {
  const name = typeof tracker?.name === "string" ? tracker.name : "tracker";
  const category = typeof tracker?.category === "string" ? tracker.category : "Personal Goal";
  const startDate = typeof tracker?.startDate === "string" ? tracker.startDate : "1970-01-01";

  // Check if tracker has a valid legacy ID
  const rawId = tracker?.id !== undefined && tracker?.id !== null ? String(tracker.id).trim() : "";

  if (rawId) {
    if (!allocatedIds.has(rawId)) {
      allocatedIds.add(rawId);
      return rawId;
    }

    // Legacy ID collision: disambiguate deterministically
    let counter = 2;
    let candidate = `${rawId}-col-${counter}`;
    while (allocatedIds.has(candidate)) {
      counter++;
      candidate = `${rawId}-col-${counter}`;
    }
    allocatedIds.add(candidate);
    issues.push({
      severity: "warning",
      source: name,
      message: `Tracker "${name}" had duplicate legacy ID "${rawId}"; disambiguated to "${candidate}".`,
    });
    return candidate;
  }

  // Generate deterministic ID using FNV-1a hash
  const baseId = createDeterministicTrackerId(name, category, startDate);
  if (!allocatedIds.has(baseId)) {
    allocatedIds.add(baseId);
    return baseId;
  }

  // Hash collision: disambiguate deterministically
  let disambiguator = 2;
  let candidate = `${baseId}-${disambiguator}`;
  while (allocatedIds.has(candidate)) {
    disambiguator++;
    candidate = `${baseId}-${disambiguator}`;
  }
  allocatedIds.add(candidate);
  issues.push({
    severity: "warning",
    source: name,
    message: `Tracker "${name}" generated identical deterministic ID "${baseId}"; disambiguated to "${candidate}".`,
  });
  return candidate;
}

/**
 * Validates a single canonical tracker record.
 */
export function validateCanonicalTracker(tracker: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!tracker || typeof tracker !== "object" || Array.isArray(tracker)) {
    return { valid: false, errors: ["Tracker must be a non-null object"] };
  }

  const t = tracker as Record<string, unknown>;

  if (typeof t.id !== "string" || !t.id.trim()) {
    errors.push("Tracker 'id' must be a non-empty string");
  }

  if (typeof t.name !== "string" || !t.name.trim()) {
    errors.push("Tracker 'name' must be a non-empty string");
  }

  if (typeof t.category !== "string" || !t.category.trim()) {
    errors.push("Tracker 'category' must be a non-empty string");
  }

  const validModalities = ["abstinence", "frequency", "daily_habit", "boundary"];
  if (typeof t.modality !== "string" || !validModalities.includes(t.modality)) {
    errors.push(`Tracker 'modality' must be one of: ${validModalities.join(", ")}`);
  }

  if (!t.target || typeof t.target !== "object" || Array.isArray(t.target)) {
    errors.push("Tracker 'target' must be a valid object");
  }

  if (typeof t.startDate !== "string" || !isValidDateFormat(t.startDate)) {
    errors.push(`Tracker 'startDate' must be a valid YYYY-MM-DD date string, got: "${String(t.startDate)}"`);
  }

  if (!t.records || typeof t.records !== "object" || Array.isArray(t.records)) {
    errors.push("Tracker 'records' must be an object map");
  } else {
    for (const [date, rec] of Object.entries(t.records as Record<string, unknown>)) {
      if (!isValidDateFormat(date)) {
        errors.push(`Record date "${date}" is not a valid YYYY-MM-DD date`);
      }
      if (!rec || typeof rec !== "object" || Array.isArray(rec)) {
        errors.push(`Record for date "${date}" must be an object`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Pure migration adapter that converts legacy Recovery Tracker structures into Canonical Schema v3.
 *
 * Rules:
 * - Immutability: The input object is never mutated.
 * - Idempotency: The same input always produces identical output.
 * - Check-ins: `checkIns[date] === true` maps to appropriate canonical status; `false` is unlogged.
 * - Note-only dates: Preserved with `note` and no status; does not invent synthetic tracking events.
 * - Specialized trackers: Exact numeric counts and explicit zeros are preserved.
 * - Name collisions: General and specialized trackers with incompatible data are preserved as separate trackers.
 */
export function migrateLegacyData(rawInput: LegacyDataInput | null | undefined): MigrationResult {
  const issues: MigrationIssue[] = [];
  const allocatedIds = new Set<string>();
  const outputTrackers: CanonicalTrackerRecord[] = [];

  let totalRecordsMigrated = 0;
  let noteOnlyRecordsMigrated = 0;

  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return {
      success: false,
      trackers: [],
      issues: [{ severity: "error", source: "root", message: "Input must be a valid object" }],
      summary: {
        totalSourceTrackers: 0,
        migratedTrackers: 0,
        totalRecordsMigrated: 0,
        noteOnlyRecordsMigrated: 0,
        warningsCount: 0,
        errorsCount: 1,
      },
    };
  }

  // Clone or safely extract trackers array without mutating input
  const sourceTrackers: any[] = Array.isArray(rawInput.trackers) ? rawInput.trackers : [];

  // Filter out or disambiguate any legacy "General" tracker
  const transferredJournalNotes: Record<string, string> = {};
  const generalTrackers: any[] = [];

  for (const t of sourceTrackers) {
    if (!t || typeof t !== "object") {
      issues.push({
        severity: "error",
        source: "trackers",
        message: "Found null or non-object entry in trackers array; skipped.",
      });
      continue;
    }
    if (typeof t.name !== "string" || !t.name.trim()) {
      issues.push({
        severity: "error",
        source: "trackers",
        message: "Found tracker with missing or empty name; skipped.",
      });
      continue;
    }

    const trimmedName = t.name.trim();
    if (trimmedName.toLowerCase() === "general") {
      const hasActiveCheckIns =
        t.checkIns &&
        typeof t.checkIns === "object" &&
        Object.values(t.checkIns).some((v) => v === true);

      if (hasActiveCheckIns) {
        // Has active check-ins: preserve as an active tracker with disambiguated name
        issues.push({
          severity: "warning",
          source: "General",
          message: 'Legacy tracker named "General" had active check-ins; preserved as "General (Tracker)" to prevent collision with journal reflections.',
        });
        generalTrackers.push({
          ...t,
          name: "General (Tracker)",
        });
      } else {
        // Old journal pseudo-tracker: transfer its notes into general reflections
        if (t.notes && typeof t.notes === "object") {
          for (const [date, noteText] of Object.entries(t.notes)) {
            if (typeof noteText === "string" && noteText.trim()) {
              transferredJournalNotes[date] = noteText.trim();
            }
          }
        }
        issues.push({
          severity: "warning",
          source: "General",
          message: 'Legacy tracker named "General" was identified as the old journal pseudo-tracker; transferred its notes into general journal reflections.',
        });
      }
      continue;
    }

    generalTrackers.push(t);
  }

  // Specialized tracker data maps
  const specializedSources = [
    {
      name: "Sesh",
      key: "seshData" as const,
      data: rawInput.seshData,
      hasFlag: rawInput.hasSesh,
      category: "Substance Sobriety" as TrackerCategory,
      defaultId: "sesh",
    },
    {
      name: "Weed",
      key: "weedData" as const,
      data: rawInput.weedData,
      hasFlag: rawInput.hasWeed,
      category: "Substance Sobriety" as TrackerCategory,
      defaultId: "weed",
    },
    {
      name: "Porn",
      key: "pornData" as const,
      data: rawInput.pornData,
      hasFlag: rawInput.hasPorn,
      category: "Digital & Behavioral" as TrackerCategory,
      defaultId: "porn",
      generalNote: typeof rawInput.pornNotes === "string" ? rawInput.pornNotes.trim() : undefined,
    },
  ];

  // Process general trackers
  for (const legacyTracker of generalTrackers) {
    const trackerName = legacyTracker.name.trim();
    const lowerName = trackerName.toLowerCase();

    // Check if there is a specialized dataset matching this name
    const specializedMatch = specializedSources.find((s) => s.name.toLowerCase() === lowerName);
    const hasSpecializedData =
      specializedMatch &&
      specializedMatch.data &&
      typeof specializedMatch.data === "object" &&
      Object.keys(specializedMatch.data).length > 0;

    const rawCheckIns =
      legacyTracker.checkIns && typeof legacyTracker.checkIns === "object"
        ? legacyTracker.checkIns
        : {};
    const rawNotes =
      legacyTracker.notes && typeof legacyTracker.notes === "object" ? legacyTracker.notes : {};

    const hasBooleanCheckIns = Object.values(rawCheckIns).some((v) => v === true);

    // Reconcile or split:
    // If matching specialized tracker has numeric data AND general tracker has boolean check-ins
    // with incompatible modality (e.g. abstinence check-ins vs frequency numeric counts):
    // Preserves BOTH as separate entities to prevent data loss or silent semantic corruption.
    const isIncompatibleSpecializedCollision =
      hasSpecializedData &&
      hasBooleanCheckIns &&
      legacyTracker.modality !== "frequency" &&
      legacyTracker.modality !== "specialized";

    if (isIncompatibleSpecializedCollision) {
      issues.push({
        severity: "warning",
        source: trackerName,
        message: `Found both general tracker "${trackerName}" with boolean check-ins and specialized numeric data; preserved both as separate trackers.`,
      });
    }

    const { modality, target, warning, isInferred, originalModality, originalCategory } =
      inferLegacyModality(legacyTracker);
    if (warning) {
      issues.push({
        severity: "warning",
        source: trackerName,
        message: warning,
      });
    }

    const legacyMetadata = isInferred
      ? {
          ...(originalModality !== undefined ? { originalModality } : {}),
          ...(originalCategory !== undefined ? { originalCategory } : {}),
          isInferredModality: true,
          requiresReview: true,
        }
      : undefined;

    const trackerId = resolveUniqueTrackerId(legacyTracker, allocatedIds, issues);

    // Determine startDate: explicit startDate, or earliest record date, or fallback
    let startDate =
      typeof legacyTracker.startDate === "string" && isValidDateFormat(legacyTracker.startDate)
        ? legacyTracker.startDate
        : "";

    const allDates = new Set([
      ...Object.keys(rawCheckIns),
      ...Object.keys(rawNotes),
    ]);

    const validDates = Array.from(allDates)
      .filter(isValidDateFormat)
      .sort();

    if (!startDate) {
      if (validDates.length > 0) {
        startDate = validDates[0];
        issues.push({
          severity: "warning",
          source: trackerName,
          message: `Tracker "${trackerName}" lacked startDate; inferred "${startDate}" from earliest record.`,
        });
      } else {
        startDate = "1970-01-01";
        issues.push({
          severity: "warning",
          source: trackerName,
          message: `Tracker "${trackerName}" lacked startDate and records; defaulted to "${startDate}".`,
        });
      }
    }

    const records: Record<string, DayRecord> = {};

    // Map records for general tracker
    for (const d of allDates) {
      if (!isValidDateFormat(d)) {
        issues.push({
          severity: "error",
          source: trackerName,
          date: d,
          message: `Invalid date key "${d}" in tracker "${trackerName}"; skipped.`,
        });
        continue;
      }

      const checkInVal = rawCheckIns[d];
      const noteVal = typeof rawNotes[d] === "string" ? rawNotes[d].trim() : undefined;

      // checkIns[d] === true maps according to modality
      // checkIns[d] === false is strictly unlogged (NOT a lapse)
      let status: DayRecord["status"] = undefined;
      let rawLegacyCheckIn = false;

      if (checkInVal === true) {
        if (modality === "abstinence") {
          status = "confirmed_clean";
        } else if (modality === "daily_habit") {
          status = "completed";
        } else if (modality === "boundary") {
          status = "adhered";
        } else if (modality === "frequency") {
          // A boolean check-in cannot become an invented numeric count!
          rawLegacyCheckIn = true;
          issues.push({
            severity: "warning",
            source: trackerName,
            date: d,
            message: `Boolean check-in on "${d}" for frequency tracker "${trackerName}" cannot be converted to a numeric count; preserved as rawLegacyCheckIn.`,
          });
        }
      }

      if (status !== undefined || noteVal !== undefined || rawLegacyCheckIn) {
        records[d] = {
          ...(status !== undefined ? { status } : {}),
          ...(noteVal !== undefined ? { note: noteVal } : {}),
          ...(rawLegacyCheckIn ? { rawLegacyCheckIn: true } : {}),
        };

        totalRecordsMigrated++;
        if (status === undefined && noteVal !== undefined && !rawLegacyCheckIn) {
          noteOnlyRecordsMigrated++;
        }
      }
    }

    outputTrackers.push({
      id: trackerId,
      name: trackerName,
      category: (legacyTracker.category || "Personal Goal") as TrackerCategory,
      modality,
      target,
      records,
      startDate,
      ...(legacyMetadata ? { legacyMetadata } : {}),
    });
  }

  // Process specialized trackers
  for (const spec of specializedSources) {
    const rawData = spec.data && typeof spec.data === "object" ? spec.data : null;
    const hasData = rawData && Object.keys(rawData).length > 0;
    const isExplicitlyEnabled =
      spec.hasFlag === true ||
      spec.hasFlag === "true" ||
      (Array.isArray(rawInput.addictions) &&
        rawInput.addictions.some((a) => typeof a === "string" && a.toLowerCase() === spec.name.toLowerCase()));

    // Check if general trackers already absorbed this specialized tracker cleanly
    const existing = outputTrackers.find((t) => t.name.toLowerCase() === spec.name.toLowerCase());

    if (existing && existing.modality === "frequency") {
      // Reconcile: merge specialized numeric entries into existing frequency tracker
      if (hasData) {
        for (const [dateStr, val] of Object.entries(rawData as Record<string, unknown>)) {
          if (!isValidDateFormat(dateStr)) {
            issues.push({
              severity: "error",
              source: spec.key,
              date: dateStr,
              message: `Invalid date key "${dateStr}" in ${spec.key}; skipped.`,
            });
            continue;
          }

          if (!isFiniteNonNegativeNumber(val)) {
            issues.push({
              severity: "error",
              source: spec.key,
              date: dateStr,
              message: `Invalid non-numeric or negative count "${String(val)}" on "${dateStr}" in ${spec.key}; skipped.`,
            });
            continue;
          }

          const existingRec = existing.records[dateStr];
          existing.records[dateStr] = {
            ...existingRec,
            status: "recorded",
            value: val,
          };
          totalRecordsMigrated++;
        }

        // Adjust startDate if earliest specialized entry precedes existing startDate
        const specDates = Object.keys(rawData as Record<string, unknown>).filter(isValidDateFormat).sort();
        if (specDates.length > 0 && specDates[0] < existing.startDate) {
          existing.startDate = specDates[0];
        }
      }

      if (spec.generalNote && !existing.generalNote) {
        existing.generalNote = spec.generalNote;
      }

      continue;
    }

    // If not reconciled (either no matching general tracker or separate due to incompatibility)
    if (hasData || isExplicitlyEnabled) {
      const records: Record<string, DayRecord> = {};
      const dates = rawData ? Object.keys(rawData).filter(isValidDateFormat).sort() : [];
      const startDate = dates.length > 0 ? dates[0] : "1970-01-01";

      if (rawData) {
        for (const [dateStr, val] of Object.entries(rawData as Record<string, unknown>)) {
          if (!isValidDateFormat(dateStr)) {
            issues.push({
              severity: "error",
              source: spec.key,
              date: dateStr,
              message: `Invalid date key "${dateStr}" in ${spec.key}; skipped.`,
            });
            continue;
          }

          if (!isFiniteNonNegativeNumber(val)) {
            issues.push({
              severity: "error",
              source: spec.key,
              date: dateStr,
              message: `Invalid non-numeric or negative count "${String(val)}" on "${dateStr}" in ${spec.key}; skipped.`,
            });
            continue;
          }

          records[dateStr] = {
            status: "recorded",
            value: val,
          };
          totalRecordsMigrated++;
        }
      }

      const trackerId = resolveUniqueTrackerId({ id: spec.defaultId, name: spec.name }, allocatedIds, issues);

      outputTrackers.push({
        id: trackerId,
        name: spec.name,
        category: spec.category,
        modality: "frequency",
        target: { rule: "zero" },
        records,
        startDate,
        ...(spec.generalNote ? { generalNote: spec.generalNote } : {}),
      });
    }
  }

  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const errorsCount = issues.filter((i) => i.severity === "error").length;

  return {
    success: true,
    trackers: outputTrackers,
    issues,
    summary: {
      totalSourceTrackers: sourceTrackers.length,
      migratedTrackers: outputTrackers.length,
      totalRecordsMigrated,
      noteOnlyRecordsMigrated,
      warningsCount,
      errorsCount,
    },
    transferredJournalNotes,
  };
}

/**
 * Resolves an imported backup payload.
 *
 * Rules:
 * - Canonical v3 backups (with schemaVersion: 3 or version: "3.0") are authoritative.
 * - An explicitly empty canonical array (trackers: []) is authoritative and will not resurrect deleted trackers.
 * - Malformed canonical backups return an error rather than silently falling back to stale legacy data.
 * - Legacy backups (v2 or unversioned) pass through the pure migration adapter.
 */
export function resolveBackupPayload(payload: unknown): MigrationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      success: false,
      trackers: [],
      issues: [{ severity: "error", source: "payload", message: "Payload must be a valid JSON object" }],
      summary: {
        totalSourceTrackers: 0,
        migratedTrackers: 0,
        totalRecordsMigrated: 0,
        noteOnlyRecordsMigrated: 0,
        warningsCount: 0,
        errorsCount: 1,
      },
    };
  }

  const p = payload as Record<string, unknown>;
  const isV3 = p.schemaVersion === 3 || p.version === "3.0";

  if (isV3) {
    if (!Array.isArray(p.trackers)) {
      return {
        success: false,
        trackers: [],
        issues: [
          {
            severity: "error",
            source: "trackers",
            message: "Malformed v3 backup: 'trackers' must be an array.",
          },
        ],
        summary: {
          totalSourceTrackers: 0,
          migratedTrackers: 0,
          totalRecordsMigrated: 0,
          noteOnlyRecordsMigrated: 0,
          warningsCount: 0,
          errorsCount: 1,
        },
      };
    }

    // Explicitly empty canonical v3 array is authoritative
    if (p.trackers.length === 0) {
      return {
        success: true,
        trackers: [],
        issues: [],
        summary: {
          totalSourceTrackers: 0,
          migratedTrackers: 0,
          totalRecordsMigrated: 0,
          noteOnlyRecordsMigrated: 0,
          warningsCount: 0,
          errorsCount: 0,
        },
      };
    }

    const issues: MigrationIssue[] = [];
    const validTrackers: CanonicalTrackerRecord[] = [];
    const allocatedIds = new Set<string>();

    for (let idx = 0; idx < p.trackers.length; idx++) {
      const t = p.trackers[idx];
      const validation = validateCanonicalTracker(t);

      if (!validation.valid) {
        return {
          success: false,
          trackers: [],
          issues: validation.errors.map((msg) => ({
            severity: "error",
            source: `trackers[${idx}]`,
            message: msg,
          })),
          summary: {
            totalSourceTrackers: p.trackers.length,
            migratedTrackers: 0,
            totalRecordsMigrated: 0,
            noteOnlyRecordsMigrated: 0,
            warningsCount: 0,
            errorsCount: validation.errors.length,
          },
        };
      }

      const tracker = t as CanonicalTrackerRecord;
      if (allocatedIds.has(tracker.id)) {
        return {
          success: false,
          trackers: [],
          issues: [
            {
              severity: "error",
              source: `trackers[${idx}]`,
              message: `Duplicate canonical tracker ID "${tracker.id}" detected in v3 backup.`,
            },
          ],
          summary: {
            totalSourceTrackers: p.trackers.length,
            migratedTrackers: 0,
            totalRecordsMigrated: 0,
            noteOnlyRecordsMigrated: 0,
            warningsCount: 0,
            errorsCount: 1,
          },
        };
      }
      allocatedIds.add(tracker.id);
      validTrackers.push(tracker);
    }

    return {
      success: true,
      trackers: validTrackers,
      issues,
      summary: {
        totalSourceTrackers: validTrackers.length,
        migratedTrackers: validTrackers.length,
        totalRecordsMigrated: validTrackers.reduce(
          (acc, tr) => acc + Object.keys(tr.records || {}).length,
          0
        ),
        noteOnlyRecordsMigrated: validTrackers.reduce(
          (acc, tr) =>
            acc +
            Object.values(tr.records || {}).filter((r) => r.status === undefined && r.note !== undefined)
              .length,
          0
        ),
        warningsCount: 0,
        errorsCount: 0,
      },
    };
  }

  // Not v3: migrate legacy payload
  return migrateLegacyData(p as LegacyDataInput);
}

/**
 * Deep validation function that compares legacy source inputs against migrated outputs.
 * Verifies tracker identity, start dates, notes, explicit zero counts, and non-zero counts.
 */
export function validateMigrationIntegrity(
  sourceInput: LegacyDataInput,
  result: MigrationResult
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!result.success) {
    errors.push("Migration result reported failure.");
    return { valid: false, errors };
  }

  const trackerMap = new Map<string, CanonicalTrackerRecord>();
  for (const t of result.trackers) {
    trackerMap.set(t.name.toLowerCase(), t);
  }

  // 1. Verify general trackers
  if (Array.isArray(sourceInput.trackers)) {
    for (const src of sourceInput.trackers) {
      if (!src || typeof src !== "object" || !src.name || src.name.trim().toLowerCase() === "general") {
        continue;
      }
      const lower = src.name.trim().toLowerCase();
      const migrated = trackerMap.get(lower);
      if (!migrated) {
        errors.push(`Tracker "${src.name}" from source was missing in migrated output.`);
        continue;
      }

      // Check notes
      if (src.notes && typeof src.notes === "object") {
        for (const [d, noteText] of Object.entries(src.notes as Record<string, string>)) {
          if (!isValidDateFormat(d) || !noteText || !noteText.trim()) continue;
          const rec = migrated.records[d];
          if (!rec || rec.note !== noteText.trim()) {
            errors.push(
              `Note on "${d}" for tracker "${src.name}" was not preserved correctly.`
            );
          }
        }
      }

      // Check check-ins
      if (src.checkIns && typeof src.checkIns === "object") {
        for (const [d, isChecked] of Object.entries(src.checkIns as Record<string, boolean>)) {
          if (!isValidDateFormat(d) || isChecked !== true) continue;
          const rec = migrated.records[d];
          if (!rec) {
            errors.push(`Check-in on "${d}" for tracker "${src.name}" was missing in migrated output.`);
          }
        }
      }
    }
  }

  // 2. Verify specialized trackers
  const specializedChecks = [
    { name: "Sesh", data: sourceInput.seshData },
    { name: "Weed", data: sourceInput.weedData },
    { name: "Porn", data: sourceInput.pornData },
  ];

  for (const spec of specializedChecks) {
    if (spec.data && typeof spec.data === "object") {
      const tracker = trackerMap.get(spec.name.toLowerCase());
      if (!tracker && Object.keys(spec.data).length > 0) {
        errors.push(`Specialized tracker "${spec.name}" was not created in migrated output.`);
        continue;
      }

      if (tracker) {
        for (const [d, count] of Object.entries(spec.data as Record<string, unknown>)) {
          if (!isValidDateFormat(d) || !isFiniteNonNegativeNumber(count)) continue;
          const rec = tracker.records[d];
          if (!rec || rec.status !== "recorded" || rec.value !== count) {
            errors.push(
              `Specialized entry on "${d}" for "${spec.name}" (value: ${count}) was not preserved.`
            );
          }
        }
      }
    }
  }

  // 3. Verify pornNotes
  if (sourceInput.pornNotes && typeof sourceInput.pornNotes === "string" && sourceInput.pornNotes.trim()) {
    const porn = trackerMap.get("porn");
    if (!porn || porn.generalNote !== sourceInput.pornNotes.trim()) {
      errors.push("Global pornNotes was not preserved in Porn generalNote.");
    }
  }

  // 4. Verify unique IDs
  const idSet = new Set<string>();
  for (const t of result.trackers) {
    if (idSet.has(t.id)) {
      errors.push(`Duplicate tracker ID "${t.id}" found in migrated output.`);
    }
    idSet.add(t.id);
  }

  return { valid: errors.length === 0, er