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
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string>("");

  // Edit modal state
  const [editingTracker, setEditingTracker] = useState<TrackerRecord | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editError, setEditError] = useState<string>("");

  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<string | null>(null);

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

  const getHabitIcon = (name: string): string => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("alcohol") || lower.includes("drink") || lower.includes("sobriety")) return "water_drop";
    if (lower.includes("sesh") || lower.includes("smoke") || lower.includes("nicotine")) return "air";
    if (lower.includes("weed") || lower.includes("cannabis")) return "nature";
    if (lower.includes("porn") || lower.includes("screen") || lower.includes("curfew")) return "bedtime";
    return "spa";
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmed = goalTitle.trim();
    if (!trimmed) {
      setFormError("Goal title cannot be empty.");
      return;
    }

    const lower = trimmed.toLowerCase();
    const modality = ["sesh", "weed", "porn"].includes(lower) ? "specialized" : "abstinence";

    const res = addGoal({
      title: trimmed,
      modality,
      category: "Personal Goal",
      limitVal: 1,
      curfewTime: "22:30",
      startDate,
      rationale: "",
    });

    if (!res.success) {
      setFormError(res.error || "Failed to create goal.");
      return;
    }

    setGoalTitle("");
    setActiveTab("active");
  };

  const openEditModal = (tracker: TrackerRecord) => {
    setEditingTracker(tracker);
    setEditName(tracker.name);
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

    const res = updateGoal(editingTracker.name, {
      name: trimmed,
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
  };

  return (
    <Layout title="Trackers">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
              Trackers
            </h1>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] mt-0.5">
              Manage what you are tracking and add new commitments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="min-h-11 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#2A2522] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
          >
            ← Home
          </button>
        </header>

        {/* View Tabs */}
        <div role="tablist" aria-label="Goal views" className="p-1 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] flex items-center gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            className={`min-h-11 flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "active"
                ? "bg-white dark:bg-[#2A2522] text-[#261810] dark:text-[#F4EFEA] shadow-xs"
                : "text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
            }`}
          >
            <span>Manage goals</span>
            <span className="text-xs opacity-70">({trackers.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "new"}
            onClick={() => {
              setFormError("");
              setActiveTab("new");
            }}
            className={`min-h-11 flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "new"
                ? "bg-white dark:bg-[#2A2522] text-[#261810] dark:text-[#F4EFEA] shadow-xs"
                : "text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
            }`}
          >
            <span>Add a goal</span>
          </button>
        </div>

        {/* TAB 1: MANAGE GOALS */}
        {activeTab === "active" && (
          <div className="space-y-3">
            {trackers.length === 0 ? (
              <div className="bg-white dark:bg-[#2A2522] rounded-2xl p-6 text-center border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
                <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                  No trackers yet. Add your first goal to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("new")}
                  className="min-h-11 px-4 py-2 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold inline-flex items-center gap-1"
                >
                  <span>Add a goal</span>
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
                    className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#3D2C24] dark:text-[#D47A55] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {getHabitIcon(habitName)}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-semibold text-sm text-[#261810] dark:text-[#F4EFEA]">
                            {getDisplayName(habitName)}
                          </h2>
                          <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                            {isSpecialized ? "Daily count tracking" : "Daily check-in"} · {streak} {streak === 1 ? "day streak" : "days streak"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${getDisplayName(habitName)}`}
                          onClick={() => openEditModal(tracker)}
                          className="min-h-11 px-2.5 rounded-lg text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${getDisplayName(habitName)}`}
                          onClick={() => setDeleteConfirmGoal(habitName)}
                          className="min-h-11 px-2.5 rounded-lg text-xs font-semibold text-[#BA1A1A] dark:text-[#F0A08D] hover:bg-[#FDECEB] dark:hover:bg-[#4A2B25] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D2C3BE]/50 dark:border-[#39302B] text-xs">
                      <span className="text-[#6B5B54] dark:text-[#A99A8F]">
                        Started {tracker.startDate || "recently"}
                      </span>
                      <div className="flex items-center gap-2">
                        {isSpecialized && (
                          <button
                            type="button"
                            onClick={() => navigate(`/${lower}`)}
                            className="text-[#3D2C24] dark:text-[#D47A55] font-semibold hover:underline"
                          >
                            Open tracker →
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate("/notes")}
                          className="text-[#3D2C24] dark:text-[#D47A55] font-semibold hover:underline"
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
            className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 sm:p-6 space-y-4"
          >
            <div className="space-y-1 pb-3 border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
              <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Add a new tracker
              </h2>
              <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                Name what you want to track each day.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-[#FDECEB] dark:bg-[#4A2B25] text-[#BA1A1A] dark:text-[#F0A08D] rounded-xl text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="goal-name-input" className="block text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]">
                Tracker name
              </label>
              <input
                id="goal-name-input"
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Sobriety, Sesh, Evening walk..."
                className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE]/50 dark:border-[#39302B] focus:outline-none focus:border-[#3D2C24] dark:focus:border-[#D47A55]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="start-date-input" className="block text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]">
                Start date
              </label>
              <input
                id="start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE]/50 dark:border-[#39302B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-11 py-2.5 px-4 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>Add a goal</span>
            </button>
          </form>
        )}
      </div>

      {/* Edit Modal */}
      {editingTracker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-xs bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Edit tracker
              </h3>
              <button
                type="button"
                onClick={() => setEditingTracker(null)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#6B5B54] dark:text-[#A99A8F]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {editError && (
              <p className="text-xs text-[#BA1A1A] dark:text-[#F0A08D]">{editError}</p>
            )}

            <div className="space-y-1">
              <label htmlFor="edit-name-input" className="block text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]">
                Name
              </label>
              <input
                id="edit-name-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-11 px-3 py-2 text-xs rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE] dark:border-[#39302B] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="min-h-11 flex-1 py-2 px-3 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingTracker(null)}
                className="min-h-11 py-2 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]"
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
          <div className="w-full max-w-xs bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Delete tracker?
            </h3>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              Are you sure you want to delete “{getDisplayName(deleteConfirmGoal)}”? Past entries and notes will remain in your journal.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDeleteGoal(deleteConfirmGoal)}
                className="min-h-11 flex-1 py-2 rounded-xl bg-[#BA1A1A] text-white text-xs font-semibold"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmGoal(null)}
                className="min-h-11 py-2 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]"
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
