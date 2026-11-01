import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useUser } from "./context/UserContext";
import { useRecovery } from "./context/RecoveryContext";

interface SpecializedModalState {
  type: "sesh" | "weed" | "porn";
  count: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
  const { name } = useUser();
  const {
    trackers,
    toggleCheckIn,
    completeDailyCheckin,
    calculateStreak,
    logSpecializedCount,
    getAllNotes,
    seshData,
    weedData,
    pornData,
  } = useRecovery();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "EEEE, MMMM d");

  // Mood check-in state
  const [selectedMood, setSelectedMood] = useState<string>(() => {
    return localStorage.getItem(`mood_${todayStr}`) || "okay";
  });

  const [checkinNote, setCheckinNote] = useState<string>(() => {
    return localStorage.getItem(`moodNote_${todayStr}`) || "";
  });

  const [hasCompletedTodayCheckin, setHasCompletedTodayCheckin] = useState<boolean>(() => {
    return localStorage.getItem(`checkedIn_${todayStr}`) === "true";
  });

  const [activeSpecializedModal, setActiveSpecializedModal] = useState<SpecializedModalState | null>(null);

  const handleCompleteCheckin = () => {
    completeDailyCheckin(todayStr, selectedMood, checkinNote);
    setHasCompletedTodayCheckin(true);
  };

  const allNotes = useMemo(() => getAllNotes(), [getAllNotes]);
  const latestNote = allNotes.length > 0 ? allNotes[0] : null;

  const getHabitIcon = (habitName: string): string => {
    const lower = (habitName || "").toLowerCase();
    if (lower.includes("alcohol") || lower.includes("drink") || lower.includes("sobriety")) return "water_drop";
    if (lower.includes("sesh") || lower.includes("smoke") || lower.includes("nicotine")) return "air";
    if (lower.includes("weed") || lower.includes("cannabis")) return "nature";
    if (lower.includes("porn") || lower.includes("screen") || lower.includes("curfew")) return "bedtime";
    return "spa";
  };

  const getDisplayName = (habitName: string): string => {
    if (discreetMode) {
      const lower = (habitName || "").toLowerCase();
      if (lower === "sesh") return "Habit S";
      if (lower === "weed") return "Habit W";
      if (lower === "porn") return "Habit P";
      return habitName ? habitName.slice(0, 1).toUpperCase() + " Tracker" : "Tracker";
    }
    return habitName;
  };

  const getSpecializedCurrentCount = (type: "sesh" | "weed" | "porn"): number => {
    if (type === "sesh") return seshData[todayStr] ?? 0;
    if (type === "weed") return weedData[todayStr] ?? 0;
    if (type === "porn") return pornData[todayStr] ?? 0;
    return 0;
  };

  const saveSpecializedCount = () => {
    if (!activeSpecializedModal) return;
    const { type, count } = activeSpecializedModal;
    logSpecializedCount(type, todayStr, count);
    setActiveSpecializedModal(null);
  };

  return (
    <Layout title="Home">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-8">
        {/* Welcoming Header */}
        <header className="space-y-1">
          <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
            {todayDisplay}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
            {name ? `Hello, ${name}` : "Today"}
          </h1>
        </header>

        {/* 1. How are you feeling today? */}
        <section aria-labelledby="mood-heading" className="bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] space-y-4">
          <div className="space-y-1">
            <h2 id="mood-heading" className="font-serif text-xl font-medium text-[#261810] dark:text-[#F4EFEA]">
              How are you feeling?
            </h2>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              A simple daily check-in for your own record.
            </p>
          </div>

          <div role="group" aria-label="Select mood" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "grounded", label: "Grounded" },
              { id: "okay", label: "Doing okay" },
              { id: "struggling", label: "Struggling" },
              { id: "support", label: "Need support" },
            ].map((chip) => {
              const isSelected = selectedMood === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedMood(chip.id)}
                  className={`min-h-11 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710]"
                      : "bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#5E4D45] dark:text-[#D0C4BA] border border-[#D2C3BE]/50 dark:border-[#39302B] hover:border-[#3D2C24]/40"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={checkinNote}
            onChange={(e) => setCheckinNote(e.target.value)}
            placeholder="Add an optional note (e.g. slept well, feeling tired)..."
            aria-label="Daily note"
            className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] placeholder:text-[#6B5B54]/70 border border-[#D2C3BE]/50 dark:border-[#39302B] focus:outline-none focus:border-[#3D2C24] dark:focus:border-[#D47A55]"
          />

          <button
            type="button"
            onClick={handleCompleteCheckin}
            className={`w-full min-h-11 py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              hasCompletedTodayCheckin
                ? "bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#3D2C24] dark:text-[#D47A55] border border-[#3D2C24]/30 dark:border-[#D47A55]/30"
                : "bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] hover:opacity-90"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {hasCompletedTodayCheckin ? "check" : "check_circle"}
            </span>
            <span>{hasCompletedTodayCheckin ? "Update check-in" : "Save check-in"}</span>
          </button>
        </section>

        {/* 2. Your trackers */}
        <section aria-labelledby="trackers-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="trackers-heading" className="font-serif text-xl font-medium text-[#261810] dark:text-[#F4EFEA]">
              Your trackers
            </h2>
            <button
              type="button"
              onClick={() => navigate("/add-addiction")}
              className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#3D2C24] dark:text-[#D47A55] hover:underline px-2"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add a tracker</span>
            </button>
          </div>

          {trackers.length === 0 ? (
            <div className="bg-white dark:bg-[#2A2522] rounded-2xl p-6 text-center border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
              <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] max-w-sm mx-auto">
                No active trackers yet. Add a habit or commitment you would like to track.
              </p>
              <button
                type="button"
                onClick={() => navigate("/add-addiction")}
                className="inline-flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
              >
                <span>Add a tracker</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trackers.map((tracker) => {
                const habitName = tracker.name;
                const checkIns = tracker.checkIns || {};
                const isCheckedToday = Boolean(checkIns[todayStr]);
                const streak = calculateStreak(checkIns);
                const lower = habitName.toLowerCase();
                const isSpecialized = lower === "sesh" || lower === "weed" || lower === "porn";
                const specCount = isSpecialized
                  ? getSpecializedCurrentCount(lower as "sesh" | "weed" | "porn")
                  : 0;

                return (
                  <article
                    key={tracker.id || habitName}
                    className="bg-white dark:bg-[#2A2522] rounded-2xl p-4 border border-[#D2C3BE] dark:border-[#39302B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] flex items-center justify-center text-[#3D2C24] dark:text-[#D47A55] shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {getHabitIcon(habitName)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-[#261810] dark:text-[#F4EFEA] truncate">
                          {getDisplayName(habitName)}
                        </h3>
                        <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                          {streak > 0 ? `${streak} ${streak === 1 ? "day" : "days"}` : "0 days"}
                          {isSpecialized && ` · Count today: ${specCount}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isSpecialized && (
                        <button
                          type="button"
                          aria-label={`Record count for ${getDisplayName(habitName)}`}
                          onClick={() => {
                            const specType = lower as "sesh" | "weed" | "porn";
                            setActiveSpecializedModal({
                              type: specType,
                              count: specCount,
                            });
                          }}
                          className="min-h-11 px-3 py-1.5 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
                        >
                          Log count
                        </button>
                      )}

                      <button
                        type="button"
                        aria-label={
                          isCheckedToday
                            ? `Remove check-in for ${getDisplayName(habitName)}`
                            : `Check in for ${getDisplayName(habitName)}`
                        }
                        aria-pressed={isCheckedToday}
                        onClick={() => toggleCheckIn(habitName, todayStr)}
                        className={`min-h-11 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          isCheckedToday
                            ? "bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#3D2C24] dark:text-[#D47A55] border border-[#3D2C24]/30 dark:border-[#D47A55]/30"
                            : "bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] hover:opacity-90"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isCheckedToday ? "check" : "radio_button_unchecked"}
                        </span>
                        <span>{isCheckedToday ? "Checked" : "Check in"}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Subtle link to recent journal entries */}
        <section aria-labelledby="recent-journal-heading" className="pt-2 border-t border-[#D2C3BE]/50 dark:border-[#39302B]">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recent-journal-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Recent entry
            </h2>
            <button
              type="button"
              onClick={() => navigate("/notes")}
              className="min-h-11 px-2 text-xs font-semibold text-[#3D2C24] dark:text-[#D47A55] hover:underline"
            >
              Open journal
            </button>
          </div>

          {latestNote ? (
            <div
              onClick={() => navigate("/notes")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/notes");
              }}
              className="bg-white dark:bg-[#2A2522] rounded-2xl p-4 border border-[#D2C3BE] dark:border-[#39302B] cursor-pointer hover:border-[#3D2C24]/40 transition-colors space-y-2"
            >
              <p className="font-serif italic text-sm text-[#261810] dark:text-[#F4EFEA] line-clamp-3">
                “{latestNote.text}”
              </p>
              <div className="flex items-center justify-between text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                <span>{latestNote.habit}</span>
                <span>{latestNote.date}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#2A2522] rounded-2xl p-4 border border-[#D2C3BE] dark:border-[#39302B] flex items-center justify-between">
              <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                No entries written yet.
              </span>
              <button
                type="button"
                onClick={() => navigate("/notes")}
                className="text-xs font-semibold text-[#3D2C24] dark:text-[#D47A55] hover:underline"
              >
                Write an entry
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Simplified Count Modal */}
      {activeSpecializedModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="count-modal-title"
            className="w-full max-w-xs bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 id="count-modal-title" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Record count
              </h3>
              <button
                type="button"
                onClick={() => setActiveSpecializedModal(null)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              Set count for today ({todayDisplay}). Enter 0 for none.
            </p>

            <div className="flex items-center justify-center gap-3 py-2">
              <button
                type="button"
                aria-label="Decrease count"
                onClick={() =>
                  setActiveSpecializedModal((prev) =>
                    prev ? { ...prev, count: Math.max(0, (prev.count || 0) - 1) } : null
                  )
                }
                className="min-h-11 min-w-11 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE] dark:border-[#39302B] text-base font-semibold flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                aria-label="Count"
                min="0"
                value={activeSpecializedModal.count}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setActiveSpecializedModal((prev) => (prev ? { ...prev, count: val } : null));
                }}
                className="font-serif text-2xl font-medium w-16 text-center text-[#261810] dark:text-[#F4EFEA] bg-transparent border-b border-[#D2C3BE] dark:border-[#39302B] focus:outline-none"
              />
              <button
                type="button"
                aria-label="Increase count"
                onClick={() =>
                  setActiveSpecializedModal((prev) =>
                    prev ? { ...prev, count: (prev.count || 0) + 1 } : null
                  )
                }
                className="min-h-11 min-w-11 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE] dark:border-[#39302B] text-base font-semibold flex items-center justify-center"
              >
                +
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveSpecializedCount}
                className="min-h-11 flex-1 py-2 px-3 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecializedModal(null)}
                className="min-h-11 py-2 px-4 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Home;
