import React, { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

interface PendingSwitchState {
  type: "date" | "goal" | "discard";
  value: string;
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

  // Dates for selector (last 30 days)
  const dateOptions = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), i);
    return {
      value: format(d, "yyyy-MM-dd"),
      label: i === 0 ? "Today, " + format(d, "MMM d") : format(d, "EEE, MMM d"),
    };
  });

  return (
    <Layout title="Journal & Notes">
      <div className="pt-2 pb-6 space-y-6">
        {/* Editorial Sub-Header */}
        <section className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0]">
              Private Sanctuary
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8EBDD]/60 dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] text-[11px] font-medium border border-[#46644B]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#46644B]"></span>
              <span>Local Storage</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            Reflections & Journal
          </h1>
          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            A calm, contemplative space to untangle thoughts without judgment or metrics.
          </p>
        </section>

        {/* Contemplative Writing Surface */}
        <section className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-5 shadow-xs space-y-4">
          {/* Header Controls: Date Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E3DED5]/70 dark:border-[#313831]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#46644B] dark:text-[#8EAA92]">
                calendar_today
              </span>
              <select
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] focus:outline-none cursor-pointer"
              >
                {dateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#212521]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#F8F6F1] dark:bg-[#181B18] p-1 rounded-xl text-xs text-[#77786F] dark:text-[#A6ABA0]">
              <span className="text-[11px] px-2 font-medium">Contemplative Space</span>
              <span className="material-symbols-outlined text-[16px] text-[#46644B]">spa</span>
            </div>
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
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
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
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

          {/* Optional Contemplative Prompt */}
          <div className="rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleInsertPrompt}
                className="flex items-center gap-1.5 text-[#B16F4C] dark:text-[#D49877] text-xs font-medium hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Insert gentle prompt</span>
              </button>
              <button
                type="button"
                onClick={handleShufflePrompt}
                className="text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] text-[11px] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">autorenew</span>
                <span>New prompt</span>
              </button>
            </div>
            <p className="font-serif italic text-sm text-[#252B25] dark:text-[#E8EBDD] leading-snug">
              “{prompts[promptIndex]}”
            </p>
          </div>

          {/* Writing Textarea */}
          <div className="relative pt-1">
            <textarea
              rows={5}
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder={`Write your reflection for ${getDisplayName(selectedGoal)} on ${selectedDate}...`}
              className="w-full bg-transparent text-[#252B25] dark:text-[#E8EBDD] font-serif text-base leading-relaxed placeholder:text-[#77786F]/50 placeholder:font-sans placeholder:text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Composer Footer */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#E3DED5]/70 dark:border-[#313831]">
            <div className="flex items-center gap-2.5 text-[#77786F] dark:text-[#A6ABA0] text-xs">
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
                className="px-3 py-1.5 rounded-lg text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] hover:bg-[#F2EFE8] text-xs font-medium transition-colors disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveReflection}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#46644B] text-white text-xs font-semibold hover:bg-[#38503C] transition-all shadow-xs active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {saveStatus === "saved" ? "done" : "check"}
                </span>
                <span>{saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Save Reflection"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Clean Search & Filter Bar */}
        <section className="space-y-2.5 pt-1">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#77786F] text-[18px]">
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries, keywords, or triggers..."
              className="w-full rounded-xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] pl-9 pr-4 py-2.5 text-xs text-[#252B25] dark:text-[#E8EBDD] placeholder:text-[#77786F]/70 focus:outline-none focus:border-[#46644B] shadow-xs"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === "all"
                  ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                  : "bg-white dark:bg-[#212521] text-[#77786F] border-[#E3DED5] dark:border-[#313831]"
              }`}
            >
              All entries ({allEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("General")}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === "General"
                  ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                  : "bg-white dark:bg-[#212521] text-[#77786F] border-[#E3DED5] dark:border-[#313831]"
              }`}
            >
              General Reflections
            </button>
            {trackers.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setActiveFilter(t.name)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter.toLowerCase() === t.name.toLowerCase()
                    ? "bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] border-[#46644B]/30"
                    : "bg-white dark:bg-[#212521] text-[#77786F] border-[#E3DED5] dark:border-[#313831]"
                }`}
              >
                {getDisplayName(t.name)}
              </button>
            ))}
          </div>
        </section>

        {/* Archival Feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <h2 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
              Archival Records
            </h2>
            <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] uppercase tracking-wider">
              Chronological ({filteredEntries.length})
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 text-center border border-[#E3DED5] dark:border-[#313831] space-y-2 shadow-xs">
              <span className="material-symbols-outlined text-[24px] text-[#77786F]">notes</span>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                {allEntries.length === 0
                  ? "No journal entries written yet. Scribe your first reflection above!"
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(entry.date);
                        setSelectedGoal(entry.isGeneral ? "General" : entry.habit);
                        setJournalText(entry.text);
                        setInitialText(entry.text);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs font-semibold text-[#46644B] dark:text-[#8EAA92] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteNote(entry.isGeneral ? "General" : entry.habit, entry.date);
                      }}
                      className="text-xs text-[#BA1A1A] dark:text-[#FFB4AB] hover:underline"
                      title="Delete entry"
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
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    <span>{Math.max(1, Math.round(entry.text.split(/\s+/).length / 130))} min read</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

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
