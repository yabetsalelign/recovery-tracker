import React, { useMemo, useState } from "react";
import { eachDayOfInterval, format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";
import { calculateUnifiedMetrics, calculateUnifiedLongestStreak, evaluateDayRecord } from "./utils/unifiedCalculations";

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { canonicalTrackers, generalNotes } = useRecovery();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [timeHorizon, setTimeHorizon] = useState("30");
  const today = format(new Date(), "yyyy-MM-dd");
  const days = timeHorizon === "all" ? 0 : Number(timeHorizon);
  const activeTrackers = canonicalTrackers.filter((tracker) => !tracker.isArchived);

  const trackerSummaries = useMemo(() => activeTrackers.map((tracker) => {
    const metrics = calculateUnifiedMetrics(tracker, today);
    const windowStart = days === 0 ? tracker.startDate : format(new Date(Math.max(new Date(`${tracker.startDate}T12:00:00`).getTime(), subDays(new Date(), days - 1).getTime())), "yyyy-MM-dd");
    const range = windowStart <= today ? eachDayOfInterval({ start: new Date(`${windowStart}T12:00:00`), end: new Date(`${today}T12:00:00`) }) : [];
    const evaluations = range.map((date) => evaluateDayRecord(tracker, format(date, "yyyy-MM-dd")));
    const countRecords = range.reduce((total, date) => total + (tracker.records[format(date, "yyyy-MM-dd")]?.status === "recorded" ? 1 : 0), 0);
    const quantityTotal = range.reduce((total, date) => {
      const record = tracker.records[format(date, "yyyy-MM-dd")];
      return total + (record?.status === "recorded" && typeof record.value === "number" ? record.value : 0);
    }, 0);
    return {
      tracker,
      metrics,
      window: {
        successes: evaluations.filter((entry) => entry.isSuccess).length,
        planned: evaluations.filter((entry) => entry.isPlannedSkip).length,
        lapses: evaluations.filter((entry) => entry.isLapseOrBreach).length,
        unlogged: evaluations.filter((entry) => !entry.isLogged && !entry.note).length,
        countRecords,
        quantityTotal,
      },
    };
  }), [activeTrackers, today, days]);

  const timeline = useMemo(() => eachDayOfInterval({ start: subDays(new Date(), 20), end: new Date() }).map((date) => {
    const day = format(date, "yyyy-MM-dd");
    const evaluations = activeTrackers.filter((tracker) => !tracker.isArchived && tracker.startDate <= day).map((tracker) => evaluateDayRecord(tracker, day));
    const successes = evaluations.filter((entry) => entry.isSuccess).length;
    const rests = evaluations.filter((entry) => entry.isPlannedSkip).length;
    const lapses = evaluations.filter((entry) => entry.isLapseOrBreach).length;
    const notes = Boolean(generalNotes[day]) || activeTrackers.some((tracker) => Boolean(tracker.records[day]?.note));
    return { date, key: day, successes, rests, lapses, notes };
  }), [activeTrackers, generalNotes]);
  const hasTimelineActivity = timeline.some((day) => day.successes + day.rests + day.lapses > 0 || day.notes);
  const windowLabel = timeHorizon === "all" ? "Since each tracker began" : `Last ${days} days`;

  const primaryMetric = (modality: string, metrics: ReturnType<typeof calculateUnifiedMetrics>, window: { successes: number; planned: number; lapses: number }) => {
    if (modality === "abstinence") return { value: `${window.successes} clean`, detail: `${metrics.currentStreak} consecutive now` };
    if (modality === "frequency") return { value: `${window.successes} target days`, detail: `${metrics.currentStreak} day target streak` };
    if (modality === "daily_habit") return { value: `${window.successes} completed`, detail: `${window.planned} planned rest days` };
    return { value: `${window.successes} adherent`, detail: `${window.lapses} breaches` };
  };

  return <Layout title="Progress">
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      <header className="space-y-1"><h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight">Progress</h1><p className="text-sm text-[#78564F] dark:text-[#A99A8F]">A quiet view of the days you have recorded.</p></header>
      <div role="group" aria-label="Select time horizon" className="p-1 rounded-full bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE]/50 dark:border-[#39302B] flex gap-1">{[{ id: "7", label: "7 days" }, { id: "30", label: "30 days" }, { id: "90", label: "90 days" }, { id: "all", label: "All time" }].map((item) => <button key={item.id} type="button" aria-pressed={timeHorizon === item.id} onClick={() => setTimeHorizon(item.id)} className={`min-h-11 flex-1 px-2 rounded-full text-xs font-semibold ${timeHorizon === item.id ? "bg-[#FDD0C6] text-[#261810]" : "text-[#78564F] dark:text-[#A99A8F]"}`}>{item.label}</button>)}</div>

      <section aria-labelledby="tracker-progress-heading" className="space-y-3"><div className="flex items-baseline justify-between gap-3"><h2 id="tracker-progress-heading" className="font-serif text-xl">By tracker</h2><span className="text-xs text-[#78564F] dark:text-[#A99A8F]">{windowLabel}</span></div>
        {trackerSummaries.length === 0 ? <p className="text-sm text-[#78564F] dark:text-[#A99A8F]">Add a tracker to see your progress here.</p> : trackerSummaries.map(({ tracker, metrics, window }) => {
          const primary = primaryMetric(tracker.modality, metrics, window);
          return <article key={tracker.id} className="border-b border-[#D2C3BE]/70 dark:border-[#39302B] py-3"><button type="button" onClick={() => navigate(`/tracker/${encodeURIComponent(tracker.id)}`)} className="text-left min-h-11 font-serif text-lg font-medium hover:underline">{tracker.name}</button><p className="text-sm text-[#78564F] dark:text-[#A99A8F]">{primary.value} · {primary.detail}</p><p className="text-xs text-[#78564F] dark:text-[#A99A8F]">Longest historical streak: {calculateUnifiedLongestStreak(tracker, today)} days</p><p className="mt-1 text-xs text-[#78564F] dark:text-[#A99A8F]">{window.successes} successful · {window.planned} planned rest · {window.lapses} lapse or breach · {window.unlogged} unlogged{tracker.modality === "frequency" ? ` · ${window.countRecords} days logged, ${window.quantityTotal} ${tracker.target.rule === "at_most" ? tracker.target.unit || "units" : "total count"}` : ""}</p></article>;
        })}
      </section>

      <section aria-labelledby="timeline-heading" className="vesper-card p-5 sm:p-6 space-y-4"><div><h2 id="timeline-heading" className="font-serif text-xl">Recent days</h2><p className="text-xs text-[#78564F] dark:text-[#A99A8F]">Select a day to inspect tracker activity and reflections.</p></div>{!hasTimelineActivity && <p className="text-sm text-[#78564F] dark:text-[#A99A8F]">Your recent activity will appear as you add records.</p>}<div aria-label="Twenty-one day tracker activity timeline" className="flex h-24 w-full items-end justify-between gap-1">{timeline.map(({ date, key, successes, rests, lapses, notes }, index) => { const activity = successes + rests + lapses; const height = activity ? `${Math.max(18, Math.min(100, activity * 20))}%` : notes ? "12%" : "4%"; const color = lapses ? "bg-[#D47A55]" : successes ? "bg-[#46644B] dark:bg-[#8EAA92]" : rests ? "bg-[#D9C4AC]" : notes ? "bg-[#FDD0C6]" : "bg-[#E9E0D8] dark:bg-[#39302B]"; const label = `${format(date, "EEE, MMM d")}: ${successes} successful, ${rests} planned rest, ${lapses} lapse or breach${notes ? ", note" : ""}`; return <button key={key} type="button" aria-label={label} aria-pressed={selectedDay === key} onClick={() => setSelectedDay(key)} className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-sm focus-visible:outline focus-visible:outline-2 ${selectedDay === key ? "outline outline-2 outline-[#78564F]" : ""}`}><div className={`w-full rounded-t-sm ${color}`} style={{ height }} aria-hidden="true" /><span className="h-3 text-[10px] text-[#78564F] dark:text-[#A99A8F]">{index === 0 || index === 20 || (index + 1) % 5 === 0 ? format(date, "d") : ""}</span></button>; })}</div><div className="flex flex-wrap gap-4 border-t border-[#D2C3BE]/60 dark:border-[#39302B] pt-3 text-xs text-[#78564F] dark:text-[#A99A8F]"><span>Successful activity</span><span>Planned rest stays separate</span><span>Lapses / breaches</span><span>Unlogged days are not failures</span></div>
        {selectedDay && <section aria-live="polite" aria-label={`Details for ${selectedDay}`} className="border-t border-[#D2C3BE]/60 dark:border-[#39302B] pt-4 space-y-2"><h3 className="font-serif text-lg">{format(new Date(`${selectedDay}T12:00:00`), "EEEE, MMMM d")}</h3>{activeTrackers.filter((tracker) => tracker.startDate <= selectedDay).map((tracker) => { const result = evaluateDayRecord(tracker, selectedDay); const record = tracker.records[selectedDay]; const state = result.isPlannedSkip ? "Planned rest" : result.isLapseOrBreach ? "Lapse or breach" : result.isSuccess ? "Successful" : record?.status ? "Recorded" : record?.note ? "Note only" : "Unlogged"; return <p key={tracker.id} className="text-sm text-[#78564F] dark:text-[#A99A8F]"><strong className="text-[#261810] dark:text-[#F4EFEA]">{tracker.name}:</strong> {state}{record?.value !== undefined ? ` · ${record.value} ${tracker.target.rule === "at_most" ? tracker.target.unit || "units" : ""}` : ""}{record?.note ? ` · ${record.note}` : ""}</p>; })}{generalNotes[selectedDay] && <p className="text-sm"><strong>Reflection:</strong> {generalNotes[selectedDay]}</p>}{!activeTrackers.some((tracker) => tracker.startDate <= selectedDay) && <p className="text-sm">No trackers had started on this date.</p>}</section>}
      </section>

      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => navigate("/streaks")} className="min-h-11 px-4 rounded-full btn-secondary text-sm">Milestones</button><button type="button" onClick={() => navigate("/counter")} className="min-h-11 px-4 rounded-full btn-secondary text-sm">Day counter</button></div>
    </main>
  </Layout>;
};
export default Progress;
