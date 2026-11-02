import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateConsecutiveStreak,
  calculateLongestConsecutiveStreak,
  calculateSpecializedZeroStreak,
  escapeCsvValue,
  buildRecoveryCsv,
} from "../src/utils/recoveryCalculations.js";
import { resolveInitialTheme } from "../src/utils/themePreferences.ts";
import { getActiveNavigationLabel, primaryNavigationItems } from "../src/utils/navigation.ts";

const getDarkThemeTokens = () => {
  const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
  const darkTheme = css.match(/html\.dark\s*\{([^}]+)\}/)?.[1];
  assert.ok(darkTheme, "Dark theme tokens should be defined");

  return Object.fromEntries(
    [...darkTheme.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map(([, token, color]) => [token, color])
  );
};

const relativeLuminance = (color) => {
  const channels = color.match(/[\da-f]{2}/gi).map((channel) => parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground, background) => {
  const luminance = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (luminance[0] + 0.05) / (luminance[1] + 0.05);
};

describe("Workflow J: Theme preference initialization", () => {
  test("An explicit saved preference takes precedence over the system theme", () => {
    assert.equal(resolveInitialTheme("light", true), "light");
    assert.equal(resolveInitialTheme("dark", false), "dark");
  });

  test("First-time users inherit their system preference", () => {
    assert.equal(resolveInitialTheme(null, true), "dark");
    assert.equal(resolveInitialTheme(null, false), "light");
  });

  test("Dark theme text and primary action colors meet WCAG AA contrast", () => {
    const tokens = getDarkThemeTokens();
    const card = tokens["--surface-card"];

    for (const token of ["--text-primary", "--text-secondary", "--text-muted", "--text-subtle", "--accent-primary"]) {
      assert.ok(contrastRatio(tokens[token], card) >= 4.5, `${token} must meet 4.5:1 contrast on cards`);
    }

    assert.ok(
      contrastRatio(tokens["--accent-foreground"], tokens["--accent-primary"]) >= 4.5,
      "Primary action text must meet 4.5:1 contrast on the primary accent"
    );
  });
});

describe("Interface refinements", () => {
  test("Nested tracker routes activate their progress parent without prefix collisions", () => {
    assert.equal(getActiveNavigationLabel("/sesh"), "Progress");
    assert.equal(getActiveNavigationLabel("/day"), "Calendar");
    assert.equal(getActiveNavigationLabel("/notes"), "Journal");
    assert.equal(getActiveNavigationLabel("/settings"), "Settings");
    assert.equal(getActiveNavigationLabel("/sesh-archive"), undefined);
  });

  test("Primary navigation exposes one Settings destination", () => {
    assert.equal(primaryNavigationItems.filter((item) => item.label === "Settings").length, 1);
    assert.equal(primaryNavigationItems.some((item) => item.label === "Goals"), false);
  });

  test("Journal date and writing controls precede the collapsible mobile archive", () => {
    const notes = readFileSync(new URL("../src/Notes.tsx", import.meta.url), "utf8");
    const editorIndex = notes.indexOf('aria-label="Journal entry"');
    const archiveIndex = notes.indexOf('className="lg:hidden rounded-2xl');

    assert.ok(notes.includes('id="journal-date"'));
    assert.ok(notes.includes('type="date"'));
    assert.ok(notes.includes('type="search"'));
    assert.ok(editorIndex >= 0 && archiveIndex > editorIndex);
    assert.ok(notes.includes("Unsaved edits"));
  });

  test("Progress keeps a 21-day timeline with sparse labels and accessible modality summaries", () => {
    const progress = readFileSync(new URL("../src/Progress.tsx", import.meta.url), "utf8");

    assert.ok(progress.includes("start: subDays(new Date(), 20)"));
    assert.ok(progress.includes("index === 0 || index === 20 || (index + 1) % 5 === 0"));
    assert.ok(progress.includes("By tracker"));
    assert.ok(progress.includes("Unlogged days are not failures"));
  });

  test("Goal creation uses one consistent add action", () => {
    const goals = readFileSync(new URL("../src/AddAddiction.tsx", import.meta.url), "utf8");

    assert.ok(goals.includes("<span>Add a tracker</span>"));
    assert.ok(goals.includes("Manage trackers"));
    assert.ok(goals.includes('"frequency"'));
    assert.ok(!goals.includes("New Target"));
    assert.ok(!goals.includes("Create New Target or Boundary"));
  });
});

describe("Workflow E & Reliability: Consecutive Streak Calculations", () => {
  const refDate = new Date("2026-10-26T12:00:00");
  const todayStr = "2026-10-26";
  const yesterdayStr = "2026-10-25";
  const twoDaysAgoStr = "2026-10-24";
  const threeDaysAgoStr = "2026-10-23";
  const tenDaysAgoStr = "2026-10-16";

  test("Empty check-ins return 0", () => {
    assert.equal(calculateConsecutiveStreak({}, refDate), 0);
    assert.equal(calculateConsecutiveStreak(null, refDate), 0);
  });

  test("Only today checked in returns 1", () => {
    assert.equal(calculateConsecutiveStreak({ [todayStr]: true }, refDate), 1);
  });

  test("Today not checked in, but yesterday checked in gives grace period streak of 1", () => {
    assert.equal(calculateConsecutiveStreak({ [yesterdayStr]: true }, refDate), 1);
  });

  test("Neither today nor yesterday checked in returns 0 even if historical dates are checked", () => {
    assert.equal(
      calculateConsecutiveStreak(
        {
          [twoDaysAgoStr]: true,
          [threeDaysAgoStr]: true,
        },
        refDate
      ),
      0
    );
  });

  test("Consecutive check-ins starting from today return full streak", () => {
    assert.equal(
      calculateConsecutiveStreak(
        {
          [todayStr]: true,
          [yesterdayStr]: true,
          [twoDaysAgoStr]: true,
          [threeDaysAgoStr]: true,
        },
        refDate
      ),
      4
    );
  });

  test("Consecutive check-ins ending at yesterday return full streak without today", () => {
    assert.equal(
      calculateConsecutiveStreak(
        {
          [yesterdayStr]: true,
          [twoDaysAgoStr]: true,
          [threeDaysAgoStr]: true,
        },
        refDate
      ),
      3
    );
  });

  test("Gaps in check-ins immediately terminate streak (Regression Check for Non-Contiguous Keys)", () => {
    // User checked today and 10 days ago (missing days in between)
    // The previous bug sorted keys and returned 2. Now it must return 1!
    assert.equal(
      calculateConsecutiveStreak(
        {
          [todayStr]: true,
          [tenDaysAgoStr]: true,
        },
        refDate
      ),
      1
    );
  });

  test("Month boundaries and leap years calculate accurately without timezone skew", () => {
    const leapRef = new Date("2024-03-02T10:00:00");
    const checkIns = {
      "2024-03-02": true,
      "2024-03-01": true,
      "2024-02-29": true, // Leap day
      "2024-02-28": true,
    };
    assert.equal(calculateConsecutiveStreak(checkIns, leapRef), 4);
  });
});

describe("Workflow E: Historical Longest Streak", () => {
  test("Calculates maximum contiguous sequence accurately", () => {
    const checkIns = {
      "2026-01-01": true,
      "2026-01-02": true,
      "2026-01-03": true, // 3-day run
      "2026-01-05": true,
      "2026-01-06": true,
      "2026-01-07": true,
      "2026-01-08": true,
      "2026-01-09": true, // 5-day run
      "2026-01-12": true, // isolated
    };
    assert.equal(calculateLongestConsecutiveStreak(checkIns), 5);
  });

  test("Returns 0 for empty or null", () => {
    assert.equal(calculateLongestConsecutiveStreak({}), 0);
    assert.equal(calculateLongestConsecutiveStreak(null), 0);
  });
});

describe("Workflow F: Specialized Trackers Consecutive Zero-Days Streak", () => {
  const refDate = new Date("2026-10-26T12:00:00");
  const todayStr = "2026-10-26";
  const yesterdayStr = "2026-10-25";
  const twoDaysAgoStr = "2026-10-24";

  test("Consecutive 0 counts return clean day streak", () => {
    const data = {
      [todayStr]: 0,
      [yesterdayStr]: 0,
      [twoDaysAgoStr]: 0,
    };
    assert.equal(calculateSpecializedZeroStreak(data, refDate), 3);
  });

  test("Non-zero usage resets streak immediately", () => {
    const data = {
      [todayStr]: 2, // Used today
      [yesterdayStr]: 0,
      [twoDaysAgoStr]: 0,
    };
    assert.equal(calculateSpecializedZeroStreak(data, refDate), 0);
  });

  test("Missing day between zero counts stops streak", () => {
    const data = {
      [todayStr]: 0,
      "2026-10-20": 0, // Gap of 5 days
    };
    assert.equal(calculateSpecializedZeroStreak(data, refDate), 1);
  });
});

describe("Workflow D: Journal & 'General' Note Isolation Regression Check", () => {
  test("Saving 'General' reflection must never create a recovery goal in addictions", () => {
    // Mock simulation of RecoveryContext behavior
    const addictions = ["Sobriety", "Exercise"];
    const generalNotes = {};
    const trackers = [
      { id: 1, name: "Sobriety", checkIns: {}, notes: {} },
      { id: 2, name: "Exercise", checkIns: {}, notes: {} },
    ];

    const saveNote = (habit, date, text) => {
      if (habit.toLowerCase() === "general") {
        generalNotes[date] = text;
        // MUST NOT touch addictions or trackers!
      } else {
        const t = trackers.find((tr) => tr.name.toLowerCase() === habit.toLowerCase());
        if (t) t.notes[date] = text;
      }
    };

    saveNote("General", "2026-10-26", "A calm morning walk.");

    assert.equal(generalNotes["2026-10-26"], "A calm morning walk.");
    assert.equal(addictions.includes("General"), false);
    assert.equal(addictions.includes("general"), false);
    assert.equal(trackers.some((t) => t.name.toLowerCase() === "general"), false);
    assert.equal(trackers.length, 2);
  });
});

describe("Workflow H: Backup Import Validation and Safety", () => {
  const validateImport = (content) => {
    if (typeof content !== "string" || !content.trim()) {
      return { success: false, error: "Empty or invalid file content." };
    }
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { success: false, error: "Root must be a valid JSON object." };
      }
      if (parsed.trackers !== undefined) {
        if (!Array.isArray(parsed.trackers)) {
          return { success: false, error: "Invalid backup: 'trackers' must be an array." };
        }
        for (const t of parsed.trackers) {
          if (!t || typeof t !== "object" || typeof t.name !== "string" || !t.name.trim()) {
            return { success: false, error: "Invalid backup: Each tracker must have a valid name." };
          }
          if (t.checkIns !== undefined && (typeof t.checkIns !== "object" || Array.isArray(t.checkIns))) {
            return { success: false, error: `Invalid backup: Tracker "${t.name}" checkIns must be an object.` };
          }
        }
      }
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  test("Rejects malformed JSON syntax", () => {
    const res = validateImport("{ invalid json ::: ");
    assert.equal(res.success, false);
  });

  test("Rejects array root", () => {
    const res = validateImport("[1, 2, 3]");
    assert.equal(res.success, false);
  });

  test("Rejects trackers when not an array", () => {
    const res = validateImport(JSON.stringify({ trackers: "invalid" }));
    assert.equal(res.success, false);
  });

  test("Rejects trackers containing records without a name", () => {
    const res = validateImport(JSON.stringify({ trackers: [{ id: 1 }] }));
    assert.equal(res.success, false);
  });

  test("Rejects tracker when checkIns is an array instead of object", () => {
    const res = validateImport(JSON.stringify({ trackers: [{ name: "Alcohol", checkIns: [] }] }));
    assert.equal(res.success, false);
  });

  test("Accepts complete valid recovery backup", () => {
    const valid = {
      app: "Recovery Tracker",
      version: "2.0",
      userName: "Alex",
      trackers: [
        {
          id: 1,
          name: "Sobriety",
          checkIns: { "2026-10-25": true, "2026-10-26": true },
          notes: { "2026-10-26": "Feeling grounded" },
        },
      ],
      generalNotes: { "2026-10-26": "Deep reflection" },
      seshData: { "2026-10-26": 0 },
    };
    const res = validateImport(JSON.stringify(valid));
    assert.equal(res.success, true);
    assert.equal(res.data.userName, "Alex");
  });
});

describe("Workflow H: RFC 4180 CSV Escaping", () => {
  test("Correctly escapes quotes and commas", () => {
    const note = 'Reflected: "Today was quiet, peaceful."';
    const escaped = escapeCsvValue(note);
    assert.equal(escaped, '"Reflected: ""Today was quiet, peaceful."""');
  });

  describe("Workflow I: Complete recovery CSV export", () => {
    test("Includes emotional weather and specialized tracker records alongside goals and journal notes", () => {
      const csv = buildRecoveryCsv({
        trackers: [
          {
            name: "Evening pause",
            checkIns: { "2026-10-26": true },
            notes: { "2026-10-26": "A calmer evening" },
          },
        ],
        generalNotes: { "2026-10-25": "A quiet walk" },
        emotionalWeather: {
          "2026-10-26": { mood: "grounded", note: "Felt steady", checkedIn: true },
        },
        seshData: { "2026-10-24": 2 },
        weedData: { "2026-10-23": 0 },
        pornData: { "2026-10-22": 1, notes: "legacy value" },
        pornNotes: "Late-night trigger",
      });

      assert.match(csv, /"Emotional weather","2026-10-26"/);
      assert.match(csv, /"grounded"/);
      assert.match(csv, /"Sesh".*"2"/);
      assert.match(csv, /"Weed".*"0"/);
      assert.match(csv, /"Porn".*"1"/);
      assert.match(csv, /"Specialized note".*"Late-night trigger"/);
      assert.doesNotMatch(csv, /"Specialized tracker","notes"/);
      assert.match(csv, /"Evening pause".*"A calmer evening"/);
      assert.match(csv, /"General Reflection".*"A quiet walk"/);
    });
  });

  test("Preserves newlines inside quotes", () => {
    const note = "Line 1\nLine 2";
    const escaped = escapeCsvValue(note);
    assert.equal(escaped, '"Line 1\nLine 2"');
  });
});
