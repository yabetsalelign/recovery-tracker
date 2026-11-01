import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  getDay,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useRecovery } from "./context/RecoveryContext";

interface DateModalState {
  dateStr: string;
  count: number;
}

const PornPage: React.FC = () => {
  const navigate = useNavigate();
  const { discreetMode } = useTheme();
  const { pornData, pornNotes, savePornNotes, logSpecializedCount, calculateSpecializedStreak } = useRecovery();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [activeDateModal, setActiveDateModal] = useState<DateModalState | null>(null);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDayIndex = getDay(startOfMonth(currentMonth));
  const leadingBlanks = Array.from({ length: (startDayIndex + 6) % 7 });

  const streak = calculateSpecializedStreak(pornData);

  const handleDayClick = (dateStr: string) => {
    setActiveDateModal({
      dateStr,
      count: pornData[dateStr] !== undefined ? pornData[dateStr] : 0,
    });
  };

  const handleSaveCount = () => {
    if (!activeDateModal) return;
    logSpecializedCount("porn", activeDateModal.dateStr, activeDateModal.count);
    setActiveDateModal(null);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    savePornNotes(e.target.value);
  };

  const title = discreetMode ? "Impulse tracker" : "Porn tracker";

  return (
    <Layout title={title}>
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
              {title}
            </h1>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] mt-0.5">
              Record daily counts. Days at zero reflect mindful pauses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="min-h-11 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-white dark:bg-[#2A2522] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] transition-colors"
          >
            ← Progress
          </button>
        </header>

        {/* Zero-day streak card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#2A2522] border border-[#D2C3BE] dark:border-[#39302B] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6B5B54] dark:text-[#A99A8F] block">
              Consecutive zero-count days
            </span>
            <span className="font-serif text-3xl font-medium text-[#261810] dark:text-[#F4EFEA]">
              {streak} {streak === 1 ? "day" : "days"}
            </span>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#5E4D45] dark:text-[#D0C4BA]">
            {streak > 0 ? "Active streak" : "Start today"}
          </span>
        </div>

        {/* Calendar Card */}
        <div className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
            <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="min-h-11 min-w-11 rounded-xl flex items-center justify-center border border-[#D2C3BE] dark:border-[#39302B] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="min-h-11 min-w-11 rounded-xl flex items-center justify-center border border-[#D2C3BE] dark:border-[#39302B] hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-xs font-semibold text-[#6B5B54] dark:text-[#A99A8F] py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {leadingBlanks.map((_, i) => (
              <div key={`blank-${i}`} className="h-11" />
            ))}

            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const count = pornData[dateStr];
              const isRecorded = count !== undefined;
              const isZero = count === 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  aria-label={`${format(dateObj, "MMMM d")}: ${isRecorded ? `${count} count` : "No record"}`}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs transition-colors ${
                    isZero
                      ? "bg-[#46644B] dark:bg-[#8EAA92] text-white dark:text-[#211710] font-semibold"
                      : isRecorded
                      ? "bg-[#D47A55] text-white font-semibold"
                      : "hover:bg-[#FBF2E7] dark:hover:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA]"
                  }`}
                >
                  <span>{format(dateObj, "d")}</span>
                  {isRecorded && (
                    <span className="text-[10px] leading-none opacity-90">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#D2C3BE]/50 dark:border-[#39302B] text-xs text-[#6B5B54] dark:text-[#A99A8F]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#46644B] dark:bg-[#8EAA92]" />
              <span>Zero count</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D47A55]" />
              <span>Logged usage</span>
            </div>
          </div>
        </div>

        {/* Private Notes */}
        <section className="bg-white dark:bg-[#2A2522] rounded-2xl border border-[#D2C3BE] dark:border-[#39302B] p-5 space-y-2">
          <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Tracker notes
          </h2>
          <textarea
            rows={3}
            value={pornNotes}
            onChange={handleNotesChange}
            placeholder="Add any triggers, patterns, or notes..."
            className="w-full p-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] text-xs text-[#261810] dark:text-[#F4EFEA] border border-[#D2C3BE] dark:border-[#39302B] focus:outline-none resize-none"
          />
        </section>
      </div>

      {/* Date Count Modal */}
      {activeDateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="porn-modal-title"
            className="w-full max-w-xs bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 id="porn-modal-title" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Record count
              </h3>
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#6B5B54] dark:text-[#A99A8F]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              Date: {activeDateModal.dateStr}
            </p>

            <div className="flex items-center justify-center gap-3 py-2">
              <button
                type="button"
                aria-label="Decrease count"
                onClick={() =>
                  setActiveDateModal((prev) =>
                    prev ? { ...prev, count: Math.max(0, prev.count - 1) } : null
                  )
                }
                className="min-h-11 min-w-11 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE] dark:border-[#39302B] text-base font-semibold flex items-center justify-center"
              >
                -
              </button>
              <span className="font-serif text-3xl font-medium w-16 text-center text-[#261810] dark:text-[#F4EFEA]">
                {activeDateModal.count}
              </span>
              <button
                type="button"
                aria-label="Increase count"
                onClick={() =>
                  setActiveDateModal((prev) =>
                    prev ? { ...prev, count: prev.count + 1 } : null
                  )
                }
                className="min-h-11 min-w-11 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] border border-[#D2C3BE] dark:border-[#39302B] text-base font-semibold flex items-center justify-center"
              >
                +
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveCount}
                className="min-h-11 flex-1 py-2 px-3 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="min-h-11 py-2 px-4 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]"
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

export default PornPage;
