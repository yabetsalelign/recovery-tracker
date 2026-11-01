import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useUser } from "./context/UserContext";
import { useRecovery } from "./context/RecoveryContext";
import { getHabitIcon } from "./utils/habitIcons";
import { calculateUnifiedStreak, evaluateDayRecord } from "./utils/unifiedCalculations";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
  const { name } = useUser();
  const {
    canonicalTrackers,
    logTrackerDayStatus,
    completeDailyCheckin,
    getAllNotes,
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

  const handleCompleteCheckin = () => {
    completeDailyCheckin(todayStr, selectedMood, checkinNote);
    setHasCompletedTodayCheckin(true);
  };

  const allNotes = useMemo(() => getAllNotes(), [getAllNotes]);
  const latestNote = allNotes.length > 0 ? allNotes[0] : null;

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

  return (
    <Layout title="Home">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-8">
        {/* Welcoming Header */}
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-[#78564F] dark:text-[#A99A8F] font-semibold">
            {todayDisplay}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
            {name ? `Hello, ${name}` : "Today"}
          </h1>
          <p className="text-xs sm:text-sm text-[#78564F] dark:text-[#A99A8F]">
            Gentle awareness for today. You are meeting each breath as it arrives.
          </p>
        </header>

        {/* 1. How are you feeling today? */}
        <section aria-labelledby="mood-heading" className="bg-white dark:bg-[#24201D] rounded-2xl p-5 sm:p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-4">
          <div className="space-y-1">
            <h2 id="mood-heading" className="font-serif text-xl font-medium text-[#261810] dark:text-[#F4EFEA]">
              How are you feeling?
            </h2>
            <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
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
                  className={`min-h-11 px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? "mood-chip-selected"
                      : "bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#78564F] dark:text-[#D0C4BA] border border-[#D2C3BE]/60 dark:border-[#39302B] hover:bg-[#F6EDE2] dark:hover:bg-[#2A2522] font-semibold"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? "bg-[#261810] dark:bg-[#1A1614]"
                        : "bg-[#78564F]/50 dark:bg-[#A99A8F]/50"
                    }`}
                  />
                  <span>{chip.label}</span>
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
            className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] placeholder:text-[#78564F]/60 dark:placeholder:text-[#A99A8F]/60 border border-[#D2C3BE]/60 dark:border-[#39302B] focus:outline-none focus:border-[#78564F] dark:focus:border-[#D47A55]"
          />

          <button
            type="button"
            onClick={handleCompleteCheckin}
            className={`w-full min-h-11 py-2.5 px-4 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              hasCompletedTodayCheckin
                ? "btn-primary-soft"
                : "btn-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {hasCompletedTodayCheckin ? "check" : "check_circle"}
            </span>
            <span>{hasCompletedTodayCheckin ? "Update check-in" : "Save check-in"}</span>
          </button>
        </section>

        {/* 2. Your trackers */}
        <section aria-labelledby="trackers-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="trackers-heading" className="font-serif text-xl font-medium text-[#261810] dark:text-[#F4EFEA]">Your trackers</h2>
            <button type="button" onClick={() => navigate("/add-addiction")} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#78564F] dark:text-[#D47A55] hover:underline px-2"><span>Add a tracker</span></button>
          </div>
          {canonicalTrackers.filter((tracker) => !tracker.isArchived).length === 0 ? (
            <div className="bg-white dark:bg-[#24201D] rounded-2xl p-6 text-center border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
              <p className="text-sm text-[#78564F] dark:text-[#A99A8F]">No active trackers yet. Add something you would like to follow over time.</p>
              <button type="button" onClick={() => navigate("/add-addiction")} className="min-h-11 px-4 rounded-full btn-primary text-sm">Add a tracker</button>
            </div>
          ) : <div className="space-y-2.5">
            {canonicalTrackers.filter((tracker) => !tracker.isArchived).map((tracker) => {
              const record = tracker.records[todayStr];
              const evaluation = evaluateDayRecord(tracker, todayStr);
              const streak = calculateUnifiedStreak(tracker);
              const statusLabel = evaluation.isPlannedSkip ? "Planned rest" : evaluation.isLapseOrBreach ? (tracker.modality === "boundary" ? "Breach recorded" : "Lapse recorded") : evaluation.isSuccess ? "Recorded successfully" : record?.note ? "Note only" : "Not logged";
              const detail = () => navigate(`/tracker/${encodeURIComponent(tracker.id)}?date=${todayStr}`);
              return <article key={tracker.id} className="bg-white dark:bg-[#24201D] rounded-2xl p-4 sm:p-5 border border-[#D2C3BE] dark:border-[#39302B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0"><div className="icon-badge"><span className="material-symbols-outlined text-[20px]">{getHabitIcon(tracker.name)}</span></div><div className="min-w-0"><h3 className="font-semibold text-sm truncate">{getDisplayName(tracker.name)}</h3><p className="text-xs text-[#78564F] dark:text-[#A99A8F]">{tracker.category} · {streak} day streak · {statusLabel}{record?.value !== undefined ? ` · ${record.value}` : ""}</p></div></div>
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {tracker.modality === "abstinence" && <><button type="button" aria-pressed={record?.status === "confirmed_clean"} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "confirmed_clean")} className="min-h-11 px-3 rounded-full btn-primary text-xs">Clean day</button><button type="button" aria-pressed={record?.status === "lapsed"} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "lapsed")} className="min-h-11 px-3 rounded-full btn-secondary text-xs">Lapse</button></>}
                  {tracker.modality === "frequency" && <><button type="button" aria-pressed={record?.status === "recorded" && record.value === 0} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "recorded", 0)} className="min-h-11 px-3 rounded-full btn-primary text-xs">Log zero</button><button type="button" onClick={detail} className="min-h-11 px-3 rounded-full btn-secondary text-xs">Record quantity</button></>}
                  {tracker.modality === "daily_habit" && <><button type="button" aria-pressed={record?.status === "completed"} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "completed")} className="min-h-11 px-3 rounded-full btn-primary text-xs">Completed</button><button type="button" aria-pressed={record?.status === "skipped"} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "skipped")} className="min-h-11 px-3 rounded-full btn-secondary text-xs">Planned rest</button></>}
                  {tracker.modality === "boundary" && <><button type="button" aria-pressed={record?.status === "adhered"} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "adhered")} className="min-h-11 px-3 rounded-full btn-primary text-xs">Adhered</button><button type="button" aria-pressed={record?.status === "breached"} onClick={() => logTrackerDayStatus(tracker.id, todayStr, "breached")} className="min-h-11 px-3 rounded-full btn-secondary text-xs">Breach</button></>}
                  <button type="button" aria-label={`Open ${getDisplayName(tracker.name)} tracker details`} onClick={detail} className="min-h-11 px-3.5 rounded-full btn-secondary text-xs">Details</button>
                </div>
              </article>;
            })}
          </div>}
        </section>
        {/* 3. Subtle link to recent journal entries */}
        <section aria-labelledby="recent-journal-heading" className="pt-2 border-t border-[#D2C3BE]/60 dark:border-[#39302B]">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recent-journal-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Recent entry
            </h2>
            <button
              type="button"
              onClick={() => navigate("/notes")}
              className="min-h-11 px-2 text-xs font-semibold text-[#78564F] dark:text-[#D47A55] hover:text-[#261810] dark:hover:text-[#F4EFEA] hover:underline transition-colors"
            >
              Open journal â†’
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
              className="bg-white dark:bg-[#24201D] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] cursor-pointer hover:border-[#78564F]/50 transition-colors space-y-2.5"
            >
              <p className="font-serif italic text-sm sm:text-base text-[#261810] dark:text-[#F4EFEA] leading-relaxed line-clamp-3">
                â€œ{latestNote.text}â€
              </p>
              <div className="flex items-center justify-between text-xs text-[#78564F] dark:text-[#A99A8F]">
                <span className="font-medium">{latestNote.habit}</span>
                <span>{latestNote.date}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#24201D] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] flex items-center justify-between">
              <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
                No entries written yet.
              </span>
              <button
                type="button"
                onClick={() => navigate("/notes")}
                className="text-xs font-semibold text-[#78564F] dark:text-[#D47A55] hover:underline"
              >
                Write an entry
              </button>
            </div>
          )}
        </section>
      </div>

    </Layout>
  );
};

export default Home;
