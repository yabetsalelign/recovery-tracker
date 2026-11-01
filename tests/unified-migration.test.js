import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  migrateLegacyData,
  resolveBackupPayload,
  validateMigrationIntegrity,
  inferLegacyModality,
  validateCanonicalTracker,
} from "../src/utils/unifiedMigration.js";
import { evaluateDayRecord } from "../src/utils/unifiedCalculations.js";

describe("Unified Migration - Suite 1: Basic Migration Scenarios", () => {
  test("General abstinence tracker migrates true check-ins to confirmed_clean and preserves start date", () => {
    const legacy = {
      trackers: [
        {
          id: "t-sober-1",
          name: "Sobriety",
          category: "Substance Sobriety",
          modality: "abstinence",
          startDate: "2026-09-01",
          checkIns: {
            "2026-09-05": true,
            "2026-09-06": true,
            "2026-09-07": false, // false is unlogged!
          },
          notes: {
            "2026-09-05": "First milestone",
          },
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 1);

    const t = res.trackers[0];
    assert.equal(t.id, "t-sober-1"); // preserves legacy ID
    assert.equal(t.name, "Sobriety");
    assert.equal(t.modality, "abstinence");
    assert.deepEqual(t.target, { rule: "zero" });
    assert.equal(t.startDate, "2026-09-01");

    // Check records
    assert.equal(t.records["2026-09-05"].status, "confirmed_clean");
    assert.equal(t.records["2026-09-05"].note, "First milestone");
    assert.equal(t.records["2026-09-06"].status, "confirmed_clean");

    // 2026-09-07 had false: must NOT be a lapse or check-in
    assert.equal(t.records["2026-09-07"], undefined);
  });

  test("General daily habit migrates true check-ins to completed", () => {
    const legacy = {
      trackers: [
        {
          id: 101,
          name: "Morning Run",
          category: "Physical Health",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: {
            "2026-10-02": true,
          },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];
    assert.equal(t.id, "101");
    assert.equal(t.modality, "daily_habit");
    assert.deepEqual(t.target, { rule: "at_least", minimum: 1 });
    assert.equal(t.records["2026-10-02"].status, "completed");
  });

  test("Note-only dates are preserved with note and no status (does not invent fake events)", () => {
    const legacy = {
      trackers: [
        {
          id: "journaling-tracker",
          name: "Journaling",
          category: "Personal Goal",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: {
            "2026-10-01": false, // unchecked
          },
          notes: {
            "2026-10-01": "Reflected without checking in.",
            "2026-10-02": "Another note on unlogged day.",
          },
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];

    assert.equal(t.records["2026-10-01"].status, undefined);
    assert.equal(t.records["2026-10-01"].note, "Reflected without checking in.");
    assert.equal(t.records["2026-10-02"].status, undefined);
    assert.equal(t.records["2026-10-02"].note, "Another note on unlogged day.");
    assert.equal(res.summary.noteOnlyRecordsMigrated, 2);
  });

  test("Specialized frequency trackers preserve exact counts and explicit zeros", () => {
    const legacy = {
      seshData: {
        "2026-10-10": 0, // explicit clean day
        "2026-10-11": 3,
        "2026-10-12": 1.5, // exact float
      },
      hasSesh: true,
      pornData: {
        "2026-10-10": 0,
        "2026-10-11": 1,
      },
      pornNotes: "Triggers: late night boredom. Goal: sleep before 23:00.",
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);

    const sesh = res.trackers.find((t) => t.name === "Sesh");
    assert.ok(sesh);
    assert.equal(sesh.id, "sesh");
    assert.equal(sesh.modality, "frequency");
    assert.deepEqual(sesh.target, { rule: "zero" });
    assert.equal(sesh.records["2026-10-10"].status, "recorded");
    assert.equal(sesh.records["2026-10-10"].value, 0);
    assert.equal(sesh.records["2026-10-11"].value, 3);
    assert.equal(sesh.records["2026-10-12"].value, 1.5);

    const porn = res.trackers.find((t) => t.name === "Porn");
    assert.ok(porn);
    assert.equal(porn.id, "porn");
    assert.equal(porn.generalNote, "Triggers: late night boredom. Goal: sleep before 23:00.");
    assert.equal(porn.records["2026-10-10"].value, 0);
    assert.equal(porn.records["2026-10-11"].value, 1);
  });
});

describe("Unified Migration - Suite 2: Semantic Safety and Ambiguity Handling", () => {
  test("Missing modality on Substance Sobriety infers abstinence with warning", () => {
    const legacy = {
      trackers: [
        {
          id: "t-alc",
          name: "Alcohol",
          category: "Substance Sobriety",
          // modality missing!
          startDate: "2026-09-01",
          checkIns: { "2026-09-05": true },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];
    assert.equal(t.modality, "abstinence");
    assert.equal(t.records["2026-09-05"].status, "confirmed_clean");
    assert.ok(res.issues.some((i) => i.message.includes("inferred \"abstinence\" based on \"Substance Sobriety\"")));
  });

  test("Missing modality on Personal Goal infers daily_habit with warning (avoids assuming abstinence)", () => {
    const legacy = {
      trackers: [
        {
          id: "t-reading",
          name: "Reading Books",
          category: "Personal Goal",
          // modality missing!
          startDate: "2026-09-01",
          checkIns: { "2026-09-05": true },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];
    assert.equal(t.modality, "daily_habit");
    assert.equal(t.records["2026-09-05"].status, "completed");
    assert.ok(res.issues.some((i) => i.message.includes("inferred \"daily_habit\" based on \"Personal Goal\"")));
  });

  test("Boundary tracker without timestamp data maps check-ins to adhered status", () => {
    const legacy = {
      trackers: [
        {
          id: "curfew-1",
          name: "Screen Curfew",
          category: "Digital & Behavioral",
          modality: "time_restriction",
          curfewTime: "22:00",
          startDate: "2026-09-01",
          checkIns: { "2026-09-05": true },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];
    assert.equal(t.modality, "boundary");
    assert.deepEqual(t.target, { rule: "before_time", cutoff: "22:00" });
    assert.equal(t.records["2026-09-05"].status, "adhered");
    assert.equal(t.records["2026-09-05"].timestamp, undefined); // no fabricated timestamp!
  });

  test("Incompatible general tracker and specialized tracker are preserved as separate trackers", () => {
    const legacy = {
      trackers: [
        {
          id: "weed-general",
          name: "Weed",
          category: "Substance Sobriety",
          modality: "abstinence", // Incompatible with frequency counts!
          startDate: "2026-08-01",
          checkIns: { "2026-08-05": true },
          notes: { "2026-08-05": "Clean day" },
        },
      ],
      weedData: {
        "2026-08-10": 2, // numeric count
        "2026-08-11": 0,
      },
      hasWeed: true,
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    // Both trackers must exist
    assert.equal(res.trackers.length, 2);

    const generalWeed = res.trackers.find((t) => t.id === "weed-general");
    assert.ok(generalWeed);
    assert.equal(generalWeed.modality, "abstinence");
    assert.equal(generalWeed.records["2026-08-05"].status, "confirmed_clean");

    const specWeed = res.trackers.find((t) => t.id === "weed");
    assert.ok(specWeed);
    assert.equal(specWeed.modality, "frequency");
    assert.equal(specWeed.records["2026-08-10"].value, 2);

    assert.ok(res.issues.some((i) => i.message.includes("preserved both as separate trackers")));
  });

  test("Compatible general tracker and specialized tracker reconcile cleanly", () => {
    const legacy = {
      trackers: [
        {
          id: "sesh-general",
          name: "Sesh",
          category: "Substance Sobriety",
          modality: "specialized", // compatible specialized/frequency!
          startDate: "2026-08-01",
          checkIns: {},
          notes: { "2026-08-10": "A reflection note on sesh" },
        },
      ],
      seshData: {
        "2026-08-10": 0,
        "2026-08-11": 2,
      },
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 1);

    const merged = res.trackers[0];
    assert.equal(merged.name, "Sesh");
    assert.equal(merged.id, "sesh-general"); // preserved ID
    assert.equal(merged.modality, "frequency");
    assert.equal(merged.records["2026-08-10"].status, "recorded");
    assert.equal(merged.records["2026-08-10"].value, 0);
    assert.equal(merged.records["2026-08-10"].note, "A reflection note on sesh");
    assert.equal(merged.records["2026-08-11"].value, 2);
  });
});

describe("Unified Migration - Suite 3: Deterministic Identity and Collision Resolution", () => {
  test("Duplicate legacy IDs disambiguate deterministically without crashing or losing data", () => {
    const legacy = {
      trackers: [
        {
          id: "dup-id",
          name: "Exercise 1",
          category: "Physical Health",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: { "2026-10-02": true },
          notes: {},
        },
        {
          id: "dup-id", // Same ID!
          name: "Exercise 2",
          category: "Physical Health",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: { "2026-10-02": true },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 2);
    assert.equal(res.trackers[0].id, "dup-id");
    assert.equal(res.trackers[1].id, "dup-id-col-2");
    assert.ok(res.issues.some((i) => i.message.includes("disambiguated to \"dup-id-col-2\"")));
  });

  test("Identical name, category, and start date without IDs generate distinct deterministic IDs", () => {
    const legacy = {
      trackers: [
        {
          name: "Meditation",
          category: "Emotional & Mental",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: {},
          notes: {},
        },
        {
          name: "Meditation",
          category: "Emotional & Mental",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: {},
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 2);
    assert.notEqual(res.trackers[0].id, res.trackers[1].id);
    assert.equal(res.trackers[1].id, `${res.trackers[0].id}-2`);
  });

  test("Repeated migration produces exactly the same IDs (strict idempotency)", () => {
    const legacy = {
      trackers: [
        {
          name: "Hydration",
          category: "Physical Health",
          startDate: "2026-07-01",
          checkIns: { "2026-07-02": true },
          notes: { "2026-07-02": "Drank 2L" },
        },
      ],
      weedData: { "2026-07-02": 0 },
    };

    const first = migrateLegacyData(legacy);
    const second = migrateLegacyData(legacy);

    assert.deepEqual(first.trackers, second.trackers);
    assert.deepEqual(first.summary, second.summary);
  });
});

describe("Unified Migration - Suite 4: Data Validation and Malformed Entry Handling", () => {
  test("Invalid date keys in checkIns or notes are caught and reported as errors without crashing", () => {
    const legacy = {
      trackers: [
        {
          id: "t-invalid-date",
          name: "Yoga",
          category: "Physical Health",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: {
            "2026-02-30": true, // impossible date
            "not-a-date": true,
            "2026-10-05": true, // valid
          },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers[0].records["2026-10-05"].status, "completed");
    assert.equal(res.trackers[0].records["2026-02-30"], undefined);
    assert.equal(res.trackers[0].records["not-a-date"], undefined);
    assert.ok(res.issues.some((i) => i.message.includes("Invalid date key \"2026-02-30\"")));
  });

  test("Negative counts, NaN, and non-numeric values in specialized data are skipped and reported", () => {
    const legacy = {
      seshData: {
        "2026-10-01": -1, // negative
        "2026-10-02": NaN, // NaN
        "2026-10-03": "invalid", // string
        "2026-10-04": 2, // valid
      },
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const sesh = res.trackers.find((t) => t.name === "Sesh");
    assert.ok(sesh);
    assert.equal(sesh.records["2026-10-04"].value, 2);
    assert.equal(sesh.records["2026-10-01"], undefined);
    assert.equal(sesh.records["2026-10-02"], undefined);
    assert.equal(sesh.records["2026-10-03"], undefined);
    assert.equal(res.summary.errorsCount, 3);
  });

  test("Missing tracker name skips corrupted entry and reports error", () => {
    const legacy = {
      trackers: [
        null,
        { id: 1 }, // missing name
        { id: 2, name: "Valid Goal", category: "Personal Goal", checkIns: {} },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 1);
    assert.equal(res.trackers[0].name, "Valid Goal");
    assert.equal(res.summary.errorsCount, 2);
  });
});

describe("Unified Migration - Suite 5: Backup Compatibility (v2 Legacy vs Canonical v3)", () => {
  test("Legacy v2 backup payload is migrated into canonical v3 structure", () => {
    const v2Backup = {
      version: "2.0",
      app: "Recovery Tracker",
      trackers: [
        {
          id: 1,
          name: "Sobriety",
          category: "Substance Sobriety",
          modality: "abstinence",
          startDate: "2026-09-01",
          checkIns: { "2026-09-02": true },
          notes: {},
        },
      ],
      weedData: { "2026-09-02": 0 },
    };

    const res = resolveBackupPayload(v2Backup);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 2);
  });

  test("Canonical v3 backup is authoritative and preserves existing valid canonical trackers", () => {
    const v3Backup = {
      version: "3.0",
      schemaVersion: 3,
      trackers: [
        {
          id: "canonical-habit-1",
          name: "Study",
          category: "Personal Goal",
          modality: "daily_habit",
          target: { rule: "at_least", minimum: 2 },
          startDate: "2026-10-01",
          records: {
            "2026-10-05": { status: "completed", value: 3 },
          },
        },
      ],
    };

    const res = resolveBackupPayload(v3Backup);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 1);
    assert.equal(res.trackers[0].id, "canonical-habit-1");
    assert.equal(res.trackers[0].records["2026-10-05"].value, 3);
  });

  test("Explicitly empty canonical v3 backup (trackers: []) is authoritative and will not resurrect deleted trackers from legacy keys", () => {
    const v3EmptyBackup = {
      version: "3.0",
      schemaVersion: 3,
      trackers: [],
      // Stale legacy projections:
      seshData: { "2026-10-01": 5 },
      weedData: { "2026-10-01": 3 },
    };

    const res = resolveBackupPayload(v3EmptyBackup);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 0); // Must remain empty!
  });

  test("Malformed canonical v3 backup returns error and refuses to silently fall back to stale legacy data", () => {
    const malformedV3 = {
      version: "3.0",
      schemaVersion: 3,
      trackers: [
        {
          id: "corrupted",
          // missing name!
          category: "Personal Goal",
          modality: "daily_habit",
          startDate: "2026-10-01",
          records: {},
        },
      ],
      // Stale legacy data:
      weedData: { "2026-10-01": 0 },
    };

    const res = resolveBackupPayload(malformedV3);
    assert.equal(res.success, false);
    assert.equal(res.trackers.length, 0);
    assert.ok(res.issues.some((i) => i.message.includes("Tracker 'name' must be a non-empty string")));
  });
});

describe("Unified Migration - Suite 6: Deep Data Integrity and Input Immutability", () => {
  test("Deep field-by-field verification succeeds on complete multi-tracker payload", () => {
    const completeLegacy = {
      trackers: [
        {
          id: "sober-1",
          name: "Sobriety",
          category: "Substance Sobriety",
          modality: "abstinence",
          startDate: "2026-08-01",
          checkIns: {
            "2026-08-01": true,
            "2026-08-02": true,
            "2026-08-03": false,
          },
          notes: {
            "2026-08-01": "Day 1 feeling hopeful",
            "2026-08-03": "Did not check in but writing down thoughts",
          },
        },
        {
          id: "habit-2",
          name: "Pushups",
          category: "Physical Health",
          modality: "daily_habit",
          startDate: "2026-08-01",
          checkIns: {
            "2026-08-01": true,
          },
          notes: {},
        },
      ],
      seshData: {
        "2026-08-01": 0,
        "2026-08-02": 2,
      },
      weedData: {
        "2026-08-01": 0,
      },
      pornData: {
        "2026-08-01": 1,
      },
      pornNotes: "Evening reflection on urge triggers",
    };

    const inputSnapshot = JSON.stringify(completeLegacy);
    const result = migrateLegacyData(completeLegacy);

    // Verify input was not mutated
    assert.equal(JSON.stringify(completeLegacy), inputSnapshot);

    // Run deep validation
    const integrity = validateMigrationIntegrity(completeLegacy, result);
    assert.equal(integrity.valid, true);
    assert.deepEqual(integrity.errors, []);
  });

  test("validateCanonicalTracker catches missing fields, bad dates, and invalid modalities", () => {
    assert.equal(validateCanonicalTracker(null).valid, false);
    assert.equal(validateCanonicalTracker({}).valid, false);

    const validTracker = {
      id: "t-1",
      name: "Habit",
      category: "Personal Goal",
      modality: "daily_habit",
      target: { rule: "at_least", minimum: 1 },
      startDate: "2026-10-01",
      records: {
        "2026-10-02": { status: "completed" },
      },
    };
    assert.equal(validateCanonicalTracker(validTracker).valid, true);

    const badDate = { ...validTracker, startDate: "2026-02-30" };
    assert.equal(validateCanonicalTracker(badDate).valid, false);

    const badModality = { ...validTracker, modality: "unknown_modality" };
    assert.equal(validateCanonicalTracker(badModality).valid, false);
  });
});

describe("Unified Migration - Suite 7: Part A Regression Tests for Data Preservation", () => {
  test("Frequency boolean check-in without note preserves rawLegacyCheckIn without fabricating notes or numbers", () => {
    const legacy = {
      trackers: [
        {
          id: "freq-checkin",
          name: "Coffee Moderation",
          category: "Physical Health",
          modality: "moderation",
          limitVal: 2,
          startDate: "2026-10-01",
          checkIns: {
            "2026-10-02": true, // Boolean check-in with NO note!
          },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];
    assert.equal(t.modality, "frequency");

    // Must preserve the check-in record without fabricating a count or note
    const rec = t.records["2026-10-02"];
    assert.ok(rec, "Record on 2026-10-02 must exist");
    assert.equal(rec.rawLegacyCheckIn, true);
    assert.equal(rec.status, undefined);
    assert.equal(rec.value, undefined);
    assert.equal(rec.note, undefined);

    // Calculations must treat it as unresolved/unlogged rather than corrupting metrics
    const evalResult = evaluateDayRecord(t, "2026-10-02");
    assert.equal(evalResult.isLogged, false);
    assert.equal(evalResult.isValid, true);
    assert.equal(evalResult.isSuccess, false);
  });

  test("Legacy tracker named 'General' with active check-ins is preserved as 'General (Tracker)' with warning", () => {
    const legacy = {
      trackers: [
        {
          id: "user-general-goal",
          name: "General",
          category: "Personal Goal",
          modality: "daily_habit",
          startDate: "2026-10-01",
          checkIns: {
            "2026-10-02": true,
          },
          notes: {
            "2026-10-02": "Stayed active",
          },
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 1);
    assert.equal(res.trackers[0].name, "General (Tracker)");
    assert.equal(res.trackers[0].records["2026-10-02"].status, "completed");
    assert.equal(res.trackers[0].records["2026-10-02"].note, "Stayed active");
    assert.ok(res.issues.some((i) => i.message.includes('preserved as "General (Tracker)"')));
  });

  test("Legacy tracker named 'General' with only notes transfers notes into general journal reflections", () => {
    const legacy = {
      trackers: [
        {
          id: "pseudo-general",
          name: "General",
          category: "Substance Sobriety",
          checkIns: {},
          notes: {
            "2026-10-01": "An evening walk reflection",
            "2026-10-02": "Reflecting on gratitude",
          },
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    assert.equal(res.trackers.length, 0); // Not created as a recovery tracker
    assert.ok(res.transferredJournalNotes);
    assert.equal(res.transferredJournalNotes["2026-10-01"], "An evening walk reflection");
    assert.equal(res.transferredJournalNotes["2026-10-02"], "Reflecting on gratitude");
    assert.ok(res.issues.some((i) => i.message.includes("transferred its notes into general journal reflections")));
  });

  test("Ambiguous modality preserves legacyMetadata indicating inferred status and original metadata", () => {
    const legacy = {
      trackers: [
        {
          id: "t-ambig",
          name: "Mindfulness",
          category: "Emotional & Mental",
          // modality is missing!
          startDate: "2026-10-01",
          checkIns: { "2026-10-02": true },
          notes: {},
        },
      ],
    };

    const res = migrateLegacyData(legacy);
    assert.equal(res.success, true);
    const t = res.trackers[0];
    assert.equal(t.modality, "daily_habit");
    assert.ok(t.legacyMetadata);
    assert.equal(t.legacyMetadata.isInferredModality, true);
    assert.equal(t.legacyMetadata.requiresReview, true);
    assert.equal(t.legacyMetadata.originalCategory, "Emotional & Mental");
    assert.equal(t.legacyMetadata.originalModality, undefined);
  });
});

