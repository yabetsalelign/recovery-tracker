import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";
import { calculateUnifiedMetrics } from "./utils/unifiedCalculations";
import { useBackNavigation } from "./components/BackNavigation";

const milestoneSteps = [7, 14, 30, 60, 90];
const Streaks: React.FC = () => {
  const navigate = useNavigate();
  const { goBack } = useBackNavigation();
  const { canonicalTrackers } = useRecovery();
  const trackers = canonicalTrackers.filter((tracker) => !tracker.isArchived);
  return <Layout title="Milestones"><main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6">
    <header className="flex items-center justify-between gap-3"><div><h1 className="font-serif text-3xl sm:text-4xl font-medium">Milestones</h1><p className="text-sm text-[#78564F] dark:text-[#A99A8F] mt-1">Meaningful progress for each kind of tracking.</p></div><button type="button" onClick={() => goBack("/progress")} className="min-h-11 px-3.5 rounded-full btn-secondary text-sm">Progress</button></header>
    {trackers.length === 0 ? <section className="vesper-card p-6 text-center space-y-3"><p className="text-sm text-[#78564F] dark:text-[#A99A8F]">No active trackers yet.</p><button type="button" onClick={() => navigate("/add-addiction")} className="min-h-11 px-5 btn-primary rounded-full text-sm">Add a tracker</button></section> : <div className="space-y-3">{trackers.map((tracker) => {
      const metrics = calculateUnifiedMetrics(tracker);
      const isHabit = tracker.modality === "daily_habit";
      const value = isHabit ? metrics.totalActiveSuccessDays : metrics.currentStreak;
      const title = tracker.modality === "abstinence" ? "Consecutive clean days" : tracker.modality === "frequency" ? tracker.target.rule === "zero" ? "Consecutive zero-count days" : "Consecutive target days" : tracker.modality === "boundary" ? "Consecutive adherent days" : "Completed days";
      const next = milestoneSteps.find((step) => step > value) ?? 90;
      const percent = Math.min(100, Math.round((value / next) * 100));
      return <article key={tracker.id} className="vesper-card p-5 space-y-3"><div className="flex items-center justify-between gap-3"><div><button type="button" onClick={() => navigate(`/tracker/${encodeURIComponent(tracker.id)}`)} className="min-h-11 text-left font-serif text-lg hover:underline">{tracker.name}</button><p className="text-xs text-[#78564F] dark:text-[#A99A8F]">{title}</p></div><div className="text-right"><span className="font-serif text-2xl">{value}</span><span className="ml-1 text-xs text-[#78564F] dark:text-[#A99A8F]">{isHabit ? "completed" : "days"}</span></div></div><div className="w-full bg-[#F6EDE2] dark:bg-[#1E1B18] h-2 rounded-full overflow-hidden" role="progressbar" aria-label={`${tracker.name}: ${title}`} aria-valuemin={0} aria-valuemax={next} aria-valuenow={Math.min(value, next)}><div className="bg-[#D47A55] h-full rounded-full" style={{ width: `${percent}%` }} /></div><p className="text-xs text-[#78564F] dark:text-[#A99A8F]">{isHabit ? `${metrics.totalPlannedSkips} planned rest days kept separate` : `Next milestone: ${next} ${next === 1 ? "day" : "days"}`}</p></article>;
    })}</div>}
  </main></Layout>;
};
export default Streaks;
