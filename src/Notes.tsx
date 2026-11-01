import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";
import type { NoteEntry } from "./types";

interface PendingSwitchState {
  type: "date" | "goal" | "entry" | "discard";
  value: string;
  goal?: string;
}

const Notes: React.FC = () => {
  const { discreetMode } = useTheme();
  const {
    trackers,
    addictions,
    saveNote,
    deleteNote,
    getNote,
    getAllNotes,
  } = useRecovery();

  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedGoal, setSelectedGoal] = useState<string>(() => {
    return addictions.length > 0 ? addictions[0] : "General";
  });

  const [journalText, setJournalText] = useState<string>("");
  const [initialText, setInitialText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitchState | null>(null);

  // Gentle prompts
  const prompts = [
    "What gave me peace today, even for a single minute?",
    "Where did I feel tension in my body, and what was it trying to say?",
    "Name three sensory observations you made during your walk.",
    "What is a small boundary I held today that protected my energy?",
    "How did I show grace to myself when an urge or worry arose?",
  ];
  const [promptIndex, setPromptIndex] = useState<number>(0);

  // Load existing note when date or goal changes
  useEffect(() => {
    const existing = getNote(selectedGoal, selectedDate);
    setJournalText(existing);
    setInitialText(existing);
  }, [selectedDate, selectedGoal, getNote]);

  const isDirty = journalText !== initialText;

  const handleShufflePrompt = () => {
    setPromptIndex((prev) => (prev + 1) % prompts.length);
  };

  const handleInsertPrompt = () => {
    const p = prompts[promptIndex];
    if (!journalText.trim()) {
      setJournalText(`“${p}”\n\n`);
    } else {
      setJournalText((prev) => `${prev}\n\n“${p}”\n\n`);
    }
  };

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
    saveNote(selectedGoal, selectedDate, journalText);
    setInitialText(journalText);

    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 300);
  };

  const handleDiscardClick = () => {
    if (isDirty) {
      setPendingSwitch({ type: "discard", value: "" });
      setShowDiscardModal(true);
    }
  };

  const handleEntryEdit = (entry: NoteEntry) => {
    const goal = entry.isGeneral ? "General" : entry.habit;
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

  // Compile all historical entries
  const allEntries = useMemo(() => getAllNotes(), [getAllNotes]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "General" && entry.isGeneral) ||
        entry.habit.toLowerCase() === activeFilter.toLowerCase();

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
    if (name === "General Reflection" || name === "General") return "General Reflection";
    if (discreetMode) {
      const lower = (name || "").toLowerCase();
      if (lower === "sesh") return "Habit S";
      if (lower === "weed") return "Habit W";
      if (lower === "porn") return "Habit P";
      return name ? name.slice(0, 1).toUpperCase() + " Tracker" : "Habit Tracker";
    }
    return name;
  };

  const renderArchive = (headingId: string) => (
    <div className="space-y-4">
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#77786F] text-[18px]" aria-hidden="true">
          search
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search journal entries"
          placeholder="Search entries, keywords, or triggers..."
          className="w-full min-h-11 rounded-xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] pl-9 pr-4 py-2.5 text-xs text-[#252B25] dark:text-[#E8EBDD] placeholder:text-[#77786F]/70 focus:outline-none focus:border-[#46644B] shadow-xs"
        />
      </div>

      <div role="group" aria-label="Filter journal entries" className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {[
          { value: "all", label: `All entries (${allEntries.length})` },
          { value: "General", label: "General Reflections" },
          ...trackers.map((tracker) => ({ value: tracker.name, label: getDisplayName(tracker.name) })),
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={activeFilter.toLowerCase() === filter.value.toLowerCase()}
            onClick={() => setActiveFilter(filter.value)}
            className={`min-h-11 shrink-0 px-3 rounded-full text-xs font-medium border transition-colors ${
              activeFilter.toLowerCase() === filter.value.toLowerCase()
                ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                : "bg-white dark:bg-[#212521] text-[#77786F] border-[#E3DED5] dark:border-[#313831]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <section className="space-y-3" aria-labelledby={headingId}>
        <div className="flex items-center justify-between gap-2 pt-1">
          <h2 id={headingId} className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
            Previous reflections
          </h2>
          <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] uppercase tracking-wider">
            {filteredEntries.length} entries
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 text-center border border-[#E3DED5] dark:border-[#313831] space-y-2 shadow-xs">
            <span className="material-symbols-outlined text-[24px] text-[#77786F]" aria-hidden="true">notes</span>
            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
              {allEntries.length === 0
                ? "No journal entries written yet. Your first reflection will appear here."
                : "No entries match your search criteria."}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 space-y-2 shadow-xs hover:border-[#46644B]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] uppercase tracking-wider font-medium">
                    {entry.date}
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD] mt-0.5">
                    {getDisplayName(entry.habit)}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Edit reflection from ${entry.date}`}
                    onClick={() => {
                      handleEntryEdit(entry);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="min-h-11 px-3 text-xs font-semibold text-[#46644B] dark:text-[#8EAA92] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete reflection from ${entry.date}`}
                    onClick={() => deleteNote(entry.isGeneral ? "General" : entry.habit, entry.date)}
                    className="min-h-11 px-3 text-xs text-[#BA1A1A] dark:text-[#FFB4AB] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="font-serif text-sm text-[#252B25] dark:text-[#E8EBDD] leading-relaxed whitespace-pre-wrap">
                {entry.text}
              </p>

              <div className="pt-1 flex items-center justify-between text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
                <span className="px-2 py-0.5 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] font-medium">
                  {getDisplayName(entry.habit)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]" aria-hidden="true">schedule</span>
                  <span>{Math.max(1, Math.round(entry.text.split(/\s+/).length / 130))} min read</span>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );

  return (
    <Layout title="Journal & Notes">
      <div className="pt-2 pb-6 space-y-4">
        {/* Editorial Sub-Header */}
        <section className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
            Private Sanctuary
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            <span className="sm:hidden">Space to write.</span>
            <span className="hidden sm:inline">Room to think.<br />Space to write.</span>
          </h1>
          <p className="text-sm text-[#77786F] dark:text-[#A6ABA0] leading-relaxed max-w-2xl">
            A private place to notice what matters, without judgment or pressure.
          </p>
        </section>

        <div className="grid gap-4 lg:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)] lg:items-start">
        {/* Contemplative Writing Surface */}
        <section className="journal-editor bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 md:p-7 shadow-xs space-y-4 md:space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold text-[#252B25] dark:text-[#E8EBDD]">
              {selectedGoal === "General" ? "A quiet moment" : getDisplayName(selectedGoal)}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDD0C6]/60 px-3 py-1 text-xs font-semibold text-[#5E3F39]">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              Private
            </span>
          </div>
          {/* Writing date */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E3DED5]/70 dark:border-[#313831]">
            <label htmlFor="journal-date" className="flex items-center gap-1.5 text-xs font-semibold text-[#77786F] dark:text-[#A6ABA0]">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[#46644B] dark:text-[#8EAA92]">
                calendar_today
              </span>
              <span>Writing date</span>
            </label>
            <input
                id="journal-date"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="min-h-11 max-w-[190px] rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] px-2.5 text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]"
              />
          </div>

          {/* Associated Goal Anchor Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
                Associated Goal Anchor
              </span>
              <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">Select focus</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleGoalChange("General")}
                className={`min-h-11 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedGoal === "General"
                    ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                    : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0] border-[#E3DED5] dark:border-[#313831]"
                }`}
              >
                General Reflection
              </button>
              {trackers.map((tracker) => (
                <button
                  key={tracker.name}
                  type="button"
                  onClick={() => handleGoalChange(tracker.name)}
                  className={`min-h-11 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedGoal.toLowerCase() === tracker.name.toLowerCase()
                      ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                      : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0] border-[#E3DED5] dark:border-[#313831]"
                  }`}
                >
                  {getDisplayName(tracker.name)}
                </button>
              ))}
            </div>
          </div>

          {/* Writing Textarea */}
          <div className="relative pt-1">
            <textarea
            aria-label="Journal entry"
            rows={10}
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder={`Write your reflection for ${getDisplayName(selectedGoal)} on ${selectedDate}...`}
            className="w-full min-h-64 md:min-h-[26rem] bg-transparent text-[#252B25] dark:text-[#E8EBDD] font-serif text-lg leading-7 md:leading-8 placeholder:text-[#77786F]/70 placeholder:font-sans placeholder:text-sm focus:outline-none resize-y"
            />
          </div>

          <details className="rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] px-3">
            <summary className="min-h-11 cursor-pointer flex items-center gap-2 text-xs font-semibold text-[#69483F] dark:text-[#D5A16D]">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit_note</span>
              Need a gentle prompt?
            </summary>
            <div className="pb-3 space-y-2">
              <p className="font-serif italic text-sm text-[#252B25] dark:text-[#E8EBDD] leading-snug">
                “{prompts[promptIndex]}”
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleInsertPrompt}
                  className="min-h-11 rounded-lg bg-[#E8EBDD] dark:bg-[#2C332C] px-3 text-xs font-semibold text-[#46644B] dark:text-[#D5A16D]"
                >
                  Insert prompt
                </button>
                <button
                  type="button"
                  onClick={handleShufflePrompt}
                  className="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#77786F] dark:text-[#D0C4BA] hover:bg-[#F2EFE8] dark:hover:bg-[#24201D]"
                >
                  Show another
                </button>
              </div>
            </div>
          </details>

          {/* Composer Footer */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#E3DED5]/70 dark:border-[#313831]">
            <div aria-live="polite" className="flex flex-wrap items-center gap-2.5 text-[#77786F] dark:text-[#A6ABA0] text-xs">
              <span className="tabular-nums font-mono">{wordCount} words</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#46644B] dark:text-[#8EAA92]">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>Saved locally</span>
              </span>
              {isDirty && (
                <>
                  <span>•</span>
                  <span className="text-[#B16F4C] dark:text-[#D49877] font-medium">Unsaved edits</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={!isDirty}
                onClick={handleDiscardClick}
                className="min-h-11 px-3 rounded-lg text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] hover:bg-[#F2EFE8] text-xs font-medium transition-colors disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={!isDirty || saveStatus === "saving"}
                onClick={handleSaveReflection}
                className="inline-flex min-h-11 items-center gap-1.5 px-4 rounded-xl bg-[#46644B] text-white text-xs font-semibold hover:bg-[#38503C] transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {saveStatus === "saved" ? "done" : "check"}
                </span>
                <span>{saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Save Reflection"}</span>
              </button>
            </div>
            <span className="sr-only" aria-live="polite">
              {saveStatus === "saving" ? "Saving reflection" : saveStatus === "saved" ? "Reflection saved" : ""}
            </span>
          </div>
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-24">
          <section className="bg-[#F8F6F1] dark:bg-[#24201D] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 shadow-xs">
            {renderArchive("desktop-previous-entries-heading")}
          </section>
        </aside>
        </div>

        <details className="lg:hidden rounded-2xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#24201D] p-4">
          <summary className="min-h-11 cursor-pointer flex items-center justify-between gap-3 font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
            <span>Search previous reflections</span>
            <span className="shrink-0 text-xs font-sans text-[#77786F] dark:text-[#D0C4BA]">
              {allEntries.length} saved
            </span>
          </summary>
          <div className="pt-3">
            {renderArchive("mobile-previous-entries-heading")}
          </div>
        </details>

        {/* Data Sovereignty Footer */}
        <footer className="pt-2">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] flex flex-col items-center text-center space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
            <div className="space-y-0.5">
              <p className="font-serif text-base text-[#252B25] dark:text-[#E8EBDD] font-medium">
                {allEntries.length} reflections stored locally
              </p>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] max-w-xs leading-relaxed">
                Your journal stays private on this device. No remote telemetry or external tracking.
              </p>
            </div>
          </div>
        </footer>

        {/* Discard / Navigation Confirmation Dialog */}
        {showDiscardModal && (
          <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-5 shadow-xl border border-[#E3DED5] dark:border-[#313831] space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#FDECEB] text-[#BA1A1A] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                  Discard Unsaved Reflection?
                </h3>
                <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                  You have unsaved changes in your journal editor. Switching without saving will discard your edits.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={confirmDiscard}
                  className="flex-1 py-2 bg-[#BA1A1A] text-white text-xs font-semibold rounded-xl hover:bg-[#A31616]"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardModal(false);
                    setPendingSwitch(null);
                  }}
                  className="py-2 px-3 border border-[#E3DED5] dark:border-[#313831] text-xs rounded-xl"
                >
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notes;
