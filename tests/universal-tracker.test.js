import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveTrackerById, evaluateDayRecord } from "../src/utils/unifiedCalculations.js";
import { applyTrackerDayRecord } from "../src/utils/canonicalStore.js";

const base = (overrides = {}) => ({
  id: "id-1", name: "Same name", category: "Personal Goal", modality: "abstinence",
  target: { rule: "zero" }, startDate: "2025-01-01", records: {}, ...overrides,
});

describe("Universal tracker detail domain behavior", () => {
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
});
