import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

const Streaks: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
  const { trackers, calculateStreak } = useRecovery();

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
    return "workspace_premium";
  };

  return (
    <Layout title="Streaks & Milestones">
      <div className="pt-2 pb-6 space-y-6">
        <header className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
              Continuous Practice
            </span>
            <button
              type="button"
              onClick={() => navigate("/progress")}
              className="text-xs font-semibold text-[#46644B] dark:text-[#8EAA92] hover:underline"
            >
              ← Progress
            </button>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            Milestone Journeys
          </h1>
          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            Honoring every single step forward. Streaks reflect your quiet dedication to yourself.
          </p>
        </header>

        {trackers.length === 0 ? (
          <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 text-center border border-[#E3DED5] dark:border-[#313831] space-y-3 shadow-xs">
            <span className="material-symbols-outlined text-[28px] text-[#46644B]">eco</span>
            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
              Add a recovery goal to begin charting consecutive milestones.
            </p>
            <button
              type="button"
              onClick={() => navigate("/add-addiction")}
              className="px-4 py-2 bg-[#46644B] text-white rounded-xl text-xs font-semibold hover:bg-[#38503C]"
            >
              Add a goal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {trackers.map((tracker) => {
              const habitName = tracker.name;
              const streak = calculateStreak(tracker.checkIns);

              const milestoneMessage =
                streak >= 30
                  ? "Over a month of strength! Deep neural renewal underway."
                  : streak >= 14
                  ? "Two steady weeks of presence. Your daily rhythm is solidifying."
                  : streak >= 7
                  ? "A full week of progress. One day at a time, you are showing up."
                  : streak >= 1
                  ? "Keep it up! The journey of renewal begins with a single intentional choice."
                  : "Start today for a fresh beginning. Every moment is an opportunity to return.";

              const nextTarget = streak >= 30 ? 60 : streak >= 14 ? 30 : streak >= 7 ? 14 : 7;
              const progressPct = Math.min(100, Math.round((streak / nextTarget) * 100));

              return (
                <div
                  key={tracker.id || habitName}
                  className="p-5 bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">
                          {getHabitIcon(habitName)}
                        </span>
                      </div>
                      <h2 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                        {getDisplayName(habitName)}
                      </h2>
                    </div>
                    <span className="font-serif text-2xl font-medium text-[#46644B] dark:text-[#8EAA92]">
                      {streak} {streak === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
                      <span>Next milestone</span>
                      <span>{nextTarget} days</span>
                    </div>
                    <div className="w-full bg-[#E8EBDD]/60 dark:bg-[#313831] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#46644B] dark:bg-[#8EAA92] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] italic leading-relaxed pt-1 border-t border-[#E3DED5]/60 dark:border-[#313831]">
                    “{milestoneMessage}”
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/progress")}
          className="w-full py-2.5 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] hover:bg-[#F2EFE8] transition-colors"
        >
          Return to Progress & Analytics
        </button>
      </div>
    </Layout>
  );
};

export default Streaks;
