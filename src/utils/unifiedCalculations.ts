import { format, subDays, parseISO, differenceInCalendarDays, addDays } from "date-fns";
import type {
  CanonicalTrackerRecord,
  DayEvaluation,
  DayRecord,
  DayRecordStatus,
  TrackerMetrics,
  TrackerTarget,
  TrackingModality,
} from "../types/tracker";

/**
 * Validates a standard ISO 8601 YYYY-MM-DD date string.
 * Rejects invalid calendar days (e.g. Feb 30, month 13).
 */
export function isValidDateFormat(dateStr: string): boolean {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

/** Resolve a canonical route ID without relying on a display name. */
export function resolveTrackerById(
  trackers: CanonicalTrackerRecord[],
  id: string
): CanonicalTrackerRecord | undefined {
  return trackers.find((tracker) => tracker.id === id);
}

/**
 * Validates a 24-hour time string in HH:mm format (00:00 to 23:59).
 */
export function isValidTimeFormat(timeStr: string): boolean {
  return typeof timeStr === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

/**
 * Validates finite non-negative numbers (e.g. 0, 1.5, 42).
 * Rejects NaN, Infinity, negative numbers, and non-numeric types.
 */
export function isFiniteNonNegativeNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val) && val >= 0;
}

/**
 * Validates compatibility between a tracking modality and a configured target rule.
 */
export function validateTrackerTarget(
  modality: TrackingModality,
  target: TrackerTarget
): { valid: boolean; error?: string } {
  if (!target || typeof target !== "object") {
    return { valid: false, error: "Target must be a defined object" };
  }

  switch (modality) {
    case "abstinence":
      if (target.rule !== "zero") {
        return { valid: false, error: "Abstinence modality only supports 'zero' target rule" };
      }
      return { valid: true };

    case "frequency":
      if (target.rule === "zero") {
        return { valid: true };
      }
      if (target.rule === "at_most") {
        if (!isFiniteNonNegativeNumber(target.limit)) {
          return { valid: false, error: "'at_most' target requires a finite non-negative numeric limit" };
        }
        return { valid: true };
      }
      return { valid: false, error: "Frequency modality only supports 'zero' or 'at_most' target rules" };

    case "daily_habit":
      if (target.rule !== "at_least") {
        return { valid: false, error: "Daily habit modality only supports 'at_least' target rule" };
      }
      if (!isFiniteNonNegativeNumber(target.minimum) || target.minimum <= 0) {
        return { valid: false, error: "'at_least' target requires a finite positive minimum quantity" };
      }
      return { valid: true };

    case "boundary":
      if (target.rule !== "before_time") {
        return { valid: false, error: "Boundary modality only supports 'before_time' target rule" };
      }
      if (!isValidTimeFormat(target.cutoff)) {
        return { valid: false, error: "Boundary target requires a valid 'HH:mm' 24-hour cutoff time" };
      }
      return { valid: true };

    default:
      return { valid: false, error: `Unsupported tracking modality: ${String(modality)}` };
  }
}

/**
 * Validates that a day record's status matches the tracker modality.
 */
export function validateDayRecordStatus(
  modality: TrackingModality,
  status: DayRecordStatus
): boolean {
  switch (modality) {
    case "abstinence":
      return status === "confirmed_clean" || status === "lapsed";
    case "frequency":
      return status === "recorded";
    case "daily_habit":
      return status === "completed" || status === "skipped";
    case "boundary":
      return status === "adhered" || status === "breached";
    default:
      return false;
  }
}

/**
 * Resolves the effective target that applied on a given date.
 * If target history is present, entries are sorted chronologically.
 * Duplicate effective dates deterministically favor the latest entry in the array.
 */
export function getEffectiveTarget(
  tracker: CanonicalTrackerRecord,
  dateStr: string
): TrackerTarget {
  if (!tracker.targetHistory || tracker.targetHistory.length === 0) {
    return tracker.target;
  }

  // Preserve index position to resolve duplicate dates deterministically
  const indexed = tracker.targetHistory.map((item, idx) => ({ ...item, _idx: idx }));

  indexed.sort((a, b) => {
    if (a.effectiveDate === b.effectiveDate) {
      return a._idx - b._idx;
    }
    return a.effectiveDate.localeCompare(b.effectiveDate);
  });

  let effective: TrackerTarget = tracker.target;
  let found = false;

  for (const entry of indexed) {
    if (entry.effectiveDate <= dateStr) {
      effective = entry.target;
      found = true;
    } else {
      break;
    }
  }

  // If dateStr is before all targetHistory entries, use earliest recorded revision
  if (!found && indexed.length > 0) {
    return indexed[0].target;
  }

  return effective;
}

