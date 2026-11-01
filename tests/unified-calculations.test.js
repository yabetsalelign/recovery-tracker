import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  isValidDateFormat,
  isValidTimeFormat,
  isFiniteNonNegativeNumber,
  validateTrackerTarget,
  validateDayRecordStatus,
  getEffectiveTarget,
  evaluateDayRecord,
  calculateUnifiedStreak,
  calculateUnifiedLongestStreak,
  calculateUnifiedMetrics,
  createDeterministicTrackerId,
} from "../src/utils/unifiedCalculations.js";

describe("Unified Calculations - Suite 1: Validation and Compatibility Matrix", () => {
  test("isValidDateFormat validates YYYY-MM-DD and rejects invalid calendar days", () => {
    assert.equal(isValidDateFormat("2026-11-02"), true);
    assert.equal(isValidDateFormat("2024-02-29"), true); // leap year
    assert.equal(isValidDateFormat("2025-02-29"), false); // non-leap year
    assert.equal(isValidDateFormat("2026-02-30"), false); // impossible day
    assert.equal(isValidDateFormat("2026-13-01"), false); // impossible month
    assert.equal(isValidDateFormat("11/02/2026"), false);
    assert.equal(isValidDateFormat("2026-1-2"), false);
    assert.equal(isValidDateFormat(""), false);
  });

  test("isValidTimeFormat validates 24-hour HH:mm format", () => {
    assert.equal(isValidTimeFormat("00:00"), true);
    assert.equal(isValidTimeFormat("07:30"), true);
    assert.equal(isValidTimeFormat("23:59"), true);
    assert.equal(isValidTimeFormat("24:00"), false);
    assert.equal(isValidTimeFormat("12:60"), false);
    assert.equal(isValidTimeFormat("7:30"), false);
    assert.equal(isValidTimeFormat("23:5"), false);
    assert.equal(isValidTimeFormat("any-string"), false);
  });

  test("isFiniteNonNegativeNumber validates numbers and rejects NaN, Infinity, negative values", () => {
    assert.equal(isFiniteNonNegativeNumber(0), true);
    assert.equal(isFiniteNonNegativeNumber(5), true);
    assert.equal(isFiniteNonNegativeNumber(2.5), true);
    assert.equal(isFiniteNonNegativeNumber(-1), false);
    assert.equal(isFiniteNonNegativeNumber(NaN), false);
    assert.equal(isFiniteNonNegativeNumber(Infinity), false);
    assert.equal(isFiniteNonNegativeNumber("5"), false);
    assert.equal(isFiniteNonNegativeNumber(null), false);
    assert.equal(isFiniteNonNegativeNumber(undefined), false);
  });

  test("validateTrackerTarget validates modality and target compatibility", () => {
    // Abstinence
    assert.equal(validateTrackerTarget("abstinence", { rule: "zero" }).valid, true);
    assert.equal(validateTrackerTarget("abstinence", { rule: "at_most", limit: 2 }).valid, false);

    // Frequency
    assert.equal(validateTrackerTarget("frequency", { rule: "zero" }).valid, true);
    assert.equal(validateTrackerTarget("frequency", { rule: "at_most", limit: 3 }).valid, true);
    assert.equal(validateTrackerTarget("frequency", { rule: "at_most", limit: -1 }).valid, false);
    assert.equal(validateTrackerTarget("frequency", { rule: "at_least", minimum: 1 }).valid, false);

    // Daily Habit
    assert.equal(validateTrackerTarget("daily_habit", { rule: "at_least", minimum: 1 }).valid, true);
    assert.equal(validateTrackerTarget("daily_habit", { rule: "at_least", minimum: 0 }).valid, false);
    assert.equal(validateTrackerTarget("daily_habit", { rule: "zero" }).valid, false);

    // Boundary
    assert.equal(validateTrackerTarget("boundary", { rule: "before_time", cutoff: "23:00" }).valid, true);
    assert.equal(validateTrackerTarget("boundary", { rule: "before_time", cutoff: "25:00" }).valid, false);
    assert.equal(validateTrackerTarget("boundary", { rule: "zero" }).valid, false);
  });

  test("validateDayRecordStatus enforces canonical status per modality", () => {
    assert.equal(validateDayRecordStatus("abstinence", "confirmed_clean"), true);
    assert.equal(validateDayRecordStatus("abstinence", "lapsed"), true);
    assert.equal(validateDayRecordStatus("abstinence", "recorded"), false);
    assert.equal(validateDayRecordStatus("abstinence", "completed"), false);

    assert.equal(validateDayRecordStatus("frequency", "recorded"), true);
    assert.equal(validateDayRecordStatus("frequency", "confirmed_clean"), false);

    assert.equal(validateDayRecordStatus("daily_habit", "completed"), true);
    assert.equal(validateDayRecordStatus("daily_habit", "skipped"), true);
    assert.equal(validateDayRecordStatus("daily_habit", "adhered"), false);

    assert.equal(validateDayRecordStatus("boundary", "adhered"), true);
    assert.equal(validateDayRecordStatus("boundary", "breached"), true);
    assert.equal(validateDayRecordStatus("boundary", "lapsed"), false);
  });
});

