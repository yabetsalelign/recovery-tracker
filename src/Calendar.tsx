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
import { evaluateDayRecord } from "./utils/unifiedCalculations";

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { discreetMode } = useTheme();
  const {
    canonicalTrackers,
    emotionalWeather,
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
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  useEffect(() => {
    if (selectedDateStr) {
      setContextSelectedDate(selectedDateStr);
    }
  }, [selectedDateStr, setContextSelectedDate]);

  useEffect(() => {
    const existing = getNote("General", selectedDateStr);
    setSelectedDayNote(existing);
    setIsEditingNote(false);
  }, [selectedDateStr, getNote]);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Monday start
  const startDayIndex = getDay(startOfMonth(currentMonth));
  const leadingBlanks = Array.from({ length: (startDayIndex + 6) % 7 });

  const handleSaveNote = () => {
    saveNote("General", selectedDateStr, selectedDayNote);
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

  const eligibleTrackers = canonicalTrackers.filter((tracker) => !tracker.isArchived && tracker.startDate <= selectedDateStr);
  const getDaySummary = (dateStr: string) => {
    const eligible = canonicalTrackers.filter((tracker) => !tracker.isArchived && tracker.startDate <= dateStr);
    const evaluations = eligible.map((tracker) => ({ tracker, evaluation: evaluateDayRecord(tracker, dateStr) }));
    return {
      evaluations,
      successes: evaluations.filter(({ evaluation }) => evaluation.isSuccess).length,
      planned: evaluations.filter(({ evaluation }) => evaluation.isPlannedSkip).length,
      lapses: evaluations.filter(({ evaluation }) => evaluation.isLapseOrBreach).length,
      noteOnly: evaluations.filter(({ tracker, evaluation }) => !evaluation.isLogged && Boolean(tracker.records[dateStr]?.note)).length,
      unlogged: evaluations.filter(({ tracker, evaluation }) => !evaluation.isLogged && !tracker.records[dateStr]?.note).length,
      journal: Boolean(getNote("General", dateStr).trim()),
      mood: Boolean(emotionalWeather[dateStr]?.checkedIn),
    };
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

  const selectedSummary = getDaySummary(selectedDateStr);

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
              className="min-h-11 px-3.5 rounded-full border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#24201D] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors shadow-xs"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Previous Month"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="min-h-11 min-w-11 rounded-full border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#24201D] text-[#261810] dark:text-[#F4EFEA] flex items-center justify-center hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label="Next Month"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="min-h-11 min-w-11 rounded-full border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#24201D] text-[#261810] dark:text-[#F4EFEA] flex items-center justify-center hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.9fr)] lg:items-start">
          {/* Calendar Grid */}
          <section className="bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-4 sm:p-5 shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold text-[#78564F] dark:text-[#A99A8F] py-1"
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
                const summary = getDaySummary(dateStr);
                const dayLabels = [
                  summary.successes > 0 && "successful",
                  summary.planned > 0 && "planned rest",
                  summary.lapses > 0 && "lapse or breach",
                  summary.noteOnly > 0 && "tracker note",
                  summary.journal && "journal reflection",
                  summary.mood && "mood check-in",
                  summary.unlogged > 0 && "unlogged",
                ].filter(Boolean);
                const dots = [
                  ...(summary.successes ? ["bg-[#46644B] dark:bg-[#8EAA92]"] : []),
                  ...(summary.planned ? ["border border-dashed border-[#78564F]"] : []),
                  ...(summary.lapses ? ["bg-[#D47A55]"] : []),
                  ...(summary.noteOnly || summary.journal || summary.mood ? ["bg-[#FDD0C6]"] : []),
                ];

                return (
                  <button
                    key={dateStr}
                    id={`calendar-day-${dateStr}`}
                    type="button"
                    aria-label={`${format(dateObj, "EEEE, MMMM d, yyyy")}: ${dayLabels.length ? dayLabels.join(", ") : "no tracker activity"}`}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => setSelectedDateStr(dateStr)}
                    onKeyDown={(event) => handleCalendarKeyDown(event, dateObj)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                      isSelected
                        ? "btn-primary font-bold shadow-xs"
                        : "hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA]"
                    } ${isToday && !isSelected ? "border-2 border-[#FDD0C6] dark:border-[#D47A55]/70" : ""}`}
                  >
                    <span className="text-xs">{format(dateObj, "d")}</span>
                    <span className="flex h-2 gap-0.5 mt-0.5" aria-hidden="true">{dots.slice(0, 4).map((color, index) => <i key={index} className={`w-1.5 h-1.5 rounded-full ${color}`} />)}</span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 border-t border-[#D2C3BE]/60 dark:border-[#39302B] text-xs text-[#78564F] dark:text-[#A99A8F]">
              <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[#46644B] dark:bg-[#8EAA92]" />Success</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full border border-dashed border-[#78564F]" />Planned rest</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[#D47A55]" />Lapse / breach</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[#FDD0C6]" />Tracker note</span>
            </div>
          </section>

          {/* Selected Day Details */}
          <section className="bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 sm:p-6 shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D2C3BE]/60 dark:border-[#39302B]">
              <div>
                <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                  <time dateTime={selectedDateStr}>{selectedDayFormatted}</time>
                </h2>
                <p className="text-xs text-[#78564F] dark:text-[#A99A8F] mt-0.5">
                  {eligibleTrackers.length === 0 ? "No trackers active yet" : `${selectedSummary.successes} successful · ${selectedSummary.planned} planned rest · ${selectedSummary.lapses} lapses or breaches · ${selectedSummary.unlogged} unlogged`}
                </p>
                {emotionalWeather[selectedDateStr]?.checkedIn && <p className="text-xs text-[#78564F] dark:text-[#A99A8F] mt-1">Mood check-in: {emotionalWeather[selectedDateStr].mood}</p>}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/day?date=${selectedDateStr}`)}
                className="min-h-11 px-3.5 rounded-full border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
              >
                Day view
              </button>
            </div>

            {/* Trackers list for selected day */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">
                Trackers
              </h3>
              {eligibleTrackers.length === 0 ? (
                <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
                  No active trackers.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSummary.evaluations.map(({ tracker, evaluation }) => {
                    const record = tracker.records[selectedDateStr];
                    const status = evaluation.isPlannedSkip ? "Planned rest" : evaluation.isLapseOrBreach ? (tracker.modality === "boundary" ? "Breach" : "Lapse") : evaluation.isSuccess ? "Successful" : record?.note ? "Note only" : "Unlogged";
                    return (
                      <div
                        key={tracker.id}
                        className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE]/40 dark:border-[#39302B]/60"
                      >
                        <div className="min-w-0"><span className="text-xs font-medium text-[#261810] dark:text-[#F4EFEA]">{getDisplayName(tracker.name)} · {status}</span>{(record?.value !== undefined || record?.timestamp) && <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">{record?.value !== undefined ? record.value : record?.timestamp}</p>}{record?.note && <p className="text-xs text-[#78564F] dark:text-[#A99A8F] truncate">{record.note}</p>}</div>
                        <button
                          type="button"
                          aria-label={`Open ${getDisplayName(tracker.name)} on ${selectedDateStr}`}
                          onClick={() => navigate(`/tracker/${encodeURIComponent(tracker.id)}?date=${selectedDateStr}`)}
                          className="min-h-11 px-3 py-1 rounded-full btn-secondary text-xs font-semibold"
                        >
                          Open day
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note for selected day */}
            <div className="pt-2 border-t border-[#D2C3BE]/60 dark:border-[#39302B] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">
                  Reflection
                </h3>
                {!isEditingNote && selectedDayNote && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="text-xs font-semibold text-[#78564F] dark:text-[#D47A55] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingNote ? (
                <div className="space-y-2.5">
                  <textarea
                    rows={4}
                    value={selectedDayNote}
                    onChange={(e) => setSelectedDayNote(e.target.value)}
                    placeholder="Write a reflection for this day..."
                    className="w-full p-3.5 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-xs font-serif text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE] dark:border-[#39302B] focus:outline-none focus:border-[#78564F] dark:focus:border-[#D47A55] resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="min-h-11 px-4 py-1.5 rounded-full btn-primary text-xs font-semibold"
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="min-h-11 px-4 py-1.5 rounded-full border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedDayNote ? (
                <p className="font-serif italic text-sm text-[#261810] dark:text-[#F4EFEA] leading-relaxed whitespace-pre-wrap bg-[#FBF2E7] dark:bg-[#1E1B18] p-3.5 rounded-xl border border-[#D2C3BE]/50 dark:border-[#39302B]">
                  “{selectedDayNote}”
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingNote(true)}
                  className="min-h-11 w-full py-2 px-3 rounded-xl border border-dashed border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#78564F] dark:text-[#A99A8F] hover:border-[#78564F] transition-colors text-center"
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
