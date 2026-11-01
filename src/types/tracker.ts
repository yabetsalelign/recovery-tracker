/**
 * Unified Tracker Type Contracts (Canonical Schema v3)
 *
 * Core domain types for the unified tracking engine.
 * Supports four distinct tracking modalities, separated targets,
 * historical target revisions, and 7 canonical record statuses.
 */

export type TrackingModality =
  | "abstinence"
  | "frequency"
  | "daily_habit"
  | "boundary";

export type StandardCategory =
  | "Substance Sobriety"
  | "Digital & Behavioral"
  | "Emotional & Mental"
  | "Physical Health"
  | "Personal Goal";

export type TrackerCategory = StandardCategory | (string & {});

export type TargetRule =
  | "zero"
  | "at_most"
  | "at_least"
  | "before_time";

export interface ZeroTarget {
  rule: "zero";
}

export interface UpperLimitTarget {
  rule: "at_most";
  limit: number;
  unit?: string;
}

export interface HabitTarget {
  rule: "at_least";
  minimum: number;
  unit?: string;
}

export interface CurfewTarget {
  rule: "before_time";
  cutoff: string; // "HH:mm" (24-hour format)
}

export type TrackerTarget =
  | ZeroTarget
  | UpperLimitTarget
  | HabitTarget
  | CurfewTarget;

export interface TargetHistoryEntry {
  effectiveDate: string; // YYYY-MM-DD
  target: TrackerTarget;
}

export type DayRecordStatus =
  | "confirmed_clean"
  | "lapsed"
  | "recorded"
  | "completed"
  | "skipped"
  | "adhered"
  | "breached";

export interface DayRecord {
  status?: DayRecordStatus;
  value?: number;
  timestamp?: string; // "HH:mm"
  note?: string;
  rawLegacyCheckIn?: boolean;
}

export interface LegacyTrackerMetadata {
  originalModality?: string;
  originalCategory?: string;
  isInferredModality?: boolean;
  requiresReview?: boolean;
}

export interface CanonicalTrackerRecord {
  id: string;
  name: string;
  category: TrackerCategory;
  modality: TrackingModality;
  target: TrackerTarget;
  targetHistory?: TargetHistoryEntry[];
  records: Record<string, DayRecord>;
  generalNote?: string;
  startDate: string; // YYYY-MM-DD
  isArchived?: boolean;
  legacyMetadata?: LegacyTrackerMetadata;
}

export interface CanonicalStorageEnvelope {
  schemaVersion: 3;
  trackers: CanonicalTrackerRecord[];
  migratedAt: string;
}

export interface DayEvaluation {
  date: string;
  isLogged: boolean;
  isValid: boolean;
  validationError?: string;
  isBeforeStart: boolean;
  effectiveTarget: TrackerTarget | null;
  status: DayRecordStatus | null;
  isSuccess: boolean;
  isStreakPreserving: boolean;
  isPlannedSkip: boolean;
  isLapseOrBreach: boolean;
  value?: number;
  timestamp?: string;
  note?: string;
}

export interface TrackerMetrics {
  currentStreak: number;
  longestStreak: number;
  totalActiveSuccessDays: number;
  totalPlannedSkips: number;
  totalLapsesOrBreaches: number;
  unloggedDays: number;
  totalEvaluatedDays: number;
  adherencePercentage: number;
}

