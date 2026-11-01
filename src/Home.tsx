import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

interface SpecializedModalState {
  type: "sesh" | "weed" | "porn";
  count: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
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
  const todayDisplay = format(new Date(), "EEEE, MMM d");

  // Today check-in state
  const [selectedMood, setSelectedMood] = useState<string>(() => {
    return localStorage.getItem(`mood_${todayStr}`) || "okay";
  });

  const [checkinNote, setCheckinNote] = useState<string>(() => {
    return localStorage.getItem(`moodNote_${todayStr}`) || "";
  });

  const [hasCompletedTodayCheckin, setHasCompletedTodayCheckin] = useState<boolean>(() => {
    return localStorage.getItem(`checkedIn_${todayStr}`) === "true";
  });

  // Specialized count logger modal
  const [activeSpecializedModal, setActiveSpecializedModal] = useState<SpecializedModalState | null>(null);

  const handleCompleteCheckin = () => {
    completeDailyCheckin(todayStr, selectedMood, checkinNote);
    setHasCompletedTodayCheckin(true);
  };

  // Metrics calculation from single source of truth
  const allUniqueCheckinDates = useMemo(() => {
    const dates = new Set<string>();
    trackers.forEach((t) => {
      Object.entries(t.checkIns || {}).forEach(([d, checked]) => {
        if (checked) dates.add(d);
      });
    });
    return dates;
  }, [trackers]);

  const totalDaysTracked = allUniqueCheckinDates.size;

  // This week consistency
  const checkinsThisWeek = useMemo(() => {
    const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
    const daysThisWeek = eachDayOfInterval({ start: startWeek, end: endWeek });
    return daysThisWeek.filter((day) => {
      const dStr = format(day, "yyyy-MM-dd");
      return allUniqueCheckinDates.has(dStr);
    }).length;
  }, [allUniqueCheckinDates]);

  // Latest reflection across all entries
  const allNotes = useMemo(() => getAllNotes(), [getAllNotes]);
  const latestNote = allNotes.length > 0 ? allNotes[0] : null;

  // Calculate milestone progress
  const getMilestone = (streak: number) => {
    if (streak >= 30) return { target: 60, pct: Math.min(100, Math.round((streak / 60) * 100)) };
    if (streak >= 14) return { target: 30, pct: Math.round((streak / 30) * 100) };
    if (streak >= 7) return { target: 14, pct: Math.round((streak / 14) * 100) };
    return { target: 7, pct: Math.round((streak / 7) * 100) };
  };