describe("Unified Calculations - Suite 2: Single-Day Evaluation Matrix", () => {
  test("Abstinence modality evaluates clean days and lapses correctly", () => {
    const tracker = {
      id: "sober",
      name: "Sobriety",
      category: "Substance Sobriety",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-10-05": { status: "confirmed_clean", note: "Felt strong today" },
        "2026-10-06": { status: "lapsed", note: "Difficult evening" },
      },
    };

    const cleanEval = evaluateDayRecord(tracker, "2026-10-05");
    assert.equal(cleanEval.isLogged, true);
    assert.equal(cleanEval.isSuccess, true);
    assert.equal(cleanEval.isStreakPreserving, true);
    assert.equal(cleanEval.isLapseOrBreach, false);
    assert.equal(cleanEval.note, "Felt strong today");

    const lapseEval = evaluateDayRecord(tracker, "2026-10-06");
    assert.equal(lapseEval.isLogged, true);
    assert.equal(lapseEval.isSuccess, false);
    assert.equal(lapseEval.isStreakPreserving, false);
    assert.equal(lapseEval.isLapseOrBreach, true);
  });

  test("Frequency modality evaluates zero and upper limit targets", () => {
    const zeroTracker = {
      id: "caffeine-zero",
      name: "No Caffeine",
      category: "Physical Health",
      modality: "frequency",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { status: "recorded", value: 0 },
        "2026-10-03": { status: "recorded", value: 2 },
      },
    };

    const zeroClean = evaluateDayRecord(zeroTracker, "2026-10-02");
    assert.equal(zeroClean.isSuccess, true);
    assert.equal(zeroClean.isStreakPreserving, true);

    const zeroLapse = evaluateDayRecord(zeroTracker, "2026-10-03");
    assert.equal(zeroLapse.isSuccess, false);
    assert.equal(zeroLapse.isLapseOrBreach, true);

    const limitTracker = {
      id: "screen-time",
      name: "Screen Time",
      category: "Digital & Behavioral",
      modality: "frequency",
      target: { rule: "at_most", limit: 2, unit: "hours" },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { status: "recorded", value: 1.5 },
        "2026-10-03": { status: "recorded", value: 2 },
        "2026-10-04": { status: "recorded", value: 3.5 },
      },
    };

    assert.equal(evaluateDayRecord(limitTracker, "2026-10-02").isSuccess, true);
    assert.equal(evaluateDayRecord(limitTracker, "2026-10-03").isSuccess, true); // at limit is success
    assert.equal(evaluateDayRecord(limitTracker, "2026-10-04").isSuccess, false); // exceeds limit
    assert.equal(evaluateDayRecord(limitTracker, "2026-10-04").isLapseOrBreach, true);
  });

  test("Daily habit evaluates completed, minimum thresholds, and planned rest days", () => {
    const habitTracker = {
      id: "reading",
      name: "Reading",
      category: "Personal Goal",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 20, unit: "pages" },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { status: "completed", value: 25 },
        "2026-10-03": { status: "completed", value: 10 },
        "2026-10-04": { status: "skipped", note: "Planned rest day" },
      },
    };

    const metGoal = evaluateDayRecord(habitTracker, "2026-10-02");
    assert.equal(metGoal.isSuccess, true);
    assert.equal(metGoal.isStreakPreserving, true);

    const underGoal = evaluateDayRecord(habitTracker, "2026-10-03");
    assert.equal(underGoal.isSuccess, false);
    assert.equal(underGoal.isLapseOrBreach, true);

    const restDay = evaluateDayRecord(habitTracker, "2026-10-04");
    assert.equal(restDay.isSuccess, false);
    assert.equal(restDay.isPlannedSkip, true);
    assert.equal(restDay.isStreakPreserving, true); // planned skip preserves continuity!
    assert.equal(restDay.isLapseOrBreach, false);
  });

  test("Boundary modality evaluates exact curfew boundary behavior", () => {
    const curfewTracker = {
      id: "sleep-curfew",
      name: "Bedtime Curfew",
      category: "Physical Health",
      modality: "boundary",
      target: { rule: "before_time", cutoff: "23:00" },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { status: "adhered", timestamp: "22:45" },
        "2026-10-03": { status: "adhered", timestamp: "23:00" }, // exactly at cutoff is adhered
        "2026-10-04": { status: "breached", timestamp: "23:01" }, // 1 min late is breach
        "2026-10-05": { status: "adhered" }, // explicit adhered without timestamp
      },
    };

    assert.equal(evaluateDayRecord(curfewTracker, "2026-10-02").isSuccess, true);
    assert.equal(evaluateDayRecord(curfewTracker, "2026-10-03").isSuccess, true);
    assert.equal(evaluateDayRecord(curfewTracker, "2026-10-04").isSuccess, false);
    assert.equal(evaluateDayRecord(curfewTracker, "2026-10-04").isLapseOrBreach, true);
    assert.equal(evaluateDayRecord(curfewTracker, "2026-10-05").isSuccess, true);
  });

  test("Note-only dates preserve reflections without inventing a tracking event", () => {
    const tracker = {
      id: "meditation",
      name: "Meditation",
      category: "Emotional & Mental",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { note: "Reflected quietly, did not formally meditate" },
      },
    };

    const evalResult = evaluateDayRecord(tracker, "2026-10-02");
    assert.equal(evalResult.isValid, true);
    assert.equal(evalResult.isLogged, false); // Not logged as a tracking event
    assert.equal(evalResult.status, null);
    assert.equal(evalResult.isSuccess, false);
    assert.equal(evalResult.isStreakPreserving, false);
    assert.equal(evalResult.isLapseOrBreach, false);
    assert.equal(evalResult.note, "Reflected quietly, did not formally meditate");
  });

  test("Dates before tracker start date are flagged as before start", () => {
    const tracker = {
      id: "t1",
      name: "Test",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-15",
      records: {},
    };

    const evalResult = evaluateDayRecord(tracker, "2026-10-10");
    assert.equal(evalResult.isBeforeStart, true);
    assert.equal(evalResult.isValid, false);
  });

  test("Invalid numeric values and timestamps are caught with validation errors", () => {
    const tracker = {
      id: "freq",
      name: "Frequency",
      category: "Personal Goal",
      modality: "frequency",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { status: "recorded", value: NaN },
        "2026-10-03": { status: "recorded", value: -5 },
      },
    };

    assert.equal(evaluateDayRecord(tracker, "2026-10-02").isValid, false);
    assert.equal(evaluateDayRecord(tracker, "2026-10-03").isValid, false);
  });
});

