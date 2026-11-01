import React from "react";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

const Day: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { discreetMode } = useTheme();
  const { trackers, toggleCheckIn, selectedDate: contextDate } = useRecovery();

  const searchParams = new URLSearchParams(location.search);
  const targetDateStr = searchParams.get("date") || contextDate || format(new Date(), "yyyy-MM-dd");

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
    return "eco";
  };

  const selectedDateObj = new Date(targetDateStr + "T00:00:00");
  const formattedDay = !isNaN(selectedDateObj.getTime())
    ? format(selectedDateObj, "EEEE, MMMM d, yyyy")
    : targetDateStr;

  const completedCount = trackers.filter((t) => t.checkIns?.[targetDateStr]).length;

  return (
    <Layout title="Day Detail">
      <div className="pt-2 pb-6 space-y-5">
        <header className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-medium">
              Daily Record
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
              {formattedDay}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/calendar?date=${targetDateStr}`)}
            className="px-3 py-1.5 rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] hover:bg-[#F2EFE8] transition-colors"
          >
            ← Calendar
          </button>
        </header>

        <section className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DED5]/70 dark:border-[#313831] pb-3">
            <h2 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
              Daily Habit Check-Ins
            </h2>
            <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
              {completedCount} of {trackers.length} checked
            </span>
          </div>

          {trackers.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                No active habits found. Visit Home to create your first goal!
              </p>
              <button
                type="button"
                onClick={() => navigate("/add-addiction")}
                className="px-3.5 py-1.5 rounded-xl bg-[#46644B] text-white text-xs font-semibold"
              >
                Create Goal
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trackers.map((tracker) => {
                const habitName = tracker.name;
                const isChecked = Boolean(tracker.checkIns?.[targetDateStr]);
                return (
                  <div
                    key={tracker.id || habitName}
                    className="p-3.5 bg-[#F8F6F1] dark:bg-[#181B18] rounded-xl border border-[#E3DED5]/70 dark:border-[#313831] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isChecked
                            ? "bg-[#46644B] text-white"
                            : "bg-[#E3DED5] dark:bg-[#2C332C] text-[#252B25] dark:text-[#E8EBDD]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {getHabitIcon(habitName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">
                          {getDisplayName(habitName)}
                        </h3>
                        <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                          Status: {isChecked ? "Checked in" : "Not checked in"} on this date
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCheckIn(habitName, targetDateStr)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1 ${
                        isChecked
                          ? "bg-[#46644B] text-white shadow-xs"
                          : "bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isChecked ? "done" : "radio_button_unchecked"}
                      </span>
                      <span>{isChecked ? "Checked in" : "Check in"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/calendar?date=${targetDateStr}`)}
            className="flex-1 py-2.5 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] hover:bg-[#F2EFE8] transition-colors"
          >
            ← Back to Calendar
          </button>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex-1 py-2.5 rounded-xl bg-[#46644B] text-white text-xs font-semibold hover:bg-[#38503C] transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Day;
