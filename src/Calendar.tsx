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

  const searchParams = new URLSearchParams(location.search);
  const paramDate = searchParams.get("date");

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return paramDate || contextSelectedDate || format(new Date(), "yyyy-MM-dd");
  });

  useEffect(() => {
    const date = new Date(`${selectedDateStr}T00:00:00`);
    if (!isNaN(date.getTime())) setCurrentMonth(date);
  }, [selectedDateStr]);

  const [selectedDayNote, setSelectedDayNote] = useState<string>("");
  const [selectedNoteHabit, setSelectedNoteHabit] = useState<string>(() => {
    return addictions.length > 0 ? addictions[0] : "General";
  });
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  useEffect(() => {
    if (selectedDateStr) {
      setContextSelectedDate(selectedDateStr);
    }
  }, [selectedDateStr, setContextSelectedDate]);

  useEffect(() => {
    const existing = getNote(selectedNoteHabit, selectedDateStr);
    setSelectedDayNote(existing);
    setIsEditingNote(false);
  }, [selectedDateStr, selectedNoteHabit, getNote]);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Monday start
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

    if (completed === total && total > 0) return "complete";
    if (completed > 0 || hasNote) return "partial";
    return "rest";
  };

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

  const selectedDateObj = new Date(selectedDateStr + "T00:00:00");
  const selectedDayFormatted = !isNaN(selectedDateObj.getTime())
    ? format(selectedDateObj, "EEEE, MMMM d, yyyy")
    : selectedDateStr;

  const totalCompletedForSelectedDay = trackers.filter((t) => t.checkIns?.[selectedDateStr]).length;
  const isSelectedDayComplete = totalCompletedForSelectedDay === trackers.length && trackers.length > 0;

  return (
    <Layout title="Calendar">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
        {/* Navigation & Month */}
        <header className="flex items-center justify-between">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Go to current month"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDateStr(format(today, "yyyy-MM-dd"));
              }}
              className="min-h-11 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#2A2522] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Previous Month"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="min-h-11 min-w-11 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#2A2522] text-[#261810] dark:text-[#F4EFEA] flex items-center justify-center hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label="Next Month"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="min-h-11 min-w-11 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#2A2522] text-[#261810] dark:text-[#F4EFEA] flex items-center justify-center hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.9fr)] lg:items-start">
          {/* Calendar Grid */}
          <section className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-4 sm:p-5 space-y-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold text-[#6B5B54] dark:text-[#A99A8F] py-1"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div role="group" aria-label={`${format(currentMonth, "MMMM yyyy")} dates`} className="grid grid-cols-7 gap-1">
              {leadingBlanks.map((_, i) => (
                <div key={`blank-${i}`} className="h-11" />
              ))}

              {daysThisMonth.map((dateObj) => {
                const dateStr = format(dateObj, "yyyy-MM-dd");
                const isSelected = selectedDateStr === dateStr;
                const isToday = isSameDay(dateObj, new Date());
                const status = getDayStatus(dateStr);

                let dotColor = "bg-transparent";
                if (status === "complete") dotColor = "bg-[#46644B] dark:bg-[#8EAA92]";
                else if (status === "partial") dotColor = "bg-[#D47A55]";

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
                    className={`h-11 rounded-xl flex flex-col items-center justify-center transition-colors relative ${
                      isSelected
                        ? "bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] font-semibold"
                        : "hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA]"
                    } ${isToday && !isSelected ? "border border-[#3D2C24]/30 dark:border-[#D47A55]/40" : ""}`}
                  >
                    <span className="text-xs">{format(dateObj, "d")}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? "bg-white dark:bg-[#211710]" : dotColor
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Subtle Legend */}
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#D2C3BE]/50 dark:border-[#39302B] text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#46644B] dark:bg-[#8EAA92]" />
                <span>All checked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D47A55]" />
                <span>Partial / note</span>
              </div>
            </div>
          </section>

          {/* Selected Day Details */}
          <section className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
              <div>
                <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                  <time dateTime={selectedDateStr}>{selectedDayFormatted}</time>
                </h2>
                <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] mt-0.5">
                  {trackers.length === 0
                    ? "No trackers"
                    : isSelectedDayComplete
                    ? "All trackers checked"
                    : `${totalCompletedForSelectedDay} of ${trackers.length} checked`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/day?date=${selectedDateStr}`)}
                className="min-h-11 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
              >
                Day view
              </button>
            </div>

            {/* Trackers list for selected day */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]">
                Trackers
              </h3>
              {trackers.length === 0 ? (
                <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                  No active trackers.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {trackers.map((tracker) => {
                    const habitName = tracker.name;
                    const isChecked = Boolean(tracker.checkIns?.[selectedDateStr]);
                    return (
                      <div
                        key={tracker.id || habitName}
                        className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18]"
                      >
                        <span className="text-xs font-medium text-[#261810] dark:text-[#F4EFEA]">
                          {getDisplayName(habitName)}
                        </span>
                        <button
                          type="button"
                          aria-label={
                            isChecked
                              ? `Uncheck ${getDisplayName(habitName)} for ${selectedDateStr}`
                              : `Check ${getDisplayName(habitName)} for ${selectedDateStr}`
                          }
                          aria-pressed={isChecked}
                          onClick={() => toggleCheckIn(habitName, selectedDateStr)}
                          className={`min-h-11 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            isChecked
                              ? "text-[#46644B] dark:text-[#8EAA92]"
                              : "text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isChecked ? "check" : "radio_button_unchecked"}
                          </span>
                          <span>{isChecked ? "Checked" : "Check in"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note for selected day */}
            <div className="pt-2 border-t border-[#D2C3BE]/50 dark:border-[#39302B] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]">
                  Reflection
                </h3>
                {!isEditingNote && selectedDayNote && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="text-xs font-semibold text-[#3D2C24] dark:text-[#D47A55] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={selectedDayNote}
                    onChange={(e) => setSelectedDayNote(e.target.value)}
                    placeholder="Write a reflection for this day..."
                    className="w-full p-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-xs text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE] dark:border-[#39302B] focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="min-h-11 px-3 py-1.5 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="min-h-11 px-3 py-1.5 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedDayNote ? (
                <p className="font-serif italic text-sm text-[#261810] dark:text-[#F4EFEA] leading-relaxed whitespace-pre-wrap bg-[#FBF2E7] dark:bg-[#1E1B18] p-3 rounded-xl">
                  “{selectedDayNote}”
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingNote(true)}
                  className="min-h-11 w-full py-2 px-3 rounded-xl border border-dashed border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#6B5B54] dark:text-[#A99A8F] hover:border-[#3D2C24] transition-colors text-center"
                >
                  + Add a reflection for this day
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