describe("Unified Calculations - Suite 3: Historical Target Revisions", () => {
  test("Target history resolves the correct target effective for each historical date", () => {
    const tracker = {
      id: "screen-time",
      name: "Screen Time",
      category: "Digital & Behavioral",
      modality: "frequency",
      target: { rule: "at_most", limit: 2 }, // current target
      targetHistory: [
        { effectiveDate: "2026-09-01", target: { rule: "at_most", limit: 4 } },
        { effectiveDate: "2026-10-01", target: { rule: "at_most", limit: 3 } },
        { effectiveDate: "2026-11-01", target: { rule: "at_most", limit: 2 } },
      ],
      startDate: "2026-09-01",
      records: {
        "2026-09-15": { status: "recorded", value: 3.5 }, // allowed under limit 4
        "2026-10-15": { status: "recorded", value: 3.5 }, // breached under limit 3
      },
    };

    const sepEval = evaluateDayRecord(tracker, "2026-09-15");
    assert.equal(sepEval.effectiveTarget.limit, 4);
    assert.equal(sepEval.isSuccess, true);

    const octEval = evaluateDayRecord(tracker, "2026-10-15");
    assert.equal(octEval.effectiveTarget.limit, 3);
    assert.equal(octEval.isSuccess, false);
    assert.equal(octEval.isLapseOrBreach, true);
  });

  test("Target history duplicate dates deterministically select the last declared revision", () => {
    const tracker = {
      id: "habit",
      name: "Habit",
      category: "Personal Goal",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 30 },
      targetHistory: [
        { effectiveDate: "2026-10-01", target: { rule: "at_least", minimum: 10 } },
        { effectiveDate: "2026-10-01", target: { rule: "at_least", minimum: 20 } },
      ],
      startDate: "2026-10-01",
      records: {},
    };

    const target = getEffectiveTarget(tracker, "2026-10-05");
    assert.equal(target.minimum, 20);
  });
});

