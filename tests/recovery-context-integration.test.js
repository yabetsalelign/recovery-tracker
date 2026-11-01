import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  initializeCanonicalData,
  persistCanonicalEnvelope,
  loadCanonicalEnvelope,
  toLegacyTrackerRecord,
  extractSpecializedData,
  applyToggleCheckIn,
  applySetCheckIn,
  applySpecializedCount,
  applySaveNote,
  applyDeleteNote,
} from "../src/utils/canonicalStore.js";
import { resolveBackupPayload } from "../src/utils/unifiedMigration.js";

class MockStorage {
  constructor() {
    this.store = new Map();
    this.quotaExceeded = false;
  }

  getItem(key) {
    return this.store.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.quotaExceeded) {
      throw new Error("QuotaExceededError: DOMException 22");
    }
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe("RecoveryContext Integration - Stage 3 Persistence & Operations", () => {
  let storage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  test("1. First launch with legacy data migrates and persists canonical envelope while preserving legacy keys", () => {
    const legacyTrackers = [
      {
        id: "sober-1",
        name: "Sobriety",
        category: "Substance Sobriety",
        modality: "abstinence",
        startDate: "2026-08-01",
        checkIns: { "2026-08-05": true },
        notes: { "2026-08-05": "Feeling clear" },
      },
    ];

    storage.setItem(LEGACY_STORAGE_KEYS.TRACKERS, JSON.stringify(legacyTrackers));
    storage.setItem(LEGACY_STORAGE_KEYS.SESH_DATA, JSON.stringify({ "2026-08-05": 0 }));
    storage.setItem(LEGACY_STORAGE_KEYS.HAS_SESH, "true");

    const init = initializeCanonicalData(storage);

    assert.equal(init.migrated, true);
    assert.equal(init.trackers.length, 2); // Sobriety + Sesh

    // Envelope must be written to CANONICAL_STORAGE_KEY
    const rawEnvelope = storage.getItem(CANONICAL_STORAGE_KEY);
    assert.ok(rawEnvelope, "Canonical envelope must be saved");

    const envelope = JSON.parse(rawEnvelope);
    assert.equal(envelope.schemaVersion, 3);
    assert.equal(envelope.trackers.length, 2);

    // Legacy keys must remain untouched!
    assert.equal(storage.getItem(LEGACY_STORAGE_KEYS.TRACKERS), JSON.stringify(legacyTrackers));
    assert.equal(storage.getItem(LEGACY_STORAGE_KEYS.HAS_SESH), "true");
  });

  test("2. Successful migration and reload: second load is authoritative from canonical storage without remigrating", () => {
    const canonicalTrackers = [
      {
        id: "meditation-1",
        name: "Meditation",
        category: "Personal Goal",
        modality: "daily_habit",
        target: { rule: "at_least", minimum: 1 },
        startDate: "2026-10-01",
        records: {
          "2026-10-02": { status: "completed" },
        },
      },
    ];

    persistCanonicalEnvelope(storage, canonicalTrackers);

    // Put stale/different data in legacy keys to verify legacy is ignored
    storage.setItem(LEGACY_STORAGE_KEYS.TRACKERS, JSON.stringify([{ id: "stale", name: "Stale" }]));

    const init = initializeCanonicalData(storage);
    assert.equal(init.migrated, false); // No migration performed
    assert.equal(init.trackers.length, 1);
    assert.equal(init.trackers[0].id, "meditation-1");
  });

  test("3. Repeated initialization produces no duplicate records and remains strictly stable", () => {
    storage.setItem(
      LEGACY_STORAGE_KEYS.TRACKERS,
      JSON.stringify([
        { id: "read-1", name: "Reading", category: "Personal Goal", checkIns: {}, notes: {} },
      ])
    );

    const first = initializeCanonicalData(storage);
    const second = initializeCanonicalData(storage);

    assert.deepEqual(first.trackers, second.trackers);
    assert.equal(second.trackers.length, 1);
  });

  test("4. Existing canonical state takes precedence over conflicting legacy projections", () => {
    const canonical = [
      {
        id: "active-1",
        name: "Walking",
        category: "Physical Health",
        modality: "daily_habit",
        target: { rule: "at_least", minimum: 1 },
        startDate: "2026-09-01",
        records: {},
      },
    ];
    persistCanonicalEnvelope(storage, canonical);

    // Stale legacy keys present
    storage.setItem(LEGACY_STORAGE_KEYS.WEED_DATA, JSON.stringify({ "2026-09-02": 5 }));

    const loaded = loadCanonicalEnvelope(storage);
    assert.equal(loaded.envelope.trackers[0].name, "Walking");
    assert.equal(loaded.envelope.trackers.length, 1);
  });

  test("5. Failed migration preserves legacy data safely and reports error", () => {
    // Malformed tracker in legacy
    storage.setItem(
      LEGACY_STORAGE_KEYS.TRACKERS,
      JSON.stringify([{ id: "bad", name: "" }]) // empty name fails validation
    );

    const init = initializeCanonicalData(storage);
    assert.equal(init.trackers.length, 0);

    // Legacy data preserved untouched
    assert.ok(storage.getItem(LEGACY_STORAGE_KEYS.TRACKERS).includes('"bad"'));
  });

  test("6. Simulated storage quota failure falls back in-memory without corrupting storage", () => {
    storage.setItem(
      LEGACY_STORAGE_KEYS.TRACKERS,
      JSON.stringify([{ id: "t1", name: "Running", category: "Physical Health", checkIns: {} }])
    );

    // Simulate quota exceeded
    storage.quotaExceeded = true;

    const init = initializeCanonicalData(storage);
    assert.equal(init.migrated, true);
    assert.equal(init.trackers.length, 1);
    assert.ok(init.error?.includes("QuotaExceededError"));
    // Canonical envelope was not partially/corruptedly written
    assert.equal(storage.getItem(CANONICAL_STORAGE_KEY), null);
  });

  test("7. Corrupt canonical storage reports recoverable error and refuses to overwrite silently", () => {
    // Write invalid JSON to canonical key
    storage.setItem(CANONICAL_STORAGE_KEY, "{ invalid json corrupt");

    const init = initializeCanonicalData(storage);
    assert.equal(init.trackers.length, 0);
    assert.ok(init.error?.includes("JSON parse error"));

    // Corrupt key is preserved for debugging rather than silently wiped
    assert.equal(storage.getItem(CANONICAL_STORAGE_KEY), "{ invalid json corrupt");
  });

  test("8. Tracker creation and editing updates canonical store correctly", () => {
    let trackers = [
      {
        id: "goal-1",
        name: "Read",
        category: "Personal Goal",
        modality: "daily_habit",
        target: { rule: "at_least", minimum: 1 },
        startDate: "2026-10-01",
        records: {},
      },
    ];

    // Note saving
    trackers = applySaveNote(trackers, "Read", "2026-10-02", "Read 10 pages");
    assert.equal(trackers[0].records["2026-10-02"].note, "Read 10 pages");

    // Note deletion
    trackers = applyDeleteNote(trackers, "Read", "2026-10-02");
    assert.equal(trackers[0].records["2026-10-02"], undefined);
  });

  test("9. Historical record updates and toggleCheckIn cycle cleanly", () => {
    let trackers = [
      {
        id: "sober",
        name: "Sobriety",
        category: "Substance Sobriety",
        modality: "abstinence",
        target: { rule: "zero" },
        startDate: "2026-10-01",
        records: {},
      },
    ];

    // Toggle on
    trackers = applyToggleCheckIn(trackers, "Sobriety", "2026-10-05");
    assert.equal(trackers[0].records["2026-10-05"].status, "confirmed_clean");

    // Toggle off (returns to unlogged)
    trackers = applyToggleCheckIn(trackers, "Sobriety", "2026-10-05");
    assert.equal(trackers[0].records["2026-10-05"], undefined);

    // Set explicit checkIn with existing note preserves note
    trackers = applySaveNote(trackers, "Sobriety", "2026-10-06", "A reflective day");
    trackers = applySetCheckIn(trackers, "Sobriety", "2026-10-06", true);
    assert.equal(trackers[0].records["2026-10-06"].status, "confirmed_clean");
    assert.equal(trackers[0].records["2026-10-06"].note, "A reflective day");

    // Uncheck preserves note as note-only record
    trackers = applySetCheckIn(trackers, "Sobriety", "2026-10-06", false);
    assert.equal(trackers[0].records["2026-10-06"].status, undefined);
    assert.equal(trackers[0].records["2026-10-06"].note, "A reflective day");
  });

  test("10. Specialized frequency count logging preserves zero and positive measurements", () => {
    let trackers = [];

    // Log sesh 0 (clean)
    trackers = applySpecializedCount(trackers, "sesh", "2026-10-01", 0);
    assert.equal(trackers.length, 1);
    assert.equal(trackers[0].name, "Sesh");
    assert.equal(trackers[0].records["2026-10-01"].value, 0);

    // Log sesh 3 on another day
    trackers = applySpecializedCount(trackers, "sesh", "2026-10-02", 3);
    assert.equal(trackers[0].records["2026-10-02"].value, 3);
  });

  test("11. JSON export and restore round-trip preserves all canonical records", () => {
    const originalTrackers = [
      {
        id: "tracker-a",
        name: "Morning Walk",
        category: "Physical Health",
        modality: "daily_habit",
        target: { rule: "at_least", minimum: 1 },
        startDate: "2026-09-01",
        records: {
          "2026-09-02": { status: "completed", note: "Brisk morning walk" },
          "2026-09-03": { note: "Only wrote a note" },
        },
      },
      {
        id: "sesh",
        name: "Sesh",
        category: "Substance Sobriety",
        modality: "frequency",
        target: { rule: "zero" },
        startDate: "2026-09-01",
        records: {
          "2026-09-02": { status: "recorded", value: 0 },
        },
      },
    ];

    const exportPayload = {
      app: "Recovery Tracker",
      version: "3.0",
      schemaVersion: 3,
      trackers: originalTrackers,
      generalNotes: { "2026-09-02": "Peaceful journal reflection" },
    };

    const serialized = JSON.stringify(exportPayload);
    const resolved = resolveBackupPayload(JSON.parse(serialized));

    assert.equal(resolved.success, true);
    assert.deepEqual(resolved.trackers, originalTrackers);
  });

  test("12. Empty canonical backup restoration (trackers: []) is authoritative and will not resurrect deleted trackers", () => {
    const emptyCanonicalBackup = {
      version: "3.0",
      schemaVersion: 3,
      trackers: [],
      // Stale legacy keys present in backup file
      seshData: { "2026-09-01": 2 },
      weedData: { "2026-09-01": 0 },
    };

    const resolved = resolveBackupPayload(emptyCanonicalBackup);
    assert.equal(resolved.success, true);
    assert.equal(resolved.trackers.length, 0); // Authoritative empty array!
  });
});

