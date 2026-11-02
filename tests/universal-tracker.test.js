import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveTrackerById, evaluateDayRecord, getEffectiveTarget, createDeterministicTrackerId } from "../src/utils/unifiedCalculations.js";
import { applyTrackerDayRecord, applyTrackerDayStatus, applyTrackerDayNote, applyDeleteTrackerDayNote, applyUpdateTracker, applyDeleteTracker, toLegacyTrackerRecord, persistCanonicalEnvelope, initializeCanonicalData } from "../src/utils/canonicalStore.js";
import { createCanonicalTracker } from "../src/utils/trackerCreation.js";
import { resolveBackupPayload } from "../src/utils/unifiedMigration.js";

const base = (overrides = {}) => ({
  id: "id-1", name: "Same name", category: "Personal Goal", modality: "abstinence",
  target: { rule: "zero" }, startDate: "2025-01-01", records: {}, ...overrides,
});

describe("Universal tracker detail domain behavior", () => {
  test("creates all modalities with validated targets, rationale, optional date, and collision-safe IDs", () => {
    const specs = [
      ["Sobriety", "abstinence", { rule: "zero" }],
      ["Cigarettes", "frequency", { rule: "at_most", limit: 2, unit: "cigarettes" }],
      ["Reading", "daily_habit", { rule: "at_least", minimum: 10, unit: "pages" }],
      ["Evening cutoff", "boundary", { rule: "before_time", cutoff: "22:00" }],
    ];
    const created = specs.map(([name, modality, target]) => createCanonicalTracker({ name, category: "Personal Goal", modality, target, startDate: "2025-01-01", rationale: "A personal intention" }, []).data);
    assert.deepEqual(created.map((tracker) => tracker.modality), ["abstinence", "frequency", "daily_habit", "boundary"]);
    assert.equal(created[1].target.limit, 2);
    assert.equal(created[2].target.minimum, 10);
    assert.equal(created[3].target.cutoff, "22:00");
    assert.equal(created[0].records["2025-01-01"].note, "A personal intention");
    assert.equal(createCanonicalTracker({ name: "Broken", category: "Personal Goal", modality: "abstinence", target: { rule: "at_most", limit: 2 } }, []).success, false);
    const baseId = createDeterministicTrackerId("Cigarettes", "Personal Goal", "2025-01-01");
    const collision = base({ id: baseId, name: "Different existing tracker" });
    const unique = createCanonicalTracker({ name: "Cigarettes", category: "Personal Goal", modality: "frequency", target: { rule: "zero" }, startDate: "2025-01-01" }, [collision]);
    assert.equal(unique.success, true);
    assert.notEqual(unique.data.id, baseId);
    const sameName = createCanonicalTracker({ name: "Cigarettes", category: "Personal Goal", modality: "frequency", target: { rule: "zero" }, startDate: "2025-01-01" }, [created[1]]);
    assert.equal(sameName.success, true);
    assert.equal(sameName.data.name, created[1].name);
    assert.notEqual(sameName.data.id, created[1].id);
  });

  test("resolves by canonical ID when display names are duplicated", () => {
    const first = base({ id: "first" });
    const second = base({ id: "second" });
    assert.equal(resolveTrackerById([first, second], "second"), second);
    assert.equal(resolveTrackerById([first, second], "missing"), undefined);
  });

  test("updates historical records by ID while preserving unrelated records and fields", () => {
    const first = base({ id: "first", records: { "2025-02-01": { status: "recorded", value: 1.25, note: "keep this", rawLegacyCheckIn: true, legacyExtra: "preserved" } } });
    const second = base({ id: "second" });
    const updated = applyTrackerDayRecord([first, second], "first", "2025-02-01", { ...first.records["2025-02-01"], value: 2.5 });
    assert.equal(updated[0].records["2025-02-01"].value, 2.5);
    assert.equal(updated[0].records["2025-02-01"].note, "keep this");
    assert.equal(updated[0].records["2025-02-01"].rawLegacyCheckIn, true);
    assert.equal(updated[0].records["2025-02-01"].legacyExtra, "preserved");
    assert.deepEqual(updated[1], second);
    assert.deepEqual(applyTrackerDayRecord(updated, "first", "2025-02-01", null)[0].records, {});
  });

  test("updates and deletes duplicate-name trackers independently by canonical ID", () => {
    const first = base({ id: "first", records: { "2025-02-01": { status: "confirmed_clean", note: "first note" } }, generalNote: "first context" });
    const second = base({ id: "second", records: { "2025-02-01": { status: "lapsed", note: "second note" } }, generalNote: "second context" });
    const updated = applyUpdateTracker([first, second], "first", { name: "Renamed", target: { rule: "at_most", limit: 2 } }, "2025-03-01");
    assert.equal(updated[0].name, "Renamed");
    assert.deepEqual(updated[0].records, first.records);
    assert.equal(updated[0].generalNote, first.generalNote);
    assert.deepEqual(updated[0].targetHistory, [
      { effectiveDate: "2025-01-01", target: { rule: "zero" } },
      { effectiveDate: "2025-03-01", target: { rule: "at_most", limit: 2 } },
    ]);
    assert.deepEqual(getEffectiveTarget(updated[0], "2025-02-20"), { rule: "zero" });
    assert.deepEqual(getEffectiveTarget(updated[0], "2025-03-01"), { rule: "at_most", limit: 2 });
    assert.deepEqual(updated[1], second);
    const deleted = applyDeleteTracker(updated, "second");
    assert.deepEqual(deleted, [updated[0]]);
    assert.equal(deleted[0].id, "first");
  });

  test("Progress timeline day controls reveal details on activation", () => {
    const source = readFileSync(new URL("../src/Progress.tsx", import.meta.url), "utf8");
    assert.match(source, /onClick=\{\(\) => setSelectedDay\(key\)\}/);
    assert.match(source, /selectedDay && <section aria-live="polite"/);
    assert.match(source, /generalNotes\[selectedDay\]/);
    assert.match(source, /isPlannedSkip \? "Planned rest"/);
    assert.match(source, /: "Unlogged"/);
  });

  test("evaluates abstinence clean and lapse statuses separately", () => {
    const tracker = base({ records: { "2025-02-01": { status: "confirmed_clean" }, "2025-02-02": { status: "lapsed" } } });
    assert.equal(evaluateDayRecord(tracker, "2025-02-01").isSuccess, true);
    assert.equal(evaluateDayRecord(tracker, "2025-02-02").isLapseOrBreach, true);
    assert.equal(evaluateDayRecord(tracker, "2025-02-03").isLogged, false);
  });

  test("keeps explicit zero and fractional frequency values", () => {
    const tracker = base({ modality: "frequency", records: { "2025-02-01": { status: "recorded", value: 0 }, "2025-02-02": { status: "recorded", value: 1.5 } } });
    assert.equal(evaluateDayRecord(tracker, "2025-02-01").isSuccess, true);
    assert.equal(evaluateDayRecord(tracker, "2025-02-02").isLapseOrBreach, true);
  });

  test("distinguishes completed habits, planned rest, and note-only records", () => {
    const tracker = base({ modality: "daily_habit", target: { rule: "at_least", minimum: 3, unit: "pages" }, records: {
      "2025-02-01": { status: "completed", value: 3 }, "2025-02-02": { status: "skipped" }, "2025-02-03": { note: "Reflection only" },
    } });
    assert.equal(evaluateDayRecord(tracker, "2025-02-01").isSuccess, true);
    assert.equal(evaluateDayRecord(tracker, "2025-02-02").isPlannedSkip, true);
    assert.equal(evaluateDayRecord(tracker, "2025-02-03").isLogged, false);
    assert.equal(evaluateDayRecord(tracker, "2025-02-03").note, "Reflection only");
  });

  test("applies the boundary cutoff inclusively and identifies breaches", () => {
    const tracker = base({ modality: "boundary", target: { rule: "before_time", cutoff: "22:00" }, records: {
      "2025-02-01": { status: "adhered", timestamp: "22:00" }, "2025-02-02": { status: "breached", timestamp: "22:01" },
    } });
    assert.equal(evaluateDayRecord(tracker, "2025-02-01").isSuccess, true);
    assert.equal(evaluateDayRecord(tracker, "2025-02-02").isLapseOrBreach, true);
  });

  test("runs a multi-modality lifecycle through logging, historical correction, notes, backup, and reload", () => {
    const drafts = [
      { name: "Recovery", category: "Personal Goal", modality: "abstinence", target: { rule: "zero" }, startDate: "2025-01-01" },
      { name: "Cigarettes", category: "Substance Sobriety", modality: "frequency", target: { rule: "at_most", limit: 2, unit: "cigarettes" }, startDate: "2025-01-01" },
      { name: "Reading", category: "Personal Goal", modality: "daily_habit", target: { rule: "at_least", minimum: 10, unit: "pages" }, startDate: "2025-01-01" },
      { name: "Curfew", category: "Personal Goal", modality: "boundary", target: { rule: "before_time", cutoff: "22:00" }, startDate: "2025-01-01" },
    ];
    let trackers = drafts.map((draft) => createCanonicalTracker(draft, []).data);
    const id = (name) => trackers.find((tracker) => tracker.name === name).id;
    trackers = applyTrackerDayStatus(trackers, id("Recovery"), "2025-02-01", "confirmed_clean");
    trackers = applyTrackerDayRecord(trackers, id("Cigarettes"), "2025-02-01", { status: "recorded", value: 0 });
    trackers = applyTrackerDayRecord(trackers, id("Cigarettes"), "2025-02-02", { status: "recorded", value: 2.5, note: "Corrected quantity" });
    trackers = trackers.map((tracker) => tracker.id === id("Cigarettes") ? {
      ...tracker,
      targetHistory: [{ effectiveDate: "2025-01-15", target: { rule: "at_most", limit: 3, unit: "cigarettes" } }],
      records: { ...tracker.records, "2025-02-03": { rawLegacyCheckIn: true, note: "Needs review" } },
    } : tracker);
    trackers = applyTrackerDayRecord(trackers, id("Reading"), "2025-02-01", { status: "completed", value: 10 });
    trackers = applyTrackerDayStatus(trackers, id("Reading"), "2025-02-02", "skipped");
    trackers = applyTrackerDayRecord(trackers, id("Curfew"), "2025-02-01", { status: "adhered", timestamp: "22:00" });
    trackers = applyTrackerDayRecord(trackers, id("Curfew"), "2025-02-02", { status: "breached", timestamp: "22:10" });
    trackers = applyTrackerDayNote(trackers, id("Recovery"), "2025-02-03", "A note-only reflection");
    trackers = applyTrackerDayNote(trackers, id("Recovery"), "2025-02-01", "Preserve the existing clean-day note");
    trackers = trackers.map((tracker) => tracker.id === id("Recovery") ? { ...tracker, generalNote: "Tracker-level context", legacyMetadata: { requiresReview: true }, isArchived: true } : tracker);

    assert.equal(evaluateDayRecord(trackers[0], "2025-02-01").isSuccess, true);
    assert.equal(evaluateDayRecord(trackers[0], "2025-02-03").isLogged, false);
    assert.equal(evaluateDayRecord(trackers[1], "2025-02-01").isSuccess, true);
    assert.equal(trackers[1].records["2025-02-02"].value, 2.5);
    assert.equal(evaluateDayRecord(trackers[2], "2025-02-02").isPlannedSkip, true);
    assert.equal(evaluateDayRecord(trackers[3], "2025-02-01").isSuccess, true);
    assert.equal(evaluateDayRecord(trackers[3], "2025-02-02").isLapseOrBreach, true);
    assert.equal(trackers[0].records["2025-02-01"].note, "Preserve the existing clean-day note");
    assert.equal(trackers[0].generalNote, "Tracker-level context");
    assert.equal(trackers[0].legacyMetadata.requiresReview, true);
    assert.equal(trackers[1].targetHistory[0].target.limit, 3);
    assert.equal(trackers[1].records["2025-02-03"].rawLegacyCheckIn, true);
    assert.equal(applyDeleteTrackerDayNote(trackers, id("Recovery"), "2025-02-03")[0].records["2025-02-03"], undefined);

    const exported = { schemaVersion: 3, version: "3.0", canonicalTrackers: trackers, trackers: trackers.map(toLegacyTrackerRecord), generalNotes: { "2025-02-02": "Separate journal reflection" } };
    const firstRestore = resolveBackupPayload(JSON.parse(JSON.stringify(exported)));
    const repeatedRestore = resolveBackupPayload(JSON.parse(JSON.stringify(exported)));
    assert.equal(firstRestore.success, true);
    assert.deepEqual(firstRestore.trackers, trackers);
    assert.deepEqual(repeatedRestore.trackers, firstRestore.trackers);

    const storage = new Map();
    const mockStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key), key: (index) => [...storage.keys()][index] ?? null, get length() { return storage.size; } };
    assert.equal(persistCanonicalEnvelope(mockStorage, firstRestore.trackers).success, true);
    assert.deepEqual(initializeCanonicalData(mockStorage).trackers, trackers);
  });

  test("specialized bookmark routes still target their canonical wrapper pages", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    assert.match(app, /path="\/sesh"/);
    assert.match(app, /path="\/weed"/);
    assert.match(app, /path="\/porn"/);
    for (const file of ["SeshPage.tsx", "WeedPage.tsx", "pornPage.tsx"]) {
      const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
      assert.match(source, /TrackerDetail/);
      assert.match(source, /canonicalTrackers\.find/);
    }
  });
});
