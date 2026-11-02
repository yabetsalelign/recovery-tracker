import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";
import type { TrackerRecord } from "./types";
import type { TrackerCategory, TrackingModality, TrackerTarget } from "./types/tracker";
import { getHabitIcon } from "./utils/habitIcons";
import { useBackNavigation } from "./components/BackNavigation";
import { useOverlayBackHandler } from "./components/BackNavigation";

const AddAddiction: React.FC = () => {
  const navigate = useNavigate();
  const { goBack } = useBackNavigation();
  const { discreetMode } = useTheme();
  const {
    trackers,
    canonicalTrackers,
    addGoal,
    updateGoal,
    deleteGoal,
    calculateStreak,
  } = useRecovery();

  const [activeTab, setActiveTab] = useState<"active" | "new">("active");

  // Form state
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<TrackerCategory>("Personal Goal");
  const [modality, setModality] = useState<TrackingModality>("abstinence");
  const [frequencyRule, setFrequencyRule] = useState<"zero" | "at_most">("zero");
  const [limit, setLimit] = useState("2");
  const [frequencyUnit, setFrequencyUnit] = useState("");
  const [useMinimum, setUseMinimum] = useState(false);
  const [minimum, setMinimum] = useState("10");
  const [habitUnit, setHabitUnit] = useState("pages");
  const [cutoff, setCutoff] = useState("22:00");
  const [rationale, setRationale] = useState("");
  const [formError, setFormError] = useState<string>("");

  // Edit modal state
  const [editingTracker, setEditingTracker] = useState<TrackerRecord | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editModality, setEditModality] = useState<TrackingModality>("abstinence");
  const [editFrequencyRule, setEditFrequencyRule] = useState<"zero" | "at_most">("zero");
  const [editLimit, setEditLimit] = useState("2");
  const [editFrequencyUnit, setEditFrequencyUnit] = useState("");
  const [editMinimum, setEditMinimum] = useState("1");
  const [editHabitUnit, setEditHabitUnit] = useState("");
  const [editCutoff, setEditCutoff] = useState("22:00");
  const [editError, setEditError] = useState<string>("");

  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<string | null>(null);
  const closeTopDialog = useCallback(() => {
    if (editingTracker) setEditingTracker(null);
    else if (deleteConfirmGoal) setDeleteConfirmGoal(null);
  }, [deleteConfirmGoal, editingTracker]);
  useOverlayBackHandler(Boolean(editingTracker || deleteConfirmGoal), closeTopDialog);

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

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmed = goalTitle.trim();
    if (!trimmed) {
      setFormError("Goal title cannot be empty.");
      return;
    }

    let target: TrackerTarget;
    if (modality === "abstinence") target = { rule: "zero" };
    else if (modality === "frequency") {
      if (frequencyRule === "at_most" && (limit.trim() === "" || !Number.isFinite(Number(limit)) || Number(limit) < 0)) {
        setFormError("Enter a valid maximum quantity of zero or more.");
        return;
      }
      target = frequencyRule === "zero" ? { rule: "zero" } : { rule: "at_most", limit: Number(limit), ...(frequencyUnit.trim() ? { unit: frequencyUnit.trim() } : {}) };
    } else if (modality === "daily_habit") {
      if (useMinimum && (!Number.isFinite(Number(minimum)) || Number(minimum) <= 0)) {
        setFormError("Enter a minimum quantity greater than zero.");
        return;
      }
      target = { rule: "at_least", minimum: useMinimum ? Number(minimum) : 1, ...(useMinimum && habitUnit.trim() ? { unit: habitUnit.trim() } : {}) };
    } else {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoff)) {
        setFormError("Choose a valid 24-hour cutoff time.");
        return;
      }
      target = { rule: "before_time", cutoff };
    }

    const res = addGoal({
      title: trimmed,
      modality,
      category,
      target,
      ...(startDate ? { startDate } : {}),
      rationale,
    });

    if (!res.success) {
      setFormError(res.error || "Failed to create goal.");
      return;
    }

    setGoalTitle("");
    setRationale("");
    setActiveTab("active");
  };

  const openEditModal = (tracker: TrackerRecord) => {
    setEditingTracker(tracker);
    setEditName(tracker.name);
    const canonical = canonicalTrackers.find((item) => item.id === String(tracker.id));
    const target = canonical?.target;
    setEditModality(canonical?.modality || (tracker.modality as TrackingModality) || "abstinence");
    setEditFrequencyRule(target?.rule === "at_most" ? "at_most" : "zero");
    setEditLimit(String(target?.rule === "at_most" ? target.limit : tracker.limitVal ?? 2));
    setEditFrequencyUnit(target?.rule === "at_most" ? target.unit || "" : "");
    setEditMinimum(String(target?.rule === "at_least" ? target.minimum : 1));
    setEditHabitUnit(target?.rule === "at_least" ? target.unit || "" : "");
    setEditCutoff(target?.rule === "before_time" ? target.cutoff : tracker.curfewTime || "22:00");
    setEditError("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTracker) return;

    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Goal title cannot be empty.");
      return;
    }

    let target: TrackerTarget;
    if (editModality === "abstinence") target = { rule: "zero" };
    else if (editModality === "frequency") {
      if (editFrequencyRule === "at_most" && (!Number.isFinite(Number(editLimit)) || Number(editLimit) < 0)) { setEditError("Enter a valid maximum quantity of zero or more."); return; }
      target = editFrequencyRule === "zero" ? { rule: "zero" } : { rule: "at_most", limit: Number(editLimit), ...(editFrequencyUnit.trim() ? { unit: editFrequencyUnit.trim() } : {}) };
    } else if (editModality === "daily_habit") {
      if (!Number.isFinite(Number(editMinimum)) || Number(editMinimum) <= 0) { setEditError("Enter a minimum quantity greater than zero."); return; }
      target = { rule: "at_least", minimum: Number(editMinimum), ...(editHabitUnit.trim() ? { unit: editHabitUnit.trim() } : {}) };
    } else {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(editCutoff)) { setEditError("Choose a valid 24-hour cutoff time."); return; }
      target = { rule: "before_time", cutoff: editCutoff };
    }
    const res = updateGoal(String(editingTracker.id), {
      name: trimmed,
      modality: editModality,
      target,
    });

    if (!res.success) {
      setEditError(res.error || "Failed to update goal.");
      return;
    }

    setEditingTracker(null);
  };

  const handleDeleteGoal = (trackerId: string) => {
    deleteGoal(trackerId);
    setDeleteConfirmGoal(null);
  };

  return (
    <Layout title="Trackers">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
              Trackers
            </h1>
            <p className="text-xs text-[#78564F] dark:text-[#A99A8F] mt-0.5">
              Manage what you are tracking and add new commitments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => goBack("/home")}
            className="min-h-11 px-3.5 rounded-full border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#24201D] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors shadow-xs"
          >
            ← Home
          </button>
        </header>

        {/* View Tabs */}
        <div role="tablist" aria-label="Goal views" className="p-1 rounded-full bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE]/50 dark:border-[#39302B] flex items-center gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            className={`min-h-11 flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "active"
                ? "bg-[#FDD0C6] text-[#261810] dark:text-[#1A1614] font-bold shadow-xs"
                : "text-[#78564F] dark:text-[#A99A8F] hover:text-[#261810] dark:hover:text-[#F4EFEA]"
            }`}
          >
            <span>Manage trackers</span>
            <span className="text-xs opacity-75">({trackers.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "new"}
            onClick={() => {
              setFormError("");
              setActiveTab("new");
            }}
            className={`min-h-11 flex-1 py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "new"
                ? "bg-[#FDD0C6] text-[#261810] dark:text-[#1A1614] font-bold shadow-xs"
                : "text-[#78564F] dark:text-[#A99A8F] hover:text-[#261810] dark:hover:text-[#F4EFEA]"
            }`}
          >
            <span>Add a tracker</span>
          </button>
        </div>

        {/* TAB 1: MANAGE GOALS */}
        {activeTab === "active" && (
          <div className="space-y-3">
            {trackers.length === 0 ? (
              <div className="bg-white dark:bg-[#24201D] rounded-2xl p-6 text-center border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-3">
                <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
                  No trackers yet. Add your first tracker to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("new")}
                  className="min-h-11 px-4 py-2 rounded-full btn-primary text-xs font-semibold inline-flex items-center gap-1"
                >
                  <span>Add a tracker</span>
                </button>
              </div>
            ) : (
              trackers.map((tracker) => {
                const habitName = tracker.name;
                const streak = calculateStreak(tracker.checkIns);
                const lower = habitName.toLowerCase();
                const isSpecialized = lower === "sesh" || lower === "weed" || lower === "porn";

                return (
                  <article
                    key={tracker.id || habitName}
                    className="bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-4 sm:p-5 shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="icon-badge">
                          <span className="material-symbols-outlined text-[20px]">
                            {getHabitIcon(habitName)}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-semibold text-sm text-[#261810] dark:text-[#F4EFEA]">
                            {getDisplayName(habitName)}
                          </h2>
                          <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
                            {isSpecialized ? "Daily count tracking" : "Daily check-in"} · {streak} {streak === 1 ? "day streak" : "days streak"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${getDisplayName(habitName)}`}
                          onClick={() => openEditModal(tracker)}
                          className="min-h-11 px-3 rounded-full text-xs font-semibold text-[#78564F] dark:text-[#D47A55] hover:text-[#261810] dark:hover:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${getDisplayName(habitName)}`}
                          onClick={() => setDeleteConfirmGoal(String(tracker.id))}
                          className="min-h-11 px-3 rounded-full text-xs font-semibold text-[#BA1A1A] dark:text-[#F0A08D] hover:bg-[#FDECEB] dark:hover:bg-[#4A2B25] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D2C3BE]/60 dark:border-[#39302B] text-xs">
                      <span className="text-[#78564F] dark:text-[#A99A8F]">
                        Started {tracker.startDate || "recently"}
                      </span>
                      <div className="flex items-center gap-3">
                        {isSpecialized && (
                          <button
                            type="button"
                            onClick={() => navigate(`/tracker/${encodeURIComponent(String(tracker.id))}`)}
                            className="text-[#78564F] dark:text-[#D47A55] font-semibold hover:underline"
                          >
                            Open tracker →
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/tracker/${encodeURIComponent(String(tracker.id))}`)}
                          className="text-[#78564F] dark:text-[#D47A55] font-semibold hover:underline"
                        >
                          Details →
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/notes")}
                          className="text-[#78564F] dark:text-[#D47A55] font-semibold hover:underline"
                        >
                          Write reflection →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ADD A GOAL */}
        {activeTab === "new" && (
          <form
            onSubmit={handleSaveGoal}
            className="bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 sm:p-6 shadow-[0_1px_3px_rgba(38,24,16,0.04)] space-y-4"
          >
            <div className="space-y-1 pb-3 border-b border-[#D2C3BE]/60 dark:border-[#39302B]">
              <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">Add a new tracker</h2>
              <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">Choose how you want to record each day.</p>
            </div>

            {formError && (
              <div className="p-3 bg-[#FDECEB] dark:bg-[#4A2B25] text-[#BA1A1A] dark:text-[#F0A08D] rounded-xl text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="goal-name-input" className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">
                Tracker name
              </label>
              <input
                id="goal-name-input"
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Cigarettes, Reading, Evening walk"
                className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE]/60 dark:border-[#39302B] focus:outline-none focus:border-[#78564F] dark:focus:border-[#D47A55]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tracker-category" className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Category</label>
              <select id="tracker-category" value={category} onChange={(event) => setCategory(event.target.value as TrackerCategory)} className="w-full min-h-11 px-3.5 py-2 text-sm rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE]/60 dark:border-[#39302B]">
                {["Substance Sobriety", "Digital & Behavioral", "Emotional & Mental", "Physical Health", "Personal Goal"].map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>

            <fieldset className="space-y-2">
              <legend className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">How will you track it?</legend>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["abstinence", "Abstinence", "Confirm clean days or record a lapse."],
                  ["frequency", "Frequency", "Record a daily quantity, including zero."],
                  ["daily_habit", "Daily habit", "Mark completed days and planned rest."],
                  ["boundary", "Boundary", "Keep a time based limit or record a breach."],
                ] as [TrackingModality, string, string][]).map(([value, label, help]) => <button key={value} type="button" aria-pressed={modality === value} onClick={() => setModality(value)} className={`min-h-16 p-3 rounded-xl text-left border ${modality === value ? "border-[#D47A55] bg-[#FDD0C6]/50 dark:bg-[#70493B]/50" : "border-[#D2C3BE] dark:border-[#39302B]"}`}><span className="block text-sm font-semibold">{label}</span><span className="block mt-0.5 text-xs text-[#78564F] dark:text-[#A99A8F]">{help}</span></button>)}
              </div>
            </fieldset>

            {modality === "frequency" && <fieldset className="space-y-3"><legend className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Frequency target</legend><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={frequencyRule === "zero"} onClick={() => setFrequencyRule("zero")} className={`min-h-11 px-3 rounded-full border text-xs ${frequencyRule === "zero" ? "bg-[#FDD0C6] border-[#D47A55] text-[#261810]" : "border-[#D2C3BE] dark:border-[#39302B]"}`}>Track zero days</button><button type="button" aria-pressed={frequencyRule === "at_most"} onClick={() => setFrequencyRule("at_most")} className={`min-h-11 px-3 rounded-full border text-xs ${frequencyRule === "at_most" ? "bg-[#FDD0C6] border-[#D47A55] text-[#261810]" : "border-[#D2C3BE] dark:border-[#39302B]"}`}>Set a maximum</button></div>{frequencyRule === "at_most" && <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Maximum per day<input aria-label="Maximum quantity per day" type="number" min="0" step="any" value={limit} onChange={(event) => setLimit(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label><label className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Unit<input aria-label="Frequency unit" type="text" value={frequencyUnit} onChange={(event) => setFrequencyUnit(event.target.value)} placeholder="cigarettes, drinks, minutes" className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label></div>}</fieldset>}

            {modality === "daily_habit" && <fieldset className="space-y-3"><legend className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Habit target</legend><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={useMinimum} onChange={(event) => setUseMinimum(event.target.checked)} />Set a minimum quantity</label>{useMinimum && <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Minimum per day<input aria-label="Minimum quantity per day" type="number" min="0.01" step="any" value={minimum} onChange={(event) => setMinimum(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label><label className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Unit<input aria-label="Habit unit" type="text" value={habitUnit} onChange={(event) => setHabitUnit(event.target.value)} placeholder="pages, minutes, glasses" className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label></div>}</fieldset>}

            {modality === "boundary" && <div><label htmlFor="boundary-cutoff" className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Daily cutoff</label><input id="boundary-cutoff" type="time" value={cutoff} onChange={(event) => setCutoff(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /><p className="mt-1 text-xs text-[#78564F] dark:text-[#A99A8F]">Entries at or before this time count as adherence.</p></div>}

            <div className="space-y-1">
              <label htmlFor="start-date-input" className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">
                Start date (optional)
              </label>
              <input
                id="start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE]/60 dark:border-[#39302B] focus:outline-none"
              />
            </div>

            <div className="space-y-1"><label htmlFor="tracker-rationale" className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">Personal rationale (optional)</label><textarea id="tracker-rationale" rows={3} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Why does this matter to you?" className="w-full p-3 rounded-xl tracker-field resize-y" /></div>

            <button
              type="submit"
              className="w-full min-h-11 py-2.5 px-4 rounded-full btn-primary text-xs font-semibold"
            >
              <span>Create tracker</span>
            </button>
          </form>
        )}
      </div>

      {/* Edit Modal */}
      {editingTracker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-xs max-h-[90vh] overflow-y-auto bg-white dark:bg-[#24201D] rounded-2xl p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Edit tracker
              </h3>
              <button
                type="button"
                onClick={() => setEditingTracker(null)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#78564F] dark:text-[#A99A8F] hover:text-[#261810]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {editError && (
              <p className="text-xs text-[#BA1A1A] dark:text-[#F0A08D]">{editError}</p>
            )}

            <div className="space-y-1">
              <label htmlFor="edit-name-input" className="block text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">
                Name
              </label>
              <input
                id="edit-name-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE] dark:border-[#39302B] focus:outline-none"
              />
            </div>

            {editModality === "frequency" && <div className="space-y-2"><label className="block text-xs font-semibold">Target rule<select aria-label="Frequency target rule" value={editFrequencyRule} onChange={(event) => setEditFrequencyRule(event.target.value as "zero" | "at_most")} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field"><option value="zero">Zero</option><option value="at_most">Maximum</option></select></label>{editFrequencyRule === "at_most" && <div className="grid grid-cols-2 gap-2"><label className="text-xs">Maximum<input aria-label="Edit frequency maximum" type="number" min="0" step="any" value={editLimit} onChange={(event) => setEditLimit(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label><label className="text-xs">Unit<input aria-label="Edit frequency unit" value={editFrequencyUnit} onChange={(event) => setEditFrequencyUnit(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label></div>}</div>}
            {editModality === "daily_habit" && <div className="grid grid-cols-2 gap-2"><label className="text-xs">Daily minimum<input aria-label="Edit daily habit minimum" type="number" min="0.01" step="any" value={editMinimum} onChange={(event) => setEditMinimum(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label><label className="text-xs">Unit<input aria-label="Edit daily habit unit" value={editHabitUnit} onChange={(event) => setEditHabitUnit(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label></div>}
            {editModality === "boundary" && <label className="block text-xs font-semibold">Boundary cutoff<input aria-label="Edit boundary cutoff" type="time" value={editCutoff} onChange={(event) => setEditCutoff(event.target.value)} className="mt-1 w-full min-h-11 px-3 rounded-xl tracker-field" /></label>}

            <div className="flex gap-2">
              <button
                type="submit"
                className="min-h-11 flex-1 py-2 px-3 rounded-full btn-primary text-xs font-semibold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingTracker(null)}
                className="min-h-11 py-2 px-3 rounded-full border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmGoal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-[#24201D] rounded-2xl p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Delete tracker?
            </h3>
            <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              Are you sure you want to delete “{getDisplayName(trackers.find((tracker) => String(tracker.id) === deleteConfirmGoal)?.name || "tracker")}"? Past entries and notes will remain in your journal.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                      onClick={() => handleDeleteGoal(deleteConfirmGoal)}
                className="min-h-11 flex-1 py-2 rounded-full bg-[#BA1A1A] text-white text-xs font-semibold hover:bg-[#9E1414] transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmGoal(null)}
                className="min-h-11 py-2 px-4 rounded-full border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
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

export default AddAddiction;
