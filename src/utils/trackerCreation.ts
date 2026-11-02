import type { ActionResult } from "../types";
import type { CanonicalTrackerRecord, TrackerCategory, TrackerTarget, TrackingModality } from "../types/tracker";
import { createDeterministicTrackerId, isValidDateFormat, validateTrackerTarget } from "./unifiedCalculations.js";

export interface CanonicalTrackerDraft {
  name: string;
  category: TrackerCategory;
  modality: TrackingModality;
  target: TrackerTarget;
  startDate?: string;
  rationale?: string;
}

export function createCanonicalTracker(
  draft: CanonicalTrackerDraft,
  existing: CanonicalTrackerRecord[],
  today = new Date()
): ActionResult<CanonicalTrackerRecord> {
  const name = draft.name.trim();
  if (!name) return { success: false, error: "Tracker name cannot be empty." };
  if (name.toLowerCase() === "general") return { success: false, error: "'General' is reserved for journal reflections." };
  const startDate = draft.startDate || today.toISOString().slice(0, 10);
  if (!isValidDateFormat(startDate)) return { success: false, error: "Start date must be a valid calendar date." };
  const targetValidation = validateTrackerTarget(draft.modality, draft.target);
  if (!targetValidation.valid) return { success: false, error: targetValidation.error || "Invalid tracker target." };

  const baseId = createDeterministicTrackerId(name, draft.category, startDate);
  const usedIds = new Set(existing.map((tracker) => tracker.id));
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
  const note = draft.rationale?.trim();
  return {
    success: true,
    data: {
      id,
      name,
      category: draft.category,
      modality: draft.modality,
      target: draft.target,
      startDate,
      records: note ? { [startDate]: { note } } : {},
    },
  };
}