/**
 * Evaluates a single day's record for a tracker.
 *
 * Distinguishes:
 * - Unlogged vs note-only vs logged
 * - Active success vs planned skip (rest day) vs lapse/breach
 * - Invalid records and dates prior to tracker start date
 */
export function evaluateDayRecord(
  tracker: CanonicalTrackerRecord,
  dateStr: string
): DayEvaluation {
  const baseResult: DayEvaluation = {
    date: dateStr,
    isLogged: false,
    isValid: true,
    isBeforeStart: false,
    effectiveTarget: null,
    status: null,
    isSuccess: false,
    isStreakPreserving: false,
    isPlannedSkip: false,
    isLapseOrBreach: false,
  };

  if (!isValidDateFormat(dateStr)) {
    return {
      ...baseResult,
      isValid: false,
      validationError: `Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`,
    };
  }

  if (tracker.startDate && dateStr < tracker.startDate) {
    return {
      ...baseResult,
      isBeforeStart: true,
      isValid: false,
      validationError: `Date ${dateStr} precedes tracker start date ${tracker.startDate}.`,
    };
  }

  const effectiveTarget = getEffectiveTarget(tracker, dateStr);
  baseResult.effectiveTarget = effectiveTarget;

  const record: DayRecord | undefined = tracker.records?.[dateStr];

  // No record at all for this date
  if (!record) {
    return baseResult;
  }

  // Preserve day note if present
  if (record.note !== undefined) {
    baseResult.note = record.note;
  }
  if (record.value !== undefined) {
    baseResult.value = record.value;
  }
  if (record.timestamp !== undefined) {
    baseResult.timestamp = record.timestamp;
  }

  // Note-only date (record has note or other metadata, but NO tracking status)
  // Preserves reflections without inventing a tracking event or altering streaks.
  if (!record.status) {
    return {
      ...baseResult,
      isLogged: false,
      isValid: true,
      status: null,
    };
  }

  baseResult.status = record.status;
  baseResult.isLogged = true;

  // Validate status compatibility with modality
  if (!validateDayRecordStatus(tracker.modality, record.status)) {
    return {
      ...baseResult,
      isValid: false,
      validationError: `Status "${record.status}" is incompatible with ${tracker.modality} modality.`,
    };
  }

  switch (tracker.modality) {
    case "abstinence": {
      if (record.status === "confirmed_clean") {
        return {
          ...baseResult,
          isSuccess: true,
          isStreakPreserving: true,
          isLapseOrBreach: false,
        };
      }
      if (record.status === "lapsed") {
        return {
          ...baseResult,
          isSuccess: false,
          isStreakPreserving: false,
          isLapseOrBreach: true,
        };
      }
      break;
    }

    case "frequency": {
      if (record.status !== "recorded") {
        return {
          ...baseResult,
          isValid: false,
          validationError: "Frequency records must have status 'recorded'.",
        };
      }

      if (!isFiniteNonNegativeNumber(record.value)) {
        return {
          ...baseResult,
          isValid: false,
          validationError: `Frequency record requires a finite non-negative value, got: ${String(record.value)}.`,
        };
      }

      if (effectiveTarget.rule === "zero") {
        const isClean = record.value === 0;
        return {
          ...baseResult,
          isSuccess: isClean,
          isStreakPreserving: isClean,
          isLapseOrBreach: !isClean,
        };
      }

      if (effectiveTarget.rule === "at_most") {
        const withinLimit = record.value <= effectiveTarget.limit;
        return {
          ...baseResult,
          isSuccess: withinLimit,
          isStreakPreserving: withinLimit,
          isLapseOrBreach: !withinLimit,
        };
      }
      break;
    }

    case "daily_habit": {
      if (record.status === "skipped") {
        return {
          ...baseResult,
          isSuccess: false,
          isPlannedSkip: true,
          isStreakPreserving: true,
          isLapseOrBreach: false,
        };
      }

      if (record.status === "completed") {
        if (effectiveTarget.rule === "at_least") {
          if (record.value !== undefined) {
            if (!isFiniteNonNegativeNumber(record.value)) {
              return {
                ...baseResult,
                isValid: false,
                validationError: `Habit record value must be finite non-negative number, got: ${String(record.value)}.`,
              };
            }
            const meetsMinimum = record.value >= effectiveTarget.minimum;
            return {
              ...baseResult,
              isSuccess: meetsMinimum,
              isStreakPreserving: meetsMinimum,
              isLapseOrBreach: !meetsMinimum,
            };
          }
        }
        // If completed without a specific quantity or with meeting target
        return {
          ...baseResult,
          isSuccess: true,
          isStreakPreserving: true,
          isLapseOrBreach: false,
        };
      }
      break;
    }

    case "boundary": {
      if (effectiveTarget.rule === "before_time") {
        if (record.timestamp) {
          if (!isValidTimeFormat(record.timestamp)) {
            return {
              ...baseResult,
              isValid: false,
              validationError: `Invalid boundary timestamp: "${record.timestamp}". Expected HH:mm.`,
            };
          }
          // Exact curfew boundary check: timestamp <= cutoff is adhered, > cutoff is breached
          const isAtOrBeforeCutoff = record.timestamp <= effectiveTarget.cutoff;
          return {
            ...baseResult,
            isSuccess: isAtOrBeforeCutoff,
            isStreakPreserving: isAtOrBeforeCutoff,
            isLapseOrBreach: !isAtOrBeforeCutoff,
          };
        }

        // If no timestamp was specified, check explicit status
        const isAdhered = record.status === "adhered";
        return {
          ...baseResult,
          isSuccess: isAdhered,
          isStreakPreserving: isAdhered,
          isLapseOrBreach: !isAdhered,
        };
      }
      break;
    }
  }

  return baseResult;
}

