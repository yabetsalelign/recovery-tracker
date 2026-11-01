import React, { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, startOfMonth, subMonths } from "date-fns";
import type { CanonicalTrackerRecord } from "../types/tracker";
import { evaluateDayRecord } from "../utils/unifiedCalculations";

interface Props { tracker: CanonicalTrackerRecord; selectedDate: string; onSelect: (date: string) => void }
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TrackerCalendar: React.FC<Props> = ({ tracker, selectedDate, onSelect }) => {
  const [month, setMonth] = useState(() => startOfMonth(new Date(`${selectedDate}T12:00:00`)));
  useEffect(() => { setMonth(startOfMonth(new Date(`${selectedDate}T12:00:00`))); }, [selectedDate]);
  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }), [month]);
  const blanks = (getDay(startOfMonth(month)) + 6) % 7;
  return <section className="vesper-card p-4 sm:p-5" aria-label="Tracker calendar">
    <header className="flex items-center justify-between gap-2 pb-3 border-b border-[#D2C3BE]/60 dark:border-[#39302B]">
      <h2 className="font-serif text-xl">{format(month, "MMMM yyyy")}</h2>
      <div className="flex gap-1">
        <button type="button" className="tracker-calendar-nav" aria-label="Previous month" onClick={() => setMonth((value) => subMonths(value, 1))}>‹</button>
        <button type="button" className="tracker-calendar-nav" aria-label="Next month" onClick={() => setMonth((value) => addMonths(value, 1))}>›</button>
      </div>
    </header>
    <div className="grid grid-cols-7 gap-1 mt-2" role="grid" aria-label={format(month, "MMMM yyyy")}>
      {weekdayNames.map((day) => <div key={day} role="columnheader" aria-label={day} className="h-8 flex items-center justify-center text-xs font-semibold text-[#78564F] dark:text-[#A99A8F]">{day.slice(0, 1)}</div>)}
      {Array.from({ length: blanks }, (_, index) => <div key={`blank-${index}`} role="presentation" className="min-w-0" />)}
      {days.map((day) => {
        const date = format(day, "yyyy-MM-dd");
        const evaluation = evaluateDayRecord(tracker, date);
        const record = tracker.records[date];
        const isToday = isSameDay(day, new Date());
        const disabled = date < tracker.startDate || date > format(new Date(), "yyyy-MM-dd");
        const state = evaluation.isPlannedSkip ? "planned rest day" : evaluation.isLapseOrBreach ? tracker.modality === "boundary" ? "breach" : "lapse" : evaluation.isSuccess ? "successful" : evaluation.isLogged ? "recorded" : record && !record.status ? "note only" : "unlogged";
        const labelValue = record?.value !== undefined ? `, ${record.value}` : record?.timestamp ? `, ${record.timestamp}` : "";
        return <button key={date} type="button" disabled={disabled} aria-label={`${format(day, "EEEE, MMMM d, yyyy")}: ${state}${labelValue}${isToday ? ", today" : ""}${selectedDate === date ? ", selected" : ""}`} aria-pressed={selectedDate === date} onClick={() => onSelect(date)} className={`tracker-calendar-day ${state.replace(/ /g, "-")} ${isToday ? "today" : ""} ${selectedDate === date ? "selected" : ""}`}>
          <span>{format(day, "d")}</span>
          {record?.value !== undefined && <span className="text-[10px] leading-none">{record.value}</span>}
          {record?.timestamp && <span className="text-[9px] leading-none">{record.timestamp}</span>}
        </button>;
      })}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-[#D2C3BE]/60 dark:border-[#39302B] text-xs text-[#78564F] dark:text-[#A99A8F]" aria-label="Calendar key">
      {[["successful", "Successful"], ["lapse", "Lapse / breach"], ["planned-rest-day", "Planned rest"], ["recorded", "Recorded"], ["unlogged", "Unlogged"]].map(([className, label]) => <span key={className} className="inline-flex items-center gap-1.5"><i className={`tracker-legend-dot ${className}`} />{label}</span>)}
    </div>
  </section>;
};
export default TrackerCalendar;
