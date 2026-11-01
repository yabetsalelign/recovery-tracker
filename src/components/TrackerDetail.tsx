import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { CanonicalTrackerRecord, DayRecord } from "../types/tracker";
import { useRecovery } from "../context/RecoveryContext";
import { calculateUnifiedMetrics, isValidDateFormat } from "../utils/unifiedCalculations";
import Layout from "./Layout";
import TrackerCalendar from "./TrackerCalendar";
import TrackerDayModal from "./TrackerDayModal";

interface Props { tracker: CanonicalTrackerRecord }
function targetDescription(tracker: CanonicalTrackerRecord): string {
  if (tracker.modality === "abstinence") return "Track days without the behavior.";
  if (tracker.modality === "frequency") return tracker.target.rule === "zero" ? "Record the quantity each day; zero counts as success." : tracker.target.rule === "at_most" ? `Keep to ${tracker.target.limit}${tracker.target.unit ? ` ${tracker.target.unit}` : ""} or less per day.` : "Record daily quantities.";
  if (tracker.modality === "daily_habit") return tracker.target.rule === "at_least" && (tracker.target.minimum !== 1 || tracker.target.unit) ? `Aim for at least ${tracker.target.minimum}${tracker.target.unit ? ` ${tracker.target.unit}` : ""} on completed days.` : "Mark completed days and planned rest days.";
  return tracker.target.rule === "before_time" ? `Keep this boundary by ${tracker.target.cutoff}.` : "Record whether you kept this boundary.";
}

const TrackerDetail: React.FC<Props> = ({ tracker }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedDate = searchParams.get("date");
  const initialDate = requestedDate && isValidDateFormat(requestedDate) ? requestedDate : format(new Date(), "yyyy-MM-dd");
  const { setTrackerDayRecord, saveTrackerGeneralNote } = useRecovery();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [editing, setEditing] = useState(false);
  const [generalNote, setGeneralNote] = useState(tracker.generalNote || "");
  const closeEditor = useCallback(() => setEditing(false), []);
  useEffect(() => { if (requestedDate && isValidDateFormat(requestedDate)) setSelectedDate(requestedDate); }, [requestedDate]);
  const metrics = useMemo(() => calculateUnifiedMetrics(tracker), [tracker]);
  const record = tracker.records[selectedDate];
  const canEditDate = selectedDate >= tracker.startDate && selectedDate <= format(new Date(), "yyyy-MM-dd");
  const editRecord = (next: DayRecord | null) => { setTrackerDayRecord(tracker.id, selectedDate, next); setEditing(false); };
  const progress = tracker.modality === "frequency" && tracker.target.rule === "at_most"
    ? `${metrics.totalActiveSuccessDays} target days`
    : tracker.modality === "daily_habit"
    ? `${metrics.totalActiveSuccessDays} completed days${metrics.totalPlannedSkips ? ` · ${metrics.totalPlannedSkips} planned rest` : ""}`
    : `${metrics.currentStreak} ${metrics.currentStreak === 1 ? "day" : "days"}`;
  const progressLabel = tracker.modality === "frequency" && tracker.target.rule === "at_most" ? "Within target" : tracker.modality === "daily_habit" ? "Activity" : tracker.modality === "frequency" ? "Consecutive zero days" : tracker.modality === "boundary" ? "Consecutive adherent days" : "Consecutive clean days";
  return <Layout>
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      <button type="button" onClick={() => navigate("/home")} className="min-h-11 px-3 rounded-full btn-secondary text-sm">← Home</button>
      <header className="space-y-2"><p className="text-sm text-[#78564F] dark:text-[#A99A8F]">{tracker.category}</p><h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight break-words">{tracker.name}</h1><p className="text-base text-[#78564F] dark:text-[#A99A8F]">{targetDescription(tracker)}</p></header>
      <section className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4 border-y border-[#D2C3BE]/70 dark:border-[#39302B]" aria-label="Current progress"><span className="font-serif text-3xl sm:text-4xl">{progress}</span><span className="text-sm text-[#78564F] dark:text-[#A99A8F]">{progressLabel}</span></section>
      <TrackerCalendar tracker={tracker} selectedDate={selectedDate} onSelect={(date) => { setSelectedDate(date); setEditing(true); }} />
      <section className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-xl">{format(new Date(`${selectedDate}T12:00:00`), "MMMM d, yyyy")}</h2><p className="text-sm text-[#78564F] dark:text-[#A99A8F]">{record?.status ? record.status.replace(/_/g, " ") : record?.note ? "Note only" : "No entry"}{!canEditDate && ` · ${selectedDate < tracker.startDate ? "Before this tracker began" : "Future date"}`}</p></div><button type="button" disabled={!canEditDate} onClick={() => setEditing(true)} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{record ? "Edit day" : "Record day"}</button></section>
      <section className="space-y-2"><h2 className="font-serif text-xl">Tracker notes</h2><textarea rows={4} value={generalNote} onChange={(event) => setGeneralNote(event.target.value)} className="tracker-field resize-y" placeholder="Notes about this tracker" aria-label="Tracker notes" /><button type="button" onClick={() => saveTrackerGeneralNote(tracker.id, generalNote)} className="btn-secondary">Save notes</button></section>
    </main>
    {editing && <TrackerDayModal tracker={tracker} date={selectedDate} initial={record} onClose={closeEditor} onSave={editRecord} />}
  </Layout>;
};
export default TrackerDetail;