describe("Unified Calculations - Suite 4: Streak Calculations", () => {
  const FIXED_TODAY = "2026-11-02"; // Monday

  test("Empty tracker returns 0 streak", () => {
    const tracker = {
      id: "empty",
      name: "Empty",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {},
    };
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 0);
  });

  test("Only today logged clean returns streak of 1", () => {
    const tracker = {
      id: "t",
      name: "T",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-11-02": { status: "confirmed_clean" },
      },
    };
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 1);
  });

  test("Today unlogged with yesterday clean gives grace period streak of 1", () => {
    const tracker = {
      id: "t",
      name: "T",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-11-01": { status: "confirmed_clean" }, // yesterday
      },
    };
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 1);
  });

  test("Today lapsed resets streak immediately to 0 even if yesterday was clean", () => {
    const tracker = {
      id: "t",
      name: "T",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-11-01": { status: "confirmed_clean" },
        "2026-11-02": { status: "lapsed" },
      },
    };
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 0);
  });

  test("Gaps in records immediately terminate streak", () => {
    const tracker = {
      id: "t",
      name: "T",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        "2026-11-02": { status: "confirmed_clean" },
        "2026-11-01": { status: "confirmed_clean" },
        // 2026-10-31 is missing!
        "2026-10-30": { status: "confirmed_clean" },
        "2026-10-29": { status: "confirmed_clean" },
      },
    };
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 2);
  });

  test("Planned rest days preserve streak continuity in habits", () => {
    const tracker = {
      id: "habit",
      name: "Daily Habit",
      category: "Personal Goal",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      startDate: "2026-10-25",
      records: {
        "2026-11-02": { status: "completed" },
        "2026-11-01": { status: "skipped" }, // planned rest day
        "2026-10-31": { status: "completed" },
        "2026-10-30": { status: "completed" },
      },
    };
    // 4 consecutive streak-preserving days (3 active + 1 planned skip)
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 4);
  });

  test("Streak calculation never walks prior to tracker startDate", () => {
    const tracker = {
      id: "t",
      name: "T",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-11-01", // started yesterday
      records: {
        "2026-11-02": { status: "confirmed_clean" },
        "2026-11-01": { status: "confirmed_clean" },
        "2026-10-31": { status: "confirmed_clean" }, // before start
      },
    };
    assert.equal(calculateUnifiedStreak(tracker, FIXED_TODAY), 2);
  });
});