  const getHabitIcon = (name: string): string => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("alcohol") || lower.includes("drink") || lower.includes("sobriety")) return "water_drop";
    if (lower.includes("sesh") || lower.includes("smoke") || lower.includes("nicotine")) return "air";
    if (lower.includes("weed") || lower.includes("cannabis")) return "nature";
    if (lower.includes("porn") || lower.includes("screen") || lower.includes("curfew")) return "bedtime";
    return "eco";
  };

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

  // Specialized logging handler
  const saveSpecializedCount = () => {
    if (!activeSpecializedModal) return;
    const { type, count } = activeSpecializedModal;
    logSpecializedCount(type, todayStr, count);
    setActiveSpecializedModal(null);
  };

  const getSpecializedCurrentCount = (type: "sesh" | "weed" | "porn"): number => {
    if (type === "sesh") return seshData[todayStr] ?? 0;
    if (type === "weed") return weedData[todayStr] ?? 0;
    if (type === "porn") return pornData[todayStr] ?? 0;
    return 0;
  };

  return (
    <Layout title="Home">
      <div className="pt-2 pb-6 space-y-6">
        {/* Sub-Header: Date & Editorial Greeting */}
        <header className="flex items-baseline justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-medium">
              Your recovery
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#252B25] dark:text-[#E8EBDD] mt-0.5">
              Today · {todayDisplay}
            </h1>
          </div>
          <div className="flex items-center space-x-1.5 self-center">
            <span className="inline-block w-2 h-2 rounded-full bg-[#46644B]"></span>
            <span className="text-xs text-[#77786F] dark:text-[#A6ABA0] font-medium">
              {totalDaysTracked > 0 ? `${totalDaysTracked} days recorded` : "A fresh start"}
            </span>
          </div>
        </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)] lg:items-start">
            <div className="space-y-6">
          {/* PRIORITY 1: TODAY'S TRACKING / CHECK-IN */}
          <section aria-labelledby="daily-pulse-heading" className="bg-white dark:bg-[#212521] rounded-2xl p-4 md:p-5 shadow-xs border border-[#E3DED5] dark:border-[#313831] space-y-3">
          <div className="space-y-1">
            <h2 id="daily-pulse-heading" className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
              How are you feeling today?
            </h2>
            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
              A gentle check-in, separate from your goal records.
            </p>
          </div>

          {/* Emotional weather chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] block">
              Emotional weather
            </span>
            <div role="group" aria-label="Select your emotional weather" className="flex flex-wrap gap-2">
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
                    className={`min-h-11 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[#46644B] text-white shadow-xs"
                        : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] dark:hover:text-[#E8EBDD] border border-[#E3DED5]/60 dark:border-[#313831]"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <details>
            <summary className="min-h-11 cursor-pointer flex items-center text-xs font-semibold text-[#69483F] dark:text-[#D5A16D]">
              Add a note (optional)
            </summary>
            <label
              className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] block mb-1.5"
              htmlFor="checkin-note"
            >
              Optional context or physical cues
            </label>
            <textarea
              id="checkin-note"
              rows={2}
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              placeholder="Chest tension, quiet morning tea, social fatigue..."
              className="w-full bg-[#F8F6F1] dark:bg-[#181B18] rounded-xl p-3 text-xs text-[#252B25] dark:text-[#E8EBDD] placeholder:text-[#77786F]/60 border border-[#E3DED5]/80 dark:border-[#313831] focus:outline-none focus:border-[#46644B] resize-none"
            />
          </details>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleCompleteCheckin}
            className={`w-full min-h-11 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center space-x-2 shadow-xs ${
              hasCompletedTodayCheckin
                ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border border-[#46644B]/20"
                : "bg-[#46644B] hover:bg-[#38503C] text-white active:scale-[0.99]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {hasCompletedTodayCheckin ? "done_all" : "check_circle"}
            </span>
            <span>{hasCompletedTodayCheckin ? "Update emotional check-in" : "Save emotional check-in"}</span>
          </button>
        </section>

        {/* PRIORITY 2: ACTIVE RECOVERY GOALS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
                Active goals
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] text-xs font-medium">
                {trackers.length} active
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/add-addiction")}
              className="inline-flex min-h-11 items-center space-x-1 text-[#46644B] dark:text-[#8EAA92] hover:underline text-xs font-medium py-1 px-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add a goal</span>
            </button>
          </div>

          {trackers.length === 0 ? (
            <div className="bg-white dark:bg-[#212521] rounded-2xl p-4 text-center border border-[#E3DED5] dark:border-[#313831] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[20px]">spa</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  No active goals yet
                </h3>
                <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] max-w-xs mx-auto">
                  Begin by adding a habit, boundary, or reflection goal you want to gently track.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {trackers.map((tracker) => {
                const habitName = tracker.name;
                const checkIns = tracker.checkIns || {};
                const isCheckedToday = Boolean(checkIns[todayStr]);
                const streak = calculateStreak(checkIns);
                const milestone = getMilestone(streak);
                const lower = habitName.toLowerCase();
                const isSpecialized = lower === "sesh" || lower === "weed" || lower === "porn";

                return (
                  <article
                    key={tracker.id || habitName}
                    className="bg-white dark:bg-[#212521] rounded-2xl p-4 shadow-xs border border-[#E3DED5] dark:border-[#313831] space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E8EBDD] dark:bg-[#2C332C] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92]">
                          <span className="material-symbols-outlined text-[20px]">{getHabitIcon(habitName)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">
                            {getDisplayName(habitName)}
                          </h3>
                          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                            {tracker.modality === "frequency"
                              ? "Frequency cap · unavailable; daily check-ins only"
                              : tracker.modality === "quantity"
                              ? "Quantity tracking · unavailable; daily check-ins only"
                              : isSpecialized
                              ? "Specialized impulse tracking"
                              : "Abstinence · Continuous"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={isCheckedToday ? `Remove ${getDisplayName(habitName)} check-in for today` : `Record ${getDisplayName(habitName)} check-in for today`}
                        aria-pressed={isCheckedToday}
                        onClick={() => toggleCheckIn(habitName, todayStr)}
                        className={`inline-flex min-h-11 items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isCheckedToday
                            ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92]"
                            : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] border border-[#E3DED5] dark:border-[#313831]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isCheckedToday ? "done" : "radio_button_unchecked"}
                        </span>
                        <span>{isCheckedToday ? "Checked" : "Check in"}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#252B25] dark:text-[#E8EBDD] font-medium">
                          {streak} consecutive {streak === 1 ? "day" : "days"}
                        </span>
                        <span className="text-[#77786F] dark:text-[#A6ABA0]">
                          Milestone: {milestone.target} days
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E8EBDD]/60 dark:bg-[#313831] rounded-full overflow-hidden">
                        <div
                          className="bg-[#46644B] dark:bg-[#8EAA92] h-full rounded-full transition-all duration-300"
                          style={{ width: `${milestone.pct}%` }}
                        ></div>
                      </div>
                    </div>

                    {isSpecialized && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#E3DED5]/60 dark:border-[#313831]">
                        <button
                          type="button"
                          onClick={() => navigate(`/${lower}`)}
                          className="inline-flex min-h-11 items-center space-x-1 text-xs text-[#46644B] dark:text-[#8EAA92] hover:underline font-medium"
                        >
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                          <span>Open {habitName} page</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Record ${getDisplayName(habitName)} count for today`}
                          onClick={() => {
                            const specType = lower as "sesh" | "weed" | "porn";
                            setActiveSpecializedModal({
                              type: specType,
                              count: getSpecializedCurrentCount(specType),
                            });
                          }}
                          className="inline-flex min-h-11 items-center space-x-1 bg-[#F8F6F1] dark:bg-[#181B18] hover:bg-[#E8EBDD] text-[#B16F4C] dark:text-[#D49877] px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#E3DED5] dark:border-[#313831] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">bolt</span>
                          <span>Log count ({getSpecializedCurrentCount(lower as "sesh" | "weed" | "porn")})</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate("/counter")}
            className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] p-3 text-left shadow-xs transition-all hover:border-[#46644B]"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#46644B] dark:text-[#D5A16D] text-[20px]" aria-hidden="true">
                hourglass_top
              </span>
              <span>
                <span className="block font-semibold text-[#252B25] dark:text-[#E8EBDD]">Day Counter</span>
                <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">Sovereign timer</span>
              </span>
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#77786F]" aria-hidden="true">chevron_right</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/streaks")}
            className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] p-3 text-left shadow-xs transition-all hover:border-[#46644B]"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#B16F4C] dark:text-[#D5A16D] text-[20px]" aria-hidden="true">
                workspace_premium
              </span>
              <span>
                <span className="block font-semibold text-[#252B25] dark:text-[#E8EBDD]">Milestones</span>
                <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">Recorded patterns</span>
              </span>
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#77786F]" aria-hidden="true">chevron_right</span>
          </button>
        </div>

          </div>
          <div className="space-y-6">
        {/* PRIORITY 3: OVERVIEW & RECENT ACTIVITY */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">Overview</h2>
            <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">Rhythm metrics</span>
          </div>

          {/* 3-metric strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-[#212521] rounded-2xl p-3 shadow-xs border border-[#E3DED5] dark:border-[#313831] text-center space-y-0.5">
              <span className="font-serif text-2xl text-[#46644B] dark:text-[#8EAA92] block leading-tight font-medium">
                {totalDaysTracked}
              </span>
              <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] block">Days tracked</span>
            </div>
            <div className="bg-white dark:bg-[#212521] rounded-2xl p-3 shadow-xs border border-[#E3DED5] dark:border-[#313831] text-center space-y-0.5">
              <span className="font-serif text-2xl text-[#46644B] dark:text-[#8EAA92] block leading-tight font-medium">
                {checkinsThisWeek}/7
              </span>
              <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] block">This week</span>
            </div>
            <div className="bg-white dark:bg-[#212521] rounded-2xl p-3 shadow-xs border border-[#E3DED5] dark:border-[#313831] text-center space-y-0.5">
              <span className="font-serif text-2xl text-[#46644B] dark:text-[#8EAA92] block leading-tight font-medium">
                {trackers.length}
              </span>
              <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] block">Active goals</span>
            </div>
          </div>

          {/* Recent Reflection Card */}
          <article className="bg-white dark:bg-[#212521] rounded-2xl p-4 shadow-xs border border-[#E3DED5] dark:border-[#313831] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[18px] text-[#77786F] dark:text-[#A6ABA0]">
                  edit_note
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                  Latest Reflection {latestNote ? `· ${latestNote.date}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/notes")}
                className="min-h-11 px-2 text-[#46644B] dark:text-[#8EAA92] hover:underline text-xs font-semibold transition-colors"
              >
                Open journal
              </button>
            </div>

            <p className="font-serif text-base italic text-[#252B25] dark:text-[#E8EBDD] leading-relaxed">
              {latestNote
                ? `“${latestNote.text}”`
                : "Your reflections will appear here when you write them."}
            </p>

            <div className="flex items-center justify-between pt-1">
              {latestNote && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] text-[11px] font-medium">
                  {latestNote.habit}
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate("/notes")}
                className="inline-flex min-h-11 items-center space-x-1 px-2 text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] text-xs font-medium"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>New reflection</span>
              </button>
            </div>
          </article>
        </section>

        {/* Compassionate Gentle Note Banner */}
        <aside className="bg-[#E8EBDD]/60 dark:bg-[#2C332C]/50 rounded-2xl p-4 space-y-1.5 border border-[#E3DED5] dark:border-[#313831]">
          <div className="flex items-center space-x-2 text-[#46644B] dark:text-[#8EAA92]">
            <span className="material-symbols-outlined text-[18px]">eco</span>
            <span className="text-[11px] uppercase tracking-wider font-semibold">Gentle cadence</span>
          </div>
          <p className="text-xs text-[#252B25] dark:text-[#E8EBDD] leading-relaxed">
            Recovery is not a performance trial. Slips and urges are signals for care, never reasons for punitive evaluation.
          </p>
        </aside>
          </div>
        </div>
      </div>

      {/* Accessible Specialized Intake Modal */}
      {activeSpecializedModal && (
        <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="specialized-count-heading"
            className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-5 shadow-xl border border-[#E3DED5] dark:border-[#313831] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E3DED5] dark:border-[#313831] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#B16F4C] text-[20px]">tune</span>
                <h3 id="specialized-count-heading" className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  Log {activeSpecializedModal.type} Count
                </h3>
              </div>
              <button
                onClick={() => setActiveSpecializedModal(null)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#77786F] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
              Record a count for today ({todayStr}). A count of 0 records no consumption for that day.
            </p>

            <div className="flex items-center justify-center gap-3 py-2">
              <button
                type="button"
                aria-label="Decrease count"
                onClick={() =>
                  setActiveSpecializedModal((prev) => (prev ? { ...prev, count: Math.max(0, (prev.count || 0) - 1) } : null))
                }
                className="min-h-11 min-w-11 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] text-lg font-bold flex items-center justify-center hover:bg-[#E8EBDD]"
              >
                -
              </button>
              <input
                type="number"
                aria-label={`Count for ${activeSpecializedModal.type}`}
                min="0"
                value={activeSpecializedModal.count}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setActiveSpecializedModal((prev) => (prev ? { ...prev, count: val } : null));
                }}
                className="font-serif text-3xl font-medium w-16 text-center text-[#252B25] dark:text-[#E8EBDD] bg-transparent border-b border-[#E3DED5] dark:border-[#313831] focus:outline-none focus:border-[#46644B]"
              />
              <button
                type="button"
                aria-label="Increase count"
                onClick={() =>
                  setActiveSpecializedModal((prev) => (prev ? { ...prev, count: (prev.count || 0) + 1 } : null))
                }
                className="min-h-11 min-w-11 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] text-lg font-bold flex items-center justify-center hover:bg-[#E8EBDD]"
              >
                +
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={saveSpecializedCount}
                className="min-h-11 flex-1 py-2.5 rounded-xl bg-[#46644B] text-white text-xs font-semibold hover:bg-[#38503C] transition-colors"
              >
                Save Record
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecializedModal(null)}
                className="min-h-11 py-2.5 px-4 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] text-xs font-medium"
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
