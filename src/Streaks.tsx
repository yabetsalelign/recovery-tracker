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
      return name ? name.slice(0, 1).toUpperCase() + " Tracker" : "Tracker";
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

  return (
    <Layout title="Milestones">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
              Milestones
            </h1>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] mt-0.5">
              Milestone progress for your trackers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="min-h-11 px-3.5 rounded-full btn-secondary text-xs font-semibold"
          >
            ← Progress
          </button>
        </header>

        {trackers.length === 0 ? (
          <div className="vesper-card p-6 text-center space-y-3">
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              No active trackers. Add a tracker to start recording milestones.
            </p>
            <button
              type="button"
              onClick={() => navigate("/add-addiction")}
              className="min-h-11 px-5 py-2 btn-primary rounded-full text-xs font-semibold"
            >
              Add a tracker
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trackers.map((tracker) => {
              const habitName = tracker.name;
              const streak = calculateStreak(tracker.checkIns);
              const nextTarget = streak >= 60 ? 90 : streak >= 30 ? 60 : streak >= 14 ? 30 : streak >= 7 ? 14 : 7;
              const progressPct = Math.min(100, Math.round((streak / nextTarget) * 100));

              return (
                <div
                  key={tracker.id || habitName}
                  className="p-5 vesper-card space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="icon-badge w-9 h-9">
                        <span className="material-symbols-outlined text-[20px]">
                          {getHabitIcon(habitName)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[#261810] dark:text-[#F4EFEA]">
                          {getDisplayName(habitName)}
                        </h2>
                        <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                          Next goal: {nextTarget} days
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-2xl font-medium text-[#261810] dark:text-[#F4EFEA]">
                        {streak}
                      </span>
                      <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F] ml-1">
                        {streak === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#F6EDE2] dark:bg-[#1E1B18] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D47A55] h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Streaks;
