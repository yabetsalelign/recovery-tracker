import React from "react";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";
import { getHabitIcon } from "./utils/habitIcons";

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
      return name ? name.slice(0, 1).toUpperCase() + " Tracker" : "Tracker";
    }
    return name;
  };

  const selectedDateObj = new Date(targetDateStr + "T00:00:00");
  const formattedDay = !isNaN(selectedDateObj.getTime())
    ? format(selectedDateObj, "EEEE, MMMM d, yyyy")
    : targetDateStr;

  const completedCount = trackers.filter((t) => t.checkIns?.[targetDateStr]).length;

  return (
    <Layout title="Day Detail">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
              {formattedDay}
            </h1>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] mt-0.5">
              {completedCount} of {trackers.length} checked
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/calendar?date=${targetDateStr}`)}
            className="min-h-11 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#2A2522] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
          >
            ← Calendar
          </button>
        </header>

        <section className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA] pb-2 border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
            Daily check-ins
          </h2>

          {trackers.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                No active trackers yet.
              </p>
              <button
                type="button"
                onClick={() => navigate("/add-addiction")}
                className="min-h-11 px-4 py-2 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
              >
                Add a tracker
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {trackers.map((tracker) => {
                const habitName = tracker.name;
                const isChecked = Boolean(tracker.checkIns?.[targetDateStr]);
                return (
                  <div
                    key={tracker.id || habitName}
                    className="p-3.5 bg-[#FBF2E7] dark:bg-[#1E1B18] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white dark:bg-[#2A2522] text-[#3D2C24] dark:text-[#D47A55]">
                        <span className="material-symbols-outlined text-[18px]">
                          {getHabitIcon(habitName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#261810] dark:text-[#F4EFEA]">
                          {getDisplayName(habitName)}
                        </h3>
                        <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                          {isChecked ? "Checked in" : "Not checked in"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={
                        isChecked
                          ? `Remove check-in for ${getDisplayName(habitName)}`
                          : `Check in for ${getDisplayName(habitName)}`
                      }
                      aria-pressed={isChecked}
                      onClick={() => toggleCheckIn(habitName, targetDateStr)}
                      className={`min-h-11 px-3 py-1.5 text-xs rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710]"
                          : "bg-white dark:bg-[#2A2522] border border-[#D2C3BE] dark:border-[#39302B] text-[#5E4D45] dark:text-[#D0C4BA]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isChecked ? "check" : "radio_button_unchecked"}
                      </span>
                      <span>{isChecked ? "Checked" : "Check in"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Day;
