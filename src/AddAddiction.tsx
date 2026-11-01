import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";
import type { TrackerRecord } from "./types";

const AddAddiction: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
  const {
    trackers,
    addGoal,
    updateGoal,
    deleteGoal,
    calculateStreak,
  } = useRecovery();

  const [activeTab, setActiveTab] = useState<"active" | "new">("active");

  // Form state
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [modality, setModality] = useState<string>("abstinence"); // 'abstinence' | 'frequency' | 'quantity' | 'specialized'
  const [category, setCategory] = useState<string>("Substance Sobriety");
  const [limitVal, setLimitVal] = useState<number>(1);
  const [curfewTime, setCurfewTime] = useState<string>("22:30");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [rationale, setRationale] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Edit modal state
  const [editingTracker, setEditingTracker] = useState<TrackerRecord | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editModality, setEditModality] = useState<string>("abstinence");
  const [editLimitVal, setEditLimitVal] = useState<number>(1);
  const [editCurfewTime, setEditCurfewTime] = useState<string>("22:30");
  const [editError, setEditError] = useState<string>("");

  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const getHabitIcon = (name: string): string => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("alcohol") || lower.includes("drink") || lower.includes("sobriety")) return "water_drop";
    if (lower.includes("sesh") || lower.includes("smoke") || lower.includes("nicotine")) return "air";
    if (lower.includes("weed") || lower.includes("cannabis")) return "nature";
    if (lower.includes("porn") || lower.includes("screen") || lower.includes("curfew")) return "bedtime";
    return "eco";
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmed = goalTitle.trim();
    if (!trimmed) {
      setFormError("Goal title cannot be empty.");
      return;
    }

    const res = addGoal({
      title: trimmed,
      modality,
      category,
      limitVal,
      curfewTime,
      startDate,
      rationale,
    });

    if (!res.success) {
      setFormError(res.error || "Failed to create goal.");
      return;
    }

    setGoalTitle("");
    setRationale("");
    setLimitVal(1);
    setCurfewTime("22:30");
    setActiveTab("active");
  };

  const openEditModal = (tracker: TrackerRecord) => {
    setEditingTracker(tracker);
    setEditName(tracker.name);
    setEditModality(tracker.modality || "abstinence");
    setEditLimitVal(tracker.limitVal || 1);
    setEditCurfewTime(tracker.curfewTime || "22:30");
    setEditError("");
    setOpenMenuId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTracker) return;

    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Goal title cannot be empty.");
      return;
    }

    const res = updateGoal(editingTracker.name, {
      name: trimmed,
      modality: editModality,
      limitVal: editLimitVal,
      curfewTime: editCurfewTime,
    });

    if (!res.success) {
      setEditError(res.error || "Failed to update goal.");
      return;
    }

    setEditingTracker(null);
  };

  const handleDeleteGoal = (goalToDelete: string) => {
    deleteGoal(goalToDelete);
    setDeleteConfirmGoal(null);
    setOpenMenuId(null);
  };

  return (
    <Layout title="Goals & Boundaries">
      <div className="pt-2 pb-6 space-y-5">
        {/* Header */}
        <section className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
              Goal Architecture
            </span>
            <button
              onClick={() => navigate("/home")}
              className="text-xs font-semibold text-[#46644B] dark:text-[#8EAA92] hover:underline"
            >
              ← Dashboard
            </button>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            Add & Manage Goals
          </h1>
          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            Define custom parameters for abstinence, frequency moderation, schedule curfews, or impulse delays.
          </p>
        </section>

        {/* View Tabs */}
        <div className="p-1 rounded-xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] flex items-center shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "active"
                ? "bg-[#46644B] text-white shadow-xs"
                : "text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Active Goals ({trackers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setActiveTab("new");
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "new"
                ? "bg-[#46644B] text-white shadow-xs"
                : "text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Add New Goal</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE GOALS LIST */}
        {activeTab === "active" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
                Current Active Plans
              </span>
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setActiveTab("new");
                }}
                className="text-xs font-medium text-[#46644B] dark:text-[#8EAA92] hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[15px]">add</span> New Target
              </button>
            </div>

            {trackers.length === 0 ? (
              <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 text-center border border-[#E3DED5] dark:border-[#313831] space-y-2 shadow-xs">
                <span className="material-symbols-outlined text-[24px] text-[#46644B]">tune</span>
                <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                  No goals configured. Click "+ Add New Goal" above to create your first commitment.
                </p>
              </div>
            ) : (
              trackers.map((tracker) => {
                const habitName = tracker.name;
                const streak = calculateStreak(tracker.checkIns);
                const isMenuOpen = openMenuId === habitName;
                const lower = habitName.toLowerCase();
                const isSpecialized = lower === "sesh" || lower === "weed" || lower === "porn";

                let modalityBadge = "Continuous";
                if (tracker.modality === "frequency") modalityBadge = `Max ${tracker.limitVal || 1}/wk`;
                else if (tracker.modality === "quantity") modalityBadge = `Max ${tracker.limitVal || 1}/day`;
                else if (tracker.modality === "specialized" || isSpecialized) modalityBadge = "Specialized";

                const nextMilestone = streak >= 30 ? 60 : streak >= 14 ? 30 : streak >= 7 ? 14 : 7;
                const milestonePct = Math.min(100, Math.round((streak / nextMilestone) * 100));

                return (
                  <article
                    key={tracker.id || habitName}
                    className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E8EBDD] dark:bg-[#2C332C] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92]">
                          <span className="material-symbols-outlined text-[20px]">
                            {getHabitIcon(habitName)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">
                              {getDisplayName(habitName)}
                            </h2>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92]">
                              {modalityBadge}
                            </span>
                          </div>
                          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                            {tracker.category || "Substance Sobriety"} · Started {tracker.startDate || "recently"}
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Goal options"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : habitName)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#77786F] hover:bg-[#F2EFE8] dark:hover:bg-[#2C332C]"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 z-20 w-44 border border-[#E3DED5] dark:border-[#313831] rounded-xl bg-white dark:bg-[#212521] shadow-lg p-1 space-y-0.5 text-xs">
                            <button
                              type="button"
                              onClick={() => openEditModal(tracker)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F8F6F1] dark:hover:bg-[#2C332C] flex items-center gap-2 text-[#252B25] dark:text-[#E8EBDD]"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              <span>Edit Parameters</span>
                            </button>
                            {isSpecialized && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/${lower}`);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F8F6F1] dark:hover:bg-[#2C332C] flex items-center gap-2 text-[#46644B] dark:text-[#8EAA92]"
                              >
                                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                                <span>Open Tracker Page</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmGoal(habitName);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FDECEB] dark:hover:bg-[#441B1B] flex items-center gap-2 text-[#BA1A1A] dark:text-[#FFB4AB]"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                              <span>Delete Goal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Parameter Card */}
                    <div className="bg-[#F8F6F1] dark:bg-[#181B18] rounded-xl p-3 border border-[#E3DED5]/80 dark:border-[#313831] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] block">
                          Consecutive Days
                        </span>
                        <span className="font-serif text-2xl text-[#46644B] dark:text-[#8EAA92] font-medium">
                          {streak} {streak === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
                          Next milestone: {nextMilestone} days
                        </span>
                        <div className="w-24 h-1.5 bg-[#E3DED5] dark:bg-[#313831] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#46644B] dark:bg-[#8EAA92] rounded-full"
                            style={{ width: `${milestonePct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Inline Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[#77786F] dark:text-[#A6ABA0]">
                        <span className="material-symbols-outlined text-[16px] text-[#46644B] dark:text-[#8EAA92]">
                          verified
                        </span>
                        <span>Active tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSpecialized && (
                          <button
                            type="button"
                            onClick={() => navigate(`/${lower}`)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#46644B]/40 text-[#46644B] dark:text-[#8EAA92] hover:bg-[#E8EBDD]/40 font-medium transition-colors"
                          >
                            Open Tracker
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(tracker)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] hover:bg-[#F2EFE8] font-medium transition-colors"
                        >
                          Parameters
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/notes")}
                          className="px-2.5 py-1.5 rounded-lg bg-[#46644B] text-white font-medium hover:bg-[#38503C] transition-colors"
                        >
                          Log Note
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            <button
              type="button"
              onClick={() => {
                setFormError("");
                setActiveTab("new");
              }}
              className="w-full py-3.5 px-4 rounded-2xl border border-dashed border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] hover:bg-[#E8EBDD]/40 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]"
            >
              <span className="material-symbols-outlined text-[18px] text-[#46644B] dark:text-[#8EAA92]">add</span>
              <span>Create New Target or Boundary</span>
            </button>
          </div>
        )}

        {/* TAB 2: ADD NEW GOAL FORM */}
        {activeTab === "new" && (
          <form
            onSubmit={handleSaveGoal}
            className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-5 shadow-xs space-y-4"
          >
            <div className="border-b border-[#E3DED5]/80 dark:border-[#313831] pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  Configure New Goal
                </h2>
                <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                  Flexible tracking tailored to your specific pathway.
                </p>
              </div>
              <span className="material-symbols-outlined text-[#46644B] text-[22px]">tune</span>
            </div>

            {formError && (
              <div className="p-3 bg-[#FDECEB] dark:bg-[#441B1B] text-[#BA1A1A] dark:text-[#FFB4AB] rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Tracking Modality Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
                Tracking Type
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "abstinence", label: "Continuous Abstinence", desc: "Day streak & milestone resets" },
                  { id: "frequency", label: "Frequency Cap", desc: "Max occurrences per week" },
                  { id: "quantity", label: "Quantity / Stepper", desc: "Units, minutes, or counts" },
                  { id: "specialized", label: "Specialized Tracking", desc: "Urge delay, curfews, somatic" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModality(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      modality === item.id
                        ? "border-[#46644B] bg-[#E8EBDD]/50 dark:bg-[#2C332C] text-[#252B25] dark:text-[#E8EBDD]"
                        : "border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25]"
                    }`}
                  >
                    <span className="block font-semibold">{item.label}</span>
                    <span className="text-[11px] opacity-80">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]" htmlFor="goal-title">
                Goal Title
              </label>
              <input
                id="goal-title"
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., Evening Alcohol Pause, Screen Curfew, Sesh Moderation"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] placeholder:text-[#77786F]/60 focus:outline-none focus:border-[#46644B]"
              />
            </div>

            {/* Category Tag Selection */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]">Category</span>
              <div className="flex flex-wrap gap-1.5">
                {["Substance Sobriety", "Digital Rest", "Impulse Delay", "Physical Health"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      category === cat
                        ? "bg-[#46644B] text-white"
                        : "bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Parameter Box */}
            <div className="p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] space-y-3">
              <span className="text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] block">
                Target Parameters
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77786F] dark:text-[#A6ABA0]">Initial start date:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs text-[#252B25] dark:text-[#E8EBDD]"
                />
              </div>

              {(modality === "quantity" || modality === "frequency") && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77786F] dark:text-[#A6ABA0]">
                    {modality === "frequency" ? "Weekly cap limit:" : "Daily ceiling limit:"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLimitVal((v) => Math.max(1, v - 1))}
                      className="w-7 h-7 rounded border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-semibold">{limitVal}</span>
                    <button
                      type="button"
                      onClick={() => setLimitVal((v) => v + 1)}
                      className="w-7 h-7 rounded border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <span className="text-[#77786F] dark:text-[#A6ABA0]">
                      {modality === "frequency" ? "times / week" : "units / day"}
                    </span>
                  </div>
                </div>
              )}

              {modality === "specialized" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#77786F] dark:text-[#A6ABA0]">Curfew / pause window:</span>
                  <input
                    type="time"
                    value={curfewTime}
                    onChange={(e) => setCurfewTime(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs text-[#252B25] dark:text-[#E8EBDD]"
                  />
                </div>
              )}
            </div>

            {/* Personal Rationale */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]" htmlFor="goal-rationale">
                Personal Rationale (Optional)
              </label>
              <textarea
                id="goal-rationale"
                rows={2}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="e.g., Prioritizing restful REM sleep and clear mornings."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] placeholder:text-[#77786F]/60 focus:outline-none focus:border-[#46644B] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#46644B] hover:bg-[#38503C] text-white text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Save Goal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setActiveTab("active");
                }}
                className="py-2.5 px-4 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs font-medium text-[#252B25] dark:text-[#E8EBDD] hover:bg-[#F8F6F1] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmGoal && (
          <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-5 shadow-xl border border-[#E3DED5] dark:border-[#313831] space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#FDECEB] text-[#BA1A1A] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  Delete "{deleteConfirmGoal}"?
                </h3>
                <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                  The goal and its associated daily check-ins will be removed. All other habits and journal entries remain completely safe and intact.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(deleteConfirmGoal)}
                  className="flex-1 py-2 bg-[#BA1A1A] text-white text-xs font-semibold rounded-xl hover:bg-[#A31616]"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmGoal(null)}
                  className="py-2 px-3 border border-[#E3DED5] dark:border-[#313831] text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Parameter Modal */}
        {editingTracker && (
          <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveEdit}
              className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#E3DED5]/80 dark:border-[#313831] pb-2">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                    Edit {getDisplayName(editingTracker.name)}
                  </h3>
                  <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                    Adjust parameters without resetting past history
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTracker(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#77786F]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {editError && (
                <div className="p-2.5 bg-[#FDECEB] text-[#BA1A1A] rounded-xl text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#252B25] dark:text-[#E8EBDD] mb-1">
                    Rename Goal
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] text-xs focus:outline-none focus:border-[#46644B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#252B25] dark:text-[#E8EBDD] mb-1">
                    Modality
                  </label>
                  <select
                    value={editModality}
                    onChange={(e) => setEditModality(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] text-xs focus:outline-none"
                  >
                    <option value="abstinence">Continuous Abstinence</option>
                    <option value="frequency">Frequency Cap</option>
                    <option value="quantity">Quantity / Stepper</option>
                    <option value="specialized">Specialized</option>
                  </select>
                </div>

                {(editModality === "quantity" || editModality === "frequency") && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#77786F] dark:text-[#A6ABA0]">Ceiling limit:</span>
                    <input
                      type="number"
                      min="1"
                      value={editLimitVal}
                      onChange={(e) => setEditLimitVal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-1 rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-center font-mono font-semibold"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#46644B] text-white text-xs font-semibold rounded-xl hover:bg-[#38503C]"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTracker(null)}
                  className="py-2 px-3 border border-[#E3DED5] dark:border-[#313831] text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AddAddiction;
