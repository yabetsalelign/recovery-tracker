import React, { useState, useMemo } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
  const {
    trackers,
    calculateStreak,
    calculateLongestStreak,
    exportCSV,
  } = useRecovery();

  const [timeHorizon, setTimeHorizon] = useState<string>("30"); // "7" | "30" | "90" | "all"

  const getDisplayName = (name: string): string => {
    if (discreetMode) {
      const lower = (name || "").toLowerCase();
      if (lower === "sesh") return "Habit S";
      if (lower === "weed") return "Habit W";
      if (lower === "porn") return "Habit P";
      return name ? name.slice(0, 1).toUpperCase() + " Tracker" : "Habit Tracker";
    }
    return name;
  };

  const getHabitIcon = (name: string): string => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("alcohol") || lower.includes("drink") || lower.includes("sobriety")) return "water_drop";
    if (lower.includes("sesh") || lower.includes("smoke") || lower.includes("nicotine")) return "air";
    if (lower.includes("weed") || lower.includes("cannabis")) return "nature";
    if (lower.includes("porn") || lower.includes("screen") || lower.includes("curfew")) return "bedtime";
    return "spa";
  };

  // Horizon days calculation
  const horizonNum = timeHorizon === "all" ? 90 : parseInt(timeHorizon, 10) || 30;

  const { presenceDays, consistencyPct, depthPct, longestStreak } = useMemo(() => {
    const daysInHorizon = eachDayOfInterval({
      start: subDays(new Date(), horizonNum - 1),
      end: new Date(),
    });

    let pDays = 0;
    const totalPossibleChecks = horizonNum * Math.max(1, trackers.length);
    let totalActualChecks = 0;

    daysInHorizon.forEach((dateObj) => {
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const anyChecked = trackers.some((t) => t.checkIns?.[dateStr]);
      if (anyChecked) pDays++;
      trackers.forEach((t) => {
        if (t.checkIns?.[dateStr]) totalActualChecks++;
      });
    });

    const cPct = Math.round((pDays / horizonNum) * 100) || 0;
    const dPct = trackers.length > 0 ? Math.round((totalActualChecks / totalPossibleChecks) * 100) : 0;

    // True historical longest streak across all habits
    const maxStreaks = trackers.map((t) => calculateLongestStreak(t.checkIns));
    const lStreak = maxStreaks.length > 0 ? Math.max(...maxStreaks) : 0;

    return {
      presenceDays: pDays,
      consistencyPct: cPct,
      depthPct: dPct,
      longestStreak: lStreak,
    };
  }, [horizonNum, trackers, calculateLongestStreak]);

  // Timeline bars (last 21 days)
  const timelineDays = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 20),
      end: new Date(),
    });
  }, []);

  return (
    <Layout title="Progress">
      <div className="pt-2 pb-6 space-y-6">
        {/* Page Title & Perspective Note */}
        <div className="pt-1 flex flex-col space-y-1.5">
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border border-[#46644B]/10">
            <span className="material-symbols-outlined text-[13px]">nature_people</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase">Quiet Rhythm</span>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            Your Progress & Rhythm
          </h1>
          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            Observing recurring patterns with gentle curiosity, not judgment. Every intentional pause reinforces steady renewal.
          </p>
        </div>

        {/* Time Horizon Filter */}
        <div className="bg-[#F2EFE8] dark:bg-[#212521] p-1 rounded-xl border border-[#E3DED5] dark:border-[#313831] flex items-center justify-between">
          {[
            { id: "7", label: "7 Days" },
            { id: "30", label: "30 Days" },
            { id: "90", label: "90 Days" },
            { id: "all", label: "All Time" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeHorizon(tab.id)}
              className={`flex-1 py-1.5 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                timeHorizon === tab.id
                  ? "bg-white dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] shadow-xs"
                  : "text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="space-y-3">
          {/* Days Tracked Card */}
          <div className="p-5 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                Days With Presence
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] text-[11px] font-semibold border border-[#46644B]/10">
                {consistencyPct}% consistency
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-medium text-[#46644B] dark:text-[#8EAA92]">
                {presenceDays}
              </span>
              <span className="font-serif text-xl text-[#77786F] dark:text-[#A6ABA0]">
                / {horizonNum} days tracked
              </span>
            </div>
            <div className="w-full bg-[#E8EBDD]/60 dark:bg-[#313831] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#46644B] dark:bg-[#8EAA92] h-full rounded-full transition-all duration-500"
                style={{ width: `${consistencyPct}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed pt-0.5">
              Honest check-ins logged with intention. Missed days are welcomed back gently without guilt.
            </p>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                Longest Flow
              </span>
              <div className="my-2 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  {longestStreak}
                </span>
                <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">days</span>
              </div>
              <p className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0] leading-snug">
                Longest contiguous sequence of recorded check-ins.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                Check-In Depth
              </span>
              <div className="my-2 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  {depthPct}%
                </span>
                <span className="text-xs text-[#46644B] dark:text-[#8EAA92] font-semibold">rate</span>
              </div>
              <p className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0] leading-snug">
                Ratio of completed commitments in this time window.
              </p>
            </div>
          </div>
        </div>

        {/* Emotional Rhythm Timeline Visualization */}
        <div className="p-5 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                Inner Weather
              </span>
              <h2 className="font-serif text-lg text-[#252B25] dark:text-[#E8EBDD] font-medium mt-0.5">
                Consistency Rhythm (Past 21 Days)
              </h2>
            </div>
            <span className="material-symbols-outlined text-[#46644B] dark:text-[#8EAA92] text-[20px]">insights</span>
          </div>

          {/* Timeline Bar Chart */}
          <div className="pt-2 pb-1">
            <div className="flex items-end justify-between gap-1 h-24 w-full">
              {timelineDays.map((day) => {
                const dStr = format(day, "yyyy-MM-dd");
                const checksCount = trackers.filter((t) => t.checkIns?.[dStr]).length;
                const hasNote = trackers.some((t) => t.notes?.[dStr]?.trim());
                const allComplete = checksCount === trackers.length && trackers.length > 0;

                let barHeight = "15%";
                let barColor = "bg-[#E8EBDD] dark:bg-[#313831]"; // rest

                if (allComplete) {
                  barHeight = "95%";
                  barColor = "bg-[#46644B] dark:bg-[#8EAA92]";
                } else if (checksCount > 0 || hasNote) {
                  barHeight = "60%";
                  barColor = "bg-[#B16F4C] dark:bg-[#D49877]";
                }

                return (
                  <div key={dStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className={`w-full rounded-t-[3px] transition-all duration-300 ${barColor}`}
                      style={{ height: barHeight }}
                      title={`${dStr}: ${checksCount}/${trackers.length} checked`}
                    ></div>
                    <span className="text-[9.5px] font-mono text-[#77786F] dark:text-[#A6ABA0]">
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimal Legend */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E3DED5]/70 dark:border-[#313831] text-xs">
            <div className="flex items-center gap-1.5 text-[#77786F] dark:text-[#A6ABA0]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#46644B] dark:bg-[#8EAA92] inline-block"></span>
              <span>All Complete</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#77786F] dark:text-[#A6ABA0]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B16F4C] inline-block"></span>
              <span>Partial / Note</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#77786F] dark:text-[#A6ABA0]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8EBDD] dark:bg-[#313831] inline-block"></span>
              <span>Rest day</span>
            </div>
          </div>
        </div>

        {/* Active Commitments Breakdown */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-0.5">
            <h2 className="font-serif text-xl text-[#252B25] dark:text-[#E8EBDD] font-medium">
              Active Commitments
            </h2>
            <button
              type="button"
              onClick={() => navigate("/streaks")}
              className="text-xs text-[#46644B] dark:text-[#8EAA92] font-semibold hover:underline"
            >
              View Milestones →
            </button>
          </div>

          {trackers.length === 0 ? (
            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] text-center py-3">
              No habits being tracked. Add a goal on the Home screen to see analytics.
            </p>
          ) : (
            trackers.map((tracker) => {
              const habitName = tracker.name;
              const streak = calculateStreak(tracker.checkIns);
              return (
                <div
                  key={tracker.id || habitName}
                  className="p-4 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center border border-[#46644B]/10">
                        <span className="material-symbols-outlined text-[18px]">
                          {getHabitIcon(habitName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#252B25] dark:text-[#E8EBDD] leading-tight">
                          {getDisplayName(habitName)}
                        </h3>
                        <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                          Daily presence & commitment
                        </span>
                      </div>
                    </div>
                    <span className="font-serif text-lg text-[#46644B] dark:text-[#8EAA92] font-medium">
                      {streak} d flow
                    </span>
                  </div>

                  <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                    {streak > 0
                      ? `Consistent ${streak}-day steady practice. Keep showing up for yourself.`
                      : "Start today for a fresh beginning. Every intentional moment counts."}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Data Autonomy Card & Functional CSV Export */}
        <div className="p-5 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8EBDD] dark:bg-[#2C332C] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92] border border-[#46644B]/15 shrink-0">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">
                Local Device Autonomy
              </h3>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                Your metrics reside entirely on this device. No remote sync, no telemetry, and no external ad trackers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] hover:bg-[#E8EBDD] dark:hover:bg-[#282D28] border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[18px] text-[#46644B] dark:text-[#8EAA92]">
              download
            </span>
            <span>Export Local Data as CSV</span>
          </button>
        </div>

        {/* Philosophical Footnote */}
        <div className="py-2 text-center">
          <p className="font-serif text-base italic text-[#77786F] dark:text-[#A6ABA0]">
            “Rhythm is found in returning, not in perfection.”
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Progress;
