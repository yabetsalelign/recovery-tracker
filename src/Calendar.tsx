import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { discreetMode } = useTheme();
  const {
    trackers,
    addictions,
    toggleCheckIn,
    saveNote,
    getNote,
    selectedDate: contextSelectedDate,
    setSelectedDate: setContextSelectedDate,
  } = useRecovery();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Selected date from query param, context, or today
  const searchParams = new URLSearchParams(location.search);
  const paramDate = searchParams.get("date");

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return paramDate || contextSelectedDate || format(new Date(), "yyyy-MM-dd");
  });

  useEffect(() => {
    const date = new Date(`${selectedDateStr}T00:00:00`);
    if (!isNaN(date.getTime())) setCurrentMonth(date);
  }, [selectedDateStr]);

  // Note state for selected day
  const [selectedDayNote, setSelectedDayNote] = useState<string>("");
  const [selectedNoteHabit, setSelectedNoteHabit] = useState<string>(() => {
    return addictions.length > 0 ? addictions[0] : "General";
  });
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  // Sync selected date with context
  useEffect(() => {
    if (selectedDateStr) {
      setContextSelectedDate(selectedDateStr);
    }
  }, [selectedDateStr, setContextSelectedDate]);

  // Load existing note when selected date or selected note habit changes
  useEffect(() => {
    const existing = getNote(selectedNoteHabit, selectedDateStr);
    setSelectedDayNote(existing);
    setIsEditingNote(false);
  }, [selectedDateStr, selectedNoteHabit, getNote]);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Align days to Monday start (0 = Sun, 1 = Mon...)
  const startDayIndex = getDay(startOfMonth(currentMonth));
  const leadingBlanks = Array.from({ length: (startDayIndex + 6) % 7 });

  const handleSaveNote = () => {
    saveNote(selectedNoteHabit, selectedDateStr, selectedDayNote);
    setIsEditingNote(false);
  };

  const handleCalendarKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const nextDate = addDays(date, offset);
    const nextDateStr = format(nextDate, "yyyy-MM-dd");
    setSelectedDateStr(nextDateStr);
    setTimeout(() => {
      const nextButton = document.getElementById(`calendar-day-${nextDateStr}`);
      if (nextButton instanceof HTMLButtonElement) nextButton.focus();
    }, 0);
  };

  const getDayStatus = (dateStr: string): "complete" | "partial" | "rest" => {
    if (!trackers.length) return "rest";
    const total = trackers.length;
    const completed = trackers.filter((t) => t.checkIns?.[dateStr]).length;
    const hasNote = trackers.some((t) => t.notes?.[dateStr]?.trim()) || Boolean(getNote("General", dateStr));

    if (completed === total && total > 0) return "complete"; // sage
    if (completed > 0 || hasNote) return "partial"; // terracotta
    return "rest";
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

  // Selected date info
  const selectedDateObj = new Date(selectedDateStr + "T00:00:00");
  const selectedDayFormatted = !isNaN(selectedDateObj.getTime())
    ? format(selectedDateObj, "EEEE, MMMM d, yyyy")
    : selectedDateStr;
  const selectedDayCompact = !isNaN(selectedDateObj.getTime())
    ? format(selectedDateObj, "EEE, MMM d, yyyy")
    : selectedDateStr;

  const totalCompletedForSelectedDay = trackers.filter((t) => t.checkIns?.[selectedDateStr]).length;
  const isSelectedDayComplete = totalCompletedForSelectedDay === trackers.length && trackers.length > 0;
  const savedMoodForSelectedDay = localStorage.getItem(`mood_${selectedDateStr}`);

  return (
    <Layout title="Calendar">
      <div className="pt-2 pb-6 space-y-4">
        {/* Month Navigation Bar */}
        <section className="flex items-center justify-between pt-1">
          <h1 className="whitespace-nowrap font-serif text-2xl md:text-3xl text-[#252B25] dark:text-[#E8EBDD] tracking-tight font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Go to current month"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDateStr(format(today, "yyyy-MM-dd"));
              }}
              className="min-h-11 px-2.5 rounded-lg bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] text-xs font-semibold hover:bg-[#F2EFE8] dark:hover:bg-[#2C332C] transition-colors shadow-xs"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Previous Month"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="min-h-11 min-w-11 rounded-lg bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] flex items-center justify-center hover:bg-[#F2EFE8] dark:hover:bg-[#2C332C] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label="Next Month"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="min-h-11 min-w-11 rounded-lg bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] flex items-center justify-center hover:bg-[#F2EFE8] dark:hover:bg-[#2C332C] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-start">
        {/* Calendar Card */}
        <section className="w-full bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 md:p-6 shadow-xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <abbr
                key={i}
                title={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i]}
                aria-label={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i]}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]"
              >
                {day}
              </abbr>
            ))}
          </div>

          {/* Date Grid */}
          <div role="group" aria-label={`${format(currentMonth, "MMMM yyyy")} dates`} className="grid grid-cols-7 gap-1 text-center">
            {leadingBlanks.map((_, i) => (
              <div key={`blank-${i}`} className="h-11 flex flex-col items-center justify-center opacity-20">
                <span className="text-xs text-[#77786F]">•</span>
              </div>
            ))}

            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isSelected = selectedDateStr === dateStr;
              const isToday = isSameDay(dateObj, new Date());
              const status = getDayStatus(dateStr);

              let dotColor = "bg-[#E3DED5] dark:bg-[#313831]"; // rest
              if (status === "complete") dotColor = "bg-[#46644B] dark:bg-[#8EAA92]";
              else if (status === "partial") dotColor = "bg-[#B16F4C] dark:bg-[#D49877]";

              return (
                <button
                  key={dateStr}
                  id={`calendar-day-${dateStr}`}
                  type="button"
                  aria-label={format(dateObj, "EEEE, MMMM d, yyyy")}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => setSelectedDateStr(dateStr)}
                  onKeyDown={(event) => handleCalendarKeyDown(event, dateObj)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                    isSelected
                      ? "bg-[#46644B] text-white shadow-xs"
                      : "hover:bg-[#F7F4EE] dark:hover:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD]"
                  } ${isToday && !isSelected ? "ring-1 ring-[#46644B]/40" : ""}`}
                >
                  <span className={`text-xs ${isSelected ? "font-semibold text-white" : "font-medium"}`}>
                    {format(dateObj, "d")}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? "bg-white/80" : dotColor
                    }`}
                  ></span>
                </button>
              );
            })}
          </div>

          {/* Minimal Legend */}
          <div className="mt-4 pt-3 border-t border-[#E3DED5]/80 dark:border-[#313831] flex items-center justify-center gap-4 text-xs text-[#77786F] dark:text-[#A6ABA0]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#46644B] dark:bg-[#8EAA92]"></span>
              <span>All Complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B16F4C]"></span>
              <span>Partial / Note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E3DED5] dark:bg-[#313831]"></span>
              <span>Rest day</span>
            </div>
          </div>
        </section>

        {/* Selected Day Detail View */}
        <section className="flex flex-col space-y-3 lg:sticky lg:top-24">
          {/* Day Status Card */}
          <div className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 shadow-xs space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                  Selected Day
                </span>
                <h2 className="font-serif text-lg sm:text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  <time dateTime={selectedDateStr} aria-label={selectedDayFormatted}>
                    {selectedDayCompact}
                  </time>
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/day?date=${selectedDateStr}`)}
                  className="min-h-11 px-2.5 rounded-lg border border-[#E3DED5] dark:border-[#313831] hover:bg-[#F2EFE8] text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] flex items-center gap-1"
                >
                  <span>Day View</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
                <span
                  className={`inline-flex min-h-11 items-center gap-1 px-2.5 rounded-full text-xs font-semibold ${
                    isSelectedDayComplete
                      ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92]"
                      : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0] border border-[#E3DED5] dark:border-[#313831]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isSelectedDayComplete ? "check" : "pending"}
                  </span>
                  {isSelectedDayComplete ? "Complete" : `${totalCompletedForSelectedDay}/${trackers.length} Checked`}
                </span>
              </div>
            </div>

            {savedMoodForSelectedDay && (
              <div className="pt-2 border-t border-[#E3DED5]/60 dark:border-[#313831] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#46644B] dark:text-[#8EAA92] text-[18px]">
                    psychology
                  </span>
                  <span className="text-[#77786F] dark:text-[#A6ABA0]">Emotional State:</span>
                  <span className="font-medium text-[#252B25] dark:text-[#E8EBDD] capitalize">
                    {savedMoodForSelectedDay}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tracked Goals Card */}
          <div className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#252B25] dark:text-[#E8EBDD] font-medium">Tracked Goals</h3>
              <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                {trackers.length} active
              </span>
            </div>

            {trackers.length === 0 ? (
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] text-center py-2">
                No active goals yet. Add one from Home to begin tracking.
              </p>
            ) : (
              <div className="space-y-2">
                {trackers.map((tracker) => {
                  const habitName = tracker.name;
                  const isChecked = Boolean(tracker.checkIns?.[selectedDateStr]);
                  return (
                    <div
                      key={tracker.id || habitName}
                      className="p-3 bg-[#F8F6F1] dark:bg-[#181B18] rounded-xl border border-[#E3DED5]/70 dark:border-[#313831] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
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
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#252B25] dark:text-[#E8EBDD]">
                            {getDisplayName(habitName)}
                          </span>
                          <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                            {isChecked ? "Checked for this date" : "Not recorded"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={isChecked ? `Remove ${getDisplayName(habitName)} check-in for ${selectedDayFormatted}` : `Record ${getDisplayName(habitName)} check-in for ${selectedDayFormatted}`}
                        aria-pressed={isChecked}
                        onClick={() => toggleCheckIn(habitName, selectedDateStr)}
                        className={`min-h-11 min-w-11 rounded-full flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-[#46644B] text-white shadow-xs"
                            : "border border-[#E3DED5] dark:border-[#313831] text-[#77786F] hover:border-[#46644B]"
                        }`}
                        title={isChecked ? "Mark as uncompleted" : "Mark as completed"}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isChecked ? "check" : "add"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes / Reflections for Selected Day */}
          <div className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold">
                Daily Note & Reflections
              </span>
              <button
                type="button"
                onClick={() => navigate(`/notes`)}
                className="text-xs font-semibold text-[#B16F4C] dark:text-[#D49877] hover:underline flex items-center gap-0.5"
              >
                Open Full Journal
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            {/* Note habit selector */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedNoteHabit("General")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedNoteHabit === "General"
                    ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                    : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] border-[#E3DED5] dark:border-[#313831]"
                }`}
              >
                General Note
              </button>
              {trackers.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedNoteHabit(t.name)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedNoteHabit.toLowerCase() === t.name.toLowerCase()
                      ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                      : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] border-[#E3DED5] dark:border-[#313831]"
                  }`}
                >
                  {getDisplayName(t.name)}
                </button>
              ))}
            </div>

            {isEditingNote ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={selectedDayNote}
                  onChange={(e) => setSelectedDayNote(e.target.value)}
                  placeholder={`Record your thoughts for ${selectedNoteHabit}...`}
                  className="w-full p-2.5 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-xs text-[#252B25] dark:text-[#E8EBDD] focus:outline-none focus:border-[#46644B] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 rounded-lg bg-[#46644B] text-white text-xs font-semibold hover:bg-[#38503C]"
                  >
                    Save Note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDayNote(getNote(selectedNoteHabit, selectedDateStr));
                      setIsEditingNote(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#E3DED5] dark:border-[#313831] text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {selectedDayNote ? (
                  <p className="font-serif italic text-sm text-[#252B25] dark:text-[#E8EBDD] leading-relaxed pt-1">
                    “{selectedDayNote}”
                  </p>
                ) : (
                  <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] pt-1">
                    No note recorded for {selectedNoteHabit} on this date.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingNote(true)}
                  className="mt-2 text-xs text-[#46644B] dark:text-[#8EAA92] font-semibold hover:underline block"
                >
                  {selectedDayNote ? "Edit Note" : "+ Add Note for this Date"}
                </button>
              </div>
            )}
          </div>
        </section>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
