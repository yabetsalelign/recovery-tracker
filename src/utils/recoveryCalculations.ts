import { format, subDays } from "date-fns";
import type {
  CheckInsMap,
  EmotionalWeatherMap,
  GeneralNotesMap,
  SpecializedTrackerData,
  TrackerRecord,
} from "../types";

/**
 * Mathematically rigorous consecutive calendar-day streak calculation.
 *
 * Rules:
 * - Checks day T, T-1, T-2... backwards day-by-day.
 * - Missing days (not checked in) immediately break the streak.
 * - If today is checked in, streak starts from today.
 * - If today is NOT yet checked in, but yesterday was, streak starts from yesterday (grace period for current day).
 * - If neither today nor yesterday was checked in, streak is 0.
 */
export const calculateConsecutiveStreak = (
  checkIns: CheckInsMap | null | undefined = {},
  referenceDate: Date = new Date()
): number => {
  if (!checkIns || typeof checkIns !== "object") return 0;

  const todayStr = format(referenceDate, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(referenceDate, 1), "yyyy-MM-dd");

  const todayChecked = Boolean(checkIns[todayStr]);
  const yesterdayChecked = Boolean(checkIns[yesterdayStr]);

  if (!todayChecked && !yesterdayChecked) {
    return 0;
  }

  let streak = 0;
  let currentDate = todayChecked ? referenceDate : subDays(referenceDate, 1);

  while (true) {
    const dStr = format(currentDate, "yyyy-MM-dd");
    if (checkIns[dStr]) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Historical longest streak across all check-in dates.
 */
export const calculateLongestConsecutiveStreak = (
  checkIns: CheckInsMap | null | undefined = {}
): number => {
  if (!checkIns || typeof checkIns !== "object") return 0;

  const dates = Object.keys(checkIns)
    .filter((d) => checkIns[d] && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort(); // Chronological ascending

  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const expectedPrev = format(
      subDays(new Date(dates[i] + "T00:00:00"), 1),
      "yyyy-MM-dd"
    );

    if (dates[i - 1] === expectedPrev) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

/**
 * Consecutive zero-days streak for specialized trackers (where count === 0 indicates clean/pause day).
 * Grace period (starting from yesterday) applies only if today is unrecorded (undefined or null).
 * If today has recorded usage > 0, streak is reset to 0.
 */
export const calculateSpecializedZeroStreak = (
  dataObj: SpecializedTrackerData | null | undefined = {},
  referenceDate: Date = new Date()
): number => {
  if (!dataObj || typeof dataObj !== "object") return 0;

  const todayStr = format(referenceDate, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(referenceDate, 1), "yyyy-MM-dd");

  const todayVal = dataObj[todayStr];
  const yesterdayVal = dataObj[yesterdayStr];

  // If today has recorded usage > 0, streak is broken
  if (todayVal !== undefined && todayVal !== null && todayVal > 0) {
    return 0;
  }

  const todayClean = todayVal === 0;
  const yesterdayClean = yesterdayVal === 0;

  if (!todayClean && !yesterdayClean) {
    return 0;
  }

  let streak = 0;
  let currentDate = todayClean ? referenceDate : subDays(referenceDate, 1);

  while (true) {
    const dStr = format(currentDate, "yyyy-MM-dd");
    if (dataObj[dStr] === 0) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * RFC 4180 CSV value escaper
 */
export const escapeCsvValue = (str: unknown): string => {
  if (str === null || str === undefined) return '""';
  const s = String(str).replace(/"/g, '""');
  return `"${s}"`;
};

export const buildRecoveryCsv = ({
  trackers,
  generalNotes,
  emotionalWeather,
  seshData,
  weedData,
  pornData,
  pornNotes,
}: {
  trackers: TrackerRecord[];
  generalNotes: GeneralNotesMap;
  emotionalWeather: EmotionalWeatherMap;
  seshData: SpecializedTrackerData;
  weedData: SpecializedTrackerData;
  pornData: SpecializedTrackerData;
  pornNotes: string;
}): string => {
  const rows = [
    ["Record Type", "Date", "Tracker", "Status", "Note", "Mood", "Count"]
      .map(escapeCsvValue)
      .join(","),
  ];
  const addRow = (values: unknown[]) => rows.push(values.map(escapeCsvValue).join(","));

  trackers.forEach((tracker) => {
    const dates = new Set([
      ...Object.keys(tracker.checkIns || {}),
      ...Object.keys(tracker.notes || {}),
    ]);
    dates.forEach((date) => {
      addRow([
        "Goal",
        date,
        tracker.name,
        tracker.checkIns?.[date] ? "Checked" : "Unchecked",
        tracker.notes?.[date] || "",
        "",
        "",
      ]);
    });
  });

  Object.entries(generalNotes).forEach(([date, note]) => {
    addRow(["Journal", date, "General Reflection", "", note, "", ""]);
  });

  Object.entries(emotionalWeather).forEach(([date, entry]) => {
    addRow(["Emotional weather", date, "", entry.checkedIn ? "Submitted" : "", entry.note, entry.mood, ""]);
  });

  ([
    ["Sesh", seshData],
    ["Weed", weedData],
    ["Porn", pornData],
  ] as const).forEach(([name, data]) => {
    Object.entries(data).forEach(([date, count]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof count !== "number") return;
      addRow(["Specialized tracker", date, name, "", "", "", count]);
    });
  });

  if (pornNotes) {
    addRow(["Specialized note", "", "Porn", "", pornNotes, "", ""]);
  }

  return rows.join("\n");
};
