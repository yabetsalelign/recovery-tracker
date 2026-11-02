import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";
import type { NoteEntry } from "./types";
import { useOverlayBackHandler } from "./components/BackNavigation";

interface PendingSwitchState {
  type: "date" | "goal" | "entry" | "discard";
  value: string;
  goal?: string;
}

const Notes: React.FC = () => {
  const { discreetMode } = useTheme();
  const {
    canonicalTrackers,
    saveNote,
    deleteNote,
    getNote,
    getAllNotes,
    saveTrackerDayNote,
    deleteTrackerDayNote,
  } = useRecovery();

  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedGoal, setSelectedGoal] = useState<string>(() => {
    return canonicalTrackers.find((tracker) => !tracker.isArchived)?.id ? `tracker:${canonicalTrackers.find((tracker) => !tracker.isArchived)!.id}` : "General";
  });

  const [journalText, setJournalText] = useState<string>("");
  const [initialText, setInitialText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitchState | null>(null);

  // Load existing note when date or goal changes
  useEffect(() => {
    const selectedTracker = selectedGoal.startsWith("tracker:") ? canonicalTrackers.find((tracker) => tracker.id === selectedGoal.slice("tracker:".length)) : undefined;
    const existing = selectedTracker?.records[selectedDate]?.note || (!selectedTracker ? getNote("General", selectedDate) : "");
    setJournalText(existing);
    setInitialText(existing);
  }, [selectedDate, selectedGoal, getNote, canonicalTrackers]);

  const isDirty = journalText !== initialText;

  const handleGoalChange = (newGoal: string) => {
    if (newGoal === selectedGoal) return;
    if (isDirty) {
      setPendingSwitch({ type: "goal", value: newGoal });
      setShowDiscardModal(true);
    } else {
      setSelectedGoal(newGoal);
    }
  };

  const handleDateChange = (newDate: string) => {
    if (newDate === selectedDate) return;
    if (isDirty) {
      setPendingSwitch({ type: "date", value: newDate });
      setShowDiscardModal(true);
    } else {
      setSelectedDate(newDate);
    }
  };

  const confirmSwitchWithoutSaving = () => {
    if (pendingSwitch) {
      if (pendingSwitch.type === "goal") {
        setSelectedGoal(pendingSwitch.value);
      } else if (pendingSwitch.type === "date") {
        setSelectedDate(pendingSwitch.value);
      } else if (pendingSwitch.type === "entry") {
        setSelectedDate(pendingSwitch.value);
        setSelectedGoal(pendingSwitch.goal || "General");
      }
    }
    setPendingSwitch(null);
    setShowDiscardModal(false);
  };

  const handleSaveReflection = () => {
    setSaveStatus("saving");
    const selectedTracker = selectedGoal.startsWith("tracker:") ? canonicalTrackers.find((tracker) => tracker.id === selectedGoal.slice("tracker:".length)) : undefined;
    if (selectedTracker) saveTrackerDayNote(selectedTracker.id, selectedDate, journalText);
    else saveNote("General", selectedDate, journalText);
    setInitialText(journalText);

    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 250);
  };

  const handleDiscardClick = () => {
    if (isDirty) {
      setPendingSwitch({ type: "discard", value: "" });
      setShowDiscardModal(true);
    }
  };

  const handleEntryEdit = (entry: NoteEntry) => {
    const goal = entry.trackerId ? `tracker:${entry.trackerId}` : "General";
    if (isDirty) {
      setPendingSwitch({ type: "entry", value: entry.date, goal });
      setShowDiscardModal(true);
      return;
    }
    setSelectedDate(entry.date);
    setSelectedGoal(goal);
  };

  const confirmDiscard = () => {
    if (pendingSwitch?.type === "discard") {
      setJournalText(initialText);
      setPendingSwitch(null);
      setShowDiscardModal(false);
    } else {
      confirmSwitchWithoutSaving();
    }
  };
  const dismissDiscardDialog = useCallback(() => {
    setShowDiscardModal(false);
    setPendingSwitch(null);
  }, []);
  useOverlayBackHandler(showDiscardModal, dismissDiscardDialog);

  const allEntries = useMemo(() => getAllNotes(), [getAllNotes]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "General" && entry.isGeneral) ||
        (activeFilter.startsWith("tracker:") && entry.trackerId === activeFilter.slice("tracker:".length));

      const matchesSearch =
        !searchQuery.trim() ||
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.habit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.date.includes(searchQuery);

      return matchesFilter && matchesSearch;
    });
  }, [allEntries, activeFilter, searchQuery]);

  const wordCount = journalText.trim() ? journalText.trim().split(/\s+/).length : 0;

  const getDisplayName = (name: string): string => {
    if (name === "General Reflection" || name === "General") return "General";
    if (discreetMode) {
      const lower = (name || "").toLowerCase();
      if (lower === "sesh") return "Habit S";
      if (lower === "weed") return "Habit W";
      if (lower === "porn") return "Habit P";
      return name ? name.slice(0, 1).toUpperCase() + " Tracker" : "Tracker";
    }
    return name;
  };

  const renderArchive = (headingId: string) => (
    <div className="space-y-3">
      <div className="relative w-full">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#78564F] dark:text-[#A99A8F] text-[18px]"
          aria-hidden="true"
        >
          search
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search journal entries"
          placeholder="Search entries..."
          className="w-full min-h-11 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE] dark:border-[#39302B] pl-9 pr-3 py-2 text-xs text-[#261810] dark:text-[#F4EFEA] placeholder:text-[#78564F]/60 dark:placeholder:text-[#A99A8F]/60 focus:outline-none focus:border-[#78564F] dark:focus:border-[#D47A55]"
        />
      </div>

      <div role="group" aria-label="Filter entries" className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { value: "all", label: `All (${allEntries.length})` },
          { value: "General", label: "General" },
          ...canonicalTrackers.filter((tracker) => !tracker.isArchived).map((tracker) => ({ value: `tracker:${tracker.id}`, label: getDisplayName(tracker.name) })),
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={activeFilter.toLowerCase() === filter.value.toLowerCase()}
            onClick={() => setActiveFilter(filter.value)}
            className={`min-h-11 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeFilter.toLowerCase() === filter.value.toLowerCase()
                ? "filter-pill-selected"
                : "bg-white dark:bg-[#24201D] text-[#78564F] dark:text-[#D0C4BA] border-[#D2C3BE] dark:border-[#39302B] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 pt-1" aria-labelledby={headingId}>
        <div className="flex items-center justify-between">
          <h2 id={headingId} className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Previous entries
          </h2>
          <span className="text-xs text-[#78564F] dark:text-[#A99A8F]">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-[#24201D] rounded-2xl p-5 text-center border border-[#D2C3BE] dark:border-[#39302B] shadow-[0_1px_3px_rgba(38,24,16,0.04)]">
            <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              {allEntries.length === 0 ? "No entries yet." : "No entries match your search."}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white dark:bg-[#24201D] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-4 sm:p-5 space-y-2.5 hover:border-[#78564F]/40 transition-colors shadow-[0_1px_3px_rgba(38,24,16,0.03)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#261810] dark:text-[#F4EFEA]">
                    {entry.date}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#78564F] dark:text-[#D0C4BA] border border-[#D2C3BE]/50 dark:border-[#39302B]">
                    {entry.isGeneral ? "Journal reflection" : `Tracker · ${getDisplayName(entry.habit)}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Edit entry from ${entry.date}`}
                    onClick={() => {
                      handleEntryEdit(entry);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="min-h-11 px-2.5 text-xs font-semibold text-[#78564F] dark:text-[#D47A55] hover:text-[#261810] dark:hover:text-[#F4EFEA] hover:underline transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete entry from ${entry.date}`}
                    onClick={() => entry.trackerId ? deleteTrackerDayNote(entry.trackerId, entry.date) : deleteNote("General", entry.date)}
                    className="min-h-11 px-2.5 text-xs text-[#BA1A1A] dark:text-[#F0A08D] hover:underline transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="font-serif text-sm sm:text-base text-[#261810] dark:text-[#F4EFEA] leading-relaxed whitespace-pre-wrap line-clamp-4">
                {entry.text}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Layout title="Journal">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
            Journal
          </h1>
          <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
            A quiet space to write your thoughts, reflections, and notes.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] lg:items-start">
          {/* Main Writing Area */}
          <section className="journal-canvas p-5 sm:p-6 space-y-4">
            {/* Date & Category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D2C3BE]/60 dark:border-[#39302B]">
              <div className="flex items-center gap-2">
                <label htmlFor="journal-date" className="text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA]">
                  Date
                </label>
                <input
                  id="journal-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="min-h-11 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] px-3 py-1 text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] focus:outline-none focus:border-[#78564F] dark:focus:border-[#D47A55]"
                />
              </div>

              {/* Goal Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGoalChange("General")}
                  className={`min-h-11 px-3.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    selectedGoal === "General"
                      ? "filter-pill-selected"
                      : "bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#78564F] dark:text-[#D0C4BA] border-[#D2C3BE]/60 dark:border-[#39302B] hover:bg-[#F6EDE2] dark:hover:bg-[#2A2522]"
                  }`}
                >
                  General
                </button>
                {canonicalTrackers.filter((tracker) => !tracker.isArchived).map((tracker) => (
                  <button
                    key={tracker.id}
                    type="button"
                    onClick={() => handleGoalChange(`tracker:${tracker.id}`)}
                    className={`min-h-11 px-3.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      selectedGoal === `tracker:${tracker.id}`
                        ? "filter-pill-selected"
                        : "bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#78564F] dark:text-[#D0C4BA] border-[#D2C3BE]/60 dark:border-[#39302B] hover:bg-[#F6EDE2] dark:hover:bg-[#2A2522]"
                    }`}
                  >
                    {getDisplayName(tracker.name)}
                  </button>
                ))}
              </div>
            </div>

            {/* Writing Textarea */}
            <div className="pt-1 journal-rule">
              <textarea
                aria-label="Journal entry"
                rows={12}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="What is on your mind today? Write freely..."
                className="journal-textarea w-full bg-transparent text-[#261810] dark:text-[#F4EFEA] font-serif text-lg leading-relaxed placeholder:text-[#78564F]/50 dark:placeholder:text-[#A99A8F]/50 placeholder:font-sans placeholder:text-sm focus:outline-none resize-y"
              />
            </div>

            {/* Controls & Feedback */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#D2C3BE]/60 dark:border-[#39302B]">
              <div className="flex items-center gap-2 text-xs text-[#78564F] dark:text-[#A99A8F]">
                <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
                {isDirty && (
                  <>
                    <span>•</span>
                    <span className="text-[#D47A55] font-semibold">Unsaved edits</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isDirty}
                  onClick={handleDiscardClick}
                  className="min-h-11 px-3.5 rounded-full text-xs font-semibold text-[#78564F] dark:text-[#A99A8F] hover:text-[#261810] dark:hover:text-[#F4EFEA] disabled:opacity-40 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={!isDirty || saveStatus === "saving"}
                  onClick={handleSaveReflection}
                  className="min-h-11 inline-flex items-center gap-2 px-5 py-2.5 rounded-full btn-primary text-xs font-semibold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                  <span>
                    {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Save entry"}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Desktop Sidebar: Previous Entries */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <div className="bg-[#FBF2E7] dark:bg-[#1E1B18] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-4 shadow-[0_1px_3px_rgba(38,24,16,0.03)]">
              {renderArchive("desktop-entries-heading")}
            </div>
          </aside>
        </div>

        {/* Mobile: Collapsible Previous Entries */}
        <details className="lg:hidden rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] p-4 shadow-[0_1px_3px_rgba(38,24,16,0.03)]">
          <summary className="min-h-11 cursor-pointer flex items-center justify-between gap-3 font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            <span>Previous entries</span>
            <span className="text-xs font-sans text-[#78564F] dark:text-[#A99A8F]">
              {allEntries.length} saved
            </span>
          </summary>
          <div className="pt-3">
            {renderArchive("mobile-entries-heading")}
          </div>
        </details>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-[#24201D] rounded-2xl p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Discard edits?
            </h3>
            <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              You have unsaved changes. Leaving now will discard them.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={confirmDiscard}
                className="min-h-11 flex-1 py-2 rounded-full bg-[#BA1A1A] text-white text-xs font-semibold hover:bg-[#9E1414] transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  setPendingSwitch(null);
                }}
                className="min-h-11 py-2 px-4 rounded-full border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#78564F] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Notes;