describe("Unified Calculations - Suite 5: Historical Longest Streak", () => {
  test("Calculates maximum contiguous streak-preserving days across history", () => {
    const tracker = {
      id: "t",
      name: "T",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {
        // Run of 4
        "2026-10-01": { status: "confirmed_clean" },
        "2026-10-02": { status: "confirmed_clean" },
        "2026-10-03": { status: "confirmed_clean" },
        "2026-10-04": { status: "confirmed_clean" },
        "2026-10-05": { status: "lapsed" },
        // Run of 2
        "2026-10-06": { status: "confirmed_clean" },
        "2026-10-07": { status: "confirmed_clean" },
      },
    };

    assert.equal(calculateUnifiedLongestStreak(tracker, "2026-10-10"), 4);
  });

  test("Returns 0 for empty or null records", () => {
    const tracker = {
      id: "empty",
      name: "Empty",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-10-01",
      records: {},
    };
    assert.equal(calculateUnifiedLongestStreak(tracker, "2026-10-10"), 0);
  });
});

describe("Unified Calculations - Suite 6: Progress Metrics and Adherence Behavior", () => {
  const FIXED_TODAY = "2026-11-05";

  test("Empty tracker returns 0% adherence, never 100%", () => {
    const tracker = {
      id: "empty",
      name: "Empty",
      category: "Personal Goal",
      modality: "abstinence",
      target: { rule: "zero" },
      startDate: "2026-11-01",
      records: {},
    };

    const metrics = calculateUnifiedMetrics(tracker, FIXED_TODAY);
    assert.equal(metrics.adherencePercentage, 0);
    assert.equal(metrics.totalActiveSuccessDays, 0);
    assert.equal(metrics.totalPlannedSkips, 0);
    assert.equal(metrics.unloggedDays, 5); // Nov 1, 2, 3, 4, 5
    assert.equal(metrics.totalEvaluatedDays, 5);
  });

  test("Unlogged days are treated as non-adherent and reduce adherence percentage", () => {
    const tracker = {
      id: "habit",
      name: "Workout",
      category: "Physical Health",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      startDate: "2026-11-01",
      records: {
        "2026-11-01": { status: "completed" },
        "2026-11-02": { status: "skipped" }, // planned rest
        // Nov 3, 4, 5 are unlogged
      },
    };

    const metrics = calculateUnifiedMetrics(tracker, FIXED_TODAY);
    assert.equal(metrics.totalActiveSuccessDays, 1);
    assert.equal(metrics.totalPlannedSkips, 1);
    assert.equal(metrics.unloggedDays, 3);
    assert.equal(metrics.totalEvaluatedDays, 5);
    // (1 + 1) / 5 = 40%
    assert.equal(metrics.adherencePercentage, 40);
  });

  test("Excludes future dates beyond the reference date", () => {
    const tracker = {
      id: "habit",
      name: "Workout",
      category: "Physical Health",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      startDate: "2026-11-01",
      records: {
        "2026-11-01": { status: "completed" },
        "2026-11-02": { status: "completed" },
        "2026-11-10": { status: "completed" }, // future record!
      },
    };

    const metrics = calculateUnifiedMetrics(tracker, "2026-11-02");
    assert.equal(metrics.totalEvaluatedDays, 2);
    assert.equal(metrics.totalActiveSuccessDays, 2);
    assert.equal(metrics.adherencePercentage, 100);
  });
});

describe("Unified Calculations - Suite 7: Deterministic Tracker ID Generation", () => {
  test("Repeated calls produce identical deterministic IDs without randomness", () => {
    const id1 = createDeterministicTrackerId("Morning Run", "Physical Health", "2026-10-01");
    const id2 = createDeterministicTrackerId("Morning Run", "Physical Health", "2026-10-01");
    assert.equal(id1, id2);
    assert.match(id1, /^morning-run-[0-9a-f]{8}$/);
  });

  test("Different names or categories produce distinct IDs", () => {
    const idA = createDeterministicTrackerId("Morning Run", "Physical Health", "2026-10-01");
    const idB = createDeterministicTrackerId("Evening Walk", "Physical Health", "2026-10-01");
    const idC = createDeterministicTrackerId("Morning Run", "Personal Goal", "2026-10-01");
    assert.notEqual(idA, idB);
    assert.notEqual(idA, idC);
  });
});