/**
 * Resolves a date string or Date object into a normalized YYYY-MM-DD string.
 */
function normalizeDateStr(date: Date | string): string {
  if (typeof date === "string") {
    if (isValidDateFormat(date)) return date;
    const parsed = parseISO(date);
    return format(parsed, "yyyy-MM-dd");
  }
  return format(date, "yyyy-MM-dd");
}

/**
 * Consecutive calendar-day streak calculation for the unified tracking engine.
 *
 * Rules:
 * - Checks day T, T-1, T-2... backwards from referenceDate.
 * - Missing days (unlogged) break the streak.
 * - If today is streak-preserving (success or planned skip), streak starts from today.
 * - If today is a lapse or breach, streak is immediately 0.
 * - If today is unlogged, but yesterday was streak-preserving, streak starts from yesterday (grace period).
 * - If neither today nor yesterday was streak-preserving, streak is 0.
 * - Evaluation stops if date precedes tracker.startDate.
 */
export function calculateUnifiedStreak(
  tracker: CanonicalTrackerRecord,
  referenceDate: Date | string = new Date()
): number {
  if (!tracker || !tracker.startDate) return 0;

  const todayStr = normalizeDateStr(referenceDate);
  const refDateObj = parseISO(todayStr);
  const yesterdayStr = format(subDays(refDateObj, 1), "yyyy-MM-dd");

  const todayEval = evaluateDayRecord(tracker, todayStr);
  const yesterdayEval = evaluateDayRecord(tracker, yesterdayStr);

  // If today had an explicit lapse or breach, streak is broken
  if (todayEval.isLapseOrBreach) {
    return 0;
  }

  const todayValidStreak = todayEval.isStreakPreserving;
  const yesterdayValidStreak = yesterdayEval.isStreakPreserving;

  if (!todayValidStreak && !yesterdayValidStreak) {
    return 0;
  }

  let streak = 0;
  let currentDate = todayValidStreak ? refDateObj : subDays(refDateObj, 1);

  while (true) {
    const dStr = format(currentDate, "yyyy-MM-dd");
    if (dStr < tracker.startDate) {
      break;
    }

    const evaluation = evaluateDayRecord(tracker, dStr);
    if (evaluation.isStreakPreserving) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Historical longest streak of streak-preserving calendar days.
 * Scans contiguous streak-preserving days from startDate up to referenceDate.
 */
export function calculateUnifiedLongestStreak(
  tracker: CanonicalTrackerRecord,
  referenceDate: Date | string = new Date()
): number {
  if (!tracker || !tracker.startDate) return 0;

  const upToStr = normalizeDateStr(referenceDate);
  if (upToStr < tracker.startDate) return 0;

  const startDateObj = parseISO(tracker.startDate);
  const upToDateObj = parseISO(upToStr);
  const totalDays = differenceInCalendarDays(upToDateObj, startDateObj);

  if (totalDays < 0) return 0;

  let maxStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(startDateObj, i);
    const dStr = format(d, "yyyy-MM-dd");
    const evaluation = evaluateDayRecord(tracker, dStr);

    if (evaluation.isStreakPreserving) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Comprehensive progress metrics for a unified tracker.
 *
 * Distinguishes:
 * - Active completed/clean days
 * - Planned rest days (skips)
 * - Lapses and breaches
 * - Unlogged days
 *
 * Adherence percentage:
 * - Treats unlogged days as non-adherent (no catch-up debt, missing info is not success).
 * - Empty trackers return 0% adherence (never 100%).
 * - Excludes future dates.
 */
export function calculateUnifiedMetrics(
  tracker: CanonicalTrackerRecord,
  referenceDate: Date | string = new Date()
): TrackerMetrics {
  const emptyMetrics: TrackerMetrics = {
    currentStreak: 0,
    longestStreak: 0,
    totalActiveSuccessDays: 0,
    totalPlannedSkips: 0,
    totalLapsesOrBreaches: 0,
    unloggedDays: 0,
    totalEvaluatedDays: 0,
    adherencePercentage: 0,
  };

  if (!tracker || !tracker.startDate) {
    return emptyMetrics;
  }

  const refDateStr = normalizeDateStr(referenceDate);
  if (refDateStr < tracker.startDate) {
    return emptyMetrics;
  }

  const startDateObj = parseISO(tracker.startDate);
  const refDateObj = parseISO(refDateStr);
  const totalDays = differenceInCalendarDays(refDateObj, startDateObj) + 1;

  if (totalDays <= 0) {
    return emptyMetrics;
  }

  let totalActiveSuccessDays = 0;
  let totalPlannedSkips = 0;
  let totalLapsesOrBreaches = 0;
  let unloggedDays = 0;

  for (let i = 0; i < totalDays; i++) {
    const dStr = format(addDays(startDateObj, i), "yyyy-MM-dd");
    const evaluation = evaluateDayRecord(tracker, dStr);

    if (evaluation.isSuccess) {
      totalActiveSuccessDays++;
    } else if (evaluation.isPlannedSkip) {
      totalPlannedSkips++;
    } else if (evaluation.isLapseOrBreach) {
      totalLapsesOrBreaches++;
    } else {
      unloggedDays++;
    }
  }

  const adherentDays = totalActiveSuccessDays + totalPlannedSkips;
  const adherencePercentage = Math.round((adherentDays / totalDays) * 100);

  return {
    currentStreak: calculateUnifiedStreak(tracker, referenceDate),
    longestStreak: calculateUnifiedLongestStreak(tracker, referenceDate),
    totalActiveSuccessDays,
    totalPlannedSkips,
    totalLapsesOrBreaches,
    unloggedDays,
    totalEvaluatedDays: totalDays,
    adherencePercentage,
  };
}

/**
 * Generates a stable deterministic ID for a tracker.
 * Avoids non-deterministic timestamps like Date.now().
 */
export function createDeterministicTrackerId(
  name: string,
  category: string = "Personal Goal",
  startDate: string = "1970-01-01"
): string {
  const cleanName = (name || "tracker")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const cleanCategory = (category || "goal")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const input = `${cleanName}:${cleanCategory}:${startDate}`;
  let hash = 0x811c9dc5; // 32-bit FNV-1a offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hexHash = (hash >>> 0).toString(16).padStart(8, "0");

  return `${cleanName}-${hexHash}`;
}
