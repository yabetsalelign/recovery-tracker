import React, { useState, useMemo } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const {
    trackers,
    calculateLongestStreak,
    calculateStreak,
  } = useRecovery();

  const [timeHorizon, setTimeHorizon] = useState<string>("30");

  const horizonNum = timeHorizon === "all" ? 90 : parseInt(timeHorizon, 10) || 30;

  const { presenceDays, longestStreak } = useMemo(() => {
    const daysInHorizon = eachDayOfInterval({
      start: subDays(new Date(), horizonNum - 1),
      end: new Date(),
    });

    let pDays = 0;
    daysInHorizon.forEach((dateObj) => {
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const anyChecked = trackers.some((t) => t.checkIns?.[dateStr]);
      if (anyChecked) pDays++;
    });

    const maxStreaks = trackers.map((t) => calculateLongestStreak(t.checkIns));
    const lStreak = maxStreaks.length > 0 ? Math.max(...maxStreaks) : 0;

    return {
      presenceDays: pDays,
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

  const timelineData = useMemo(
    () =>
      timelineDays.map((day) => {
        const date = format(day, "yyyy-MM-dd");
        const checksCount = trackers.filter((tracker) => tracker.checkIns?.[date]).length;
        const hasNote = trackers.some((tracker) => tracker.notes?.[date]?.trim());
        const complete = checksCount === trackers.length && trackers.length > 0;
        return { day, date, checksCount, hasNote, complete };
      }),
    [timelineDays, trackers]
  );

  const hasTimelineActivity = timelineData.some(({ checksCount, hasNote }) => checksCount > 0 || hasNote);

  // Active streaks count
  const activeStreakMax = useMemo(() => {
    const streaks = trackers.map((t) => calculateStreak(t.checkIns));
    return streaks.length > 0 ? Math.max(...streaks) : 0;
  }, [trackers, calculateStreak]);

  return (
    <Layout title="Progress">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
            Progress
          </h1>
          <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
            A quiet view of your consistency over time.
          </p>
        </header>

        {/* Time Horizon Selector */}
        <div role="group" aria-label="Select time horizon" className="p-1 rounded-full bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE]/50 dark:border-[#39302B] flex items-center gap-1">
          {[
            { id: "7", label: "7 days" },
            { id: "30", label: "30 days" },
            { id: "90", label: "90 days" },
            { id: "all", label: "All time" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={timeHorizon === tab.id}
              onClick={() => setTimeHorizon(tab.id)}
              className={`min-h-11 flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${
                timeHorizon === tab.id
                  ? "bg-[#FDD0C6] text-[#261810] dark:text-[#1A1614] font-bold shadow-xs"
                  : "text-[#78564F] dark:text-[#A99A8F] hover:text-[#261810] dark:hover:text-[#F4EFEA]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#24201D] rounded-2xl p-5 sm:p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-1">
            <span className="text-xs font-semibold text-[#78564F] dark:text-[#A99A8F]">
              Days with entries
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-medium text-[#261810] dark:text-[#F4EFEA]">
                {presenceDays}
              </span>
              <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
                of {horizonNum} days
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#24201D] rounded-2xl p-5 sm:p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-1">
            <span className="text-xs font-semibold text-[#78564F] dark:text-[#A99A8F]">
              Longest streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-medium text-[#261810] dark:text-[#F4EFEA]">
                {longestStreak}
              </span>
              <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
                {longestStreak === 1 ? "day" : "consecutive days"}
              </span>
            </div>
          </div>
        </div>

        {/* 21-Day Timeline Chart */}
        <section aria-labelledby="timeline-heading" className="bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 sm:p-6 shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="timeline-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Last 21 days
            </h2>
            <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              Current streak: {activeStreakMax} {activeStreakMax === 1 ? "day" : "days"}
            </span>
          </div>

          <div className="pt-2">
            {!hasTimelineActivity && (
              <p className="mb-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] px-3.5 py-2.5 text-xs text-[#78564F] dark:text-[#A99A8F]">
                Your recent rhythm will take shape as you record check-ins or reflections.
              </p>
            )}

            <div
              role="img"
              aria-label="Daily activity for the past 21 days. Select View daily details for exact dates."
              className={`flex w-full items-end justify-between gap-1 ${
                hasTimelineActivity ? "h-20 sm:h-24" : "h-14"
              }`}
            >
              {timelineData.map(({ day, date, checksCount, hasNote, complete }, index) => {
                const barHeight = complete ? "95%" : checksCount > 0 || hasNote ? "60%" : "15%";
                const barColor = complete
                  ? "bg-[#78564F] dark:bg-[#8EAA92]"
                  : checksCount > 0 || hasNote
                  ? "bg-[#D47A55]"
                  : "bg-[#F6EDE2] dark:bg-[#2A2522]";
                const showDate = index === 0 || index === 20 || (index + 1) % 5 === 0;

                return (
                  <div key={date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div
                      className={`w-full rounded-t-sm transition-all ${barColor}`}
                      style={{ height: barHeight }}
                      aria-hidden="true"
                    />
                    <span className="h-3 text-[10px] font-mono leading-3 text-[#78564F] dark:text-[#A99A8F]">
                      {showDate ? format(day, "d") : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#D2C3BE]/60 dark:border-[#39302B] text-xs text-[#78564F] dark:text-[#A99A8F]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#78564F] dark:bg-[#8EAA92]" />
              <span>All checked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D47A55]" />
              <span>Partial / note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D2C3BE]/60 dark:bg-[#39302B]" />
              <span>Rest day</span>
            </div>
          </div>

          {/* Details */}
          <details className="border-t border-[#D2C3BE]/60 dark:border-[#39302B] pt-2">
            <summary className="min-h-11 cursor-pointer text-xs font-semibold text-[#78564F] dark:text-[#D47A55] flex items-center hover:text-[#261810] dark:hover:text-[#F4EFEA] transition-colors">
              View daily details
            </summary>
            <ul className="grid gap-1 sm:grid-cols-2 pt-2">
              {timelineData.map(({ day, date, checksCount, hasNote, complete }) => {
                const status = complete
                  ? "All trackers checked"
                  : checksCount > 0 || hasNote
                  ? "Partial activity"
                  : "No activity";
                return (
                  <li
                    key={date}
                    className="rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] px-3.5 py-2 text-xs text-[#78564F] dark:text-[#D0C4BA] border border-[#D2C3BE]/40 dark:border-[#39302B]/60"
                  >
                    <time dateTime={date} className="font-semibold text-[#261810] dark:text-[#F4EFEA]">{format(day, "EEE, MMM d")}</time>
                    <span>: {status}</span>
                    {hasNote && <span>, note recorded</span>}
                  </li>
                );
              })}
            </ul>
          </details>
        </section>

        {/* Milestone and Counter Links */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/streaks")}
            className="p-5 bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] text-left hover:border-[#78564F]/50 transition-colors"
          >
            <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
              Milestones →
            </span>
            <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              View habit milestone goals
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/counter")}
            className="p-5 bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] text-left hover:border-[#78564F]/50 transition-colors"
          >
            <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
              Day counter →
            </span>
            <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              Continuous sobriety timer
            </span>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Progress;
