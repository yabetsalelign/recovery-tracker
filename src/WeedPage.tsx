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
import { useRecovery } from "./context/RecoveryContext";

interface DateModalState {
  dateStr: string;
  count: number;
}

const WeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { weedData, logSpecializedCount, calculateSpecializedStreak } = useRecovery();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [activeDateModal, setActiveDateModal] = useState<DateModalState | null>(null);

  const daysThisMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDayIndex = getDay(startOfMonth(currentMonth));
  const leadingBlanks = Array.from({ length: (startDayIndex + 6) % 7 });

  const streak = calculateSpecializedStreak(weedData);

  const handleDayClick = (dateStr: string) => {
    setActiveDateModal({
      dateStr,
      count: weedData[dateStr] !== undefined ? weedData[dateStr] : 0,
    });
  };

  const handleSaveCount = () => {
    if (!activeDateModal) return;
    logSpecializedCount("weed", activeDateModal.dateStr, activeDateModal.count);
    setActiveDateModal(null);
  };

  return (
    <Layout title="Weed Tracker">
      <div className="pt-2 pb-6 space-y-5">
        <header className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#46644B] dark:text-[#8EAA92]">
              Specialized Moderation
            </span>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="text-xs font-semibold text-[#46644B] dark:text-[#8EAA92] hover:underline"
            >
              ← Dashboard
            </button>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            Weed Intake Tracker
          </h1>
          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            Record daily intake and celebrate continuous periods of mental clarity.
          </p>
        </header>

        {/* Milestone Streak Banner */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EBDD] dark:bg-[#2C332C] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92]">
              <span className="material-symbols-outlined text-[20px]">nature</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold block">
                Clear-Mind Streak
              </span>
              <span className="font-serif text-2xl font-medium text-[#46644B] dark:text-[#8EAA92]">
                {streak} {streak === 1 ? "day" : "days"} free
              </span>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92]">
            {streak >= 3 ? "Clarity spark active" : "In progress"}
          </span>
        </div>

        {/* Calendar Card */}
        <div className="bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3DED5]/80 dark:border-[#313831]">
            <h2 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E3DED5] dark:border-[#313831] hover:bg-[#F2EFE8] text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#E3DED5] dark:border-[#313831] hover:bg-[#F2EFE8] text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[11px] font-semibold text-[#77786F] dark:text-[#A6ABA0]">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {leadingBlanks.map((_, i) => (
              <div key={`blank-${i}`} className="h-11 opacity-20"></div>
            ))}
            {daysThisMonth.map((dateObj) => {
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const count = weedData[dateStr];
              const isLogged = count !== undefined;
              const isZero = count === 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center border transition-all ${
                    isZero
                      ? "bg-[#E8EBDD] dark:bg-[#2C332C] border-[#46644B]/40 text-[#46644B] dark:text-[#8EAA92]"
                      : isLogged
                      ? "bg-[#FDECEB] dark:bg-[#3A271E] border-[#B16F4C]/40 text-[#B16F4C] dark:text-[#D49877]"
                      : "bg-[#F8F6F1] dark:bg-[#181B18] border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] hover:border-[#46644B]"
                  }`}
                >
                  <span className="text-xs font-semibold">{format(dateObj, "d")}</span>
                  <span className="text-[10px] font-mono leading-none">
                    {isLogged ? `${count}x` : "-"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E3DED5]/80 dark:border-[#313831] flex items-center justify-between text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
            <span>Click any day to log or adjust count</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#46644B]"></span> 0 (Clean)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B16F4C]"></span> &gt;0 (Used)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Stepper Dialog */}
      {activeDateModal && (
        <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-5 shadow-xl border border-[#E3DED5] dark:border-[#313831] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3DED5] dark:border-[#313831] pb-2">
              <h3 className="font-serif text-lg font-medium text-[#252B25] dark:text-[#E8EBDD]">
                Log Weed Intake ({activeDateModal.dateStr})
              </h3>
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="w-7 h-7 flex items-center justify-center text-[#77786F]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
              Enter the daily count. Setting count to 0 records a day of clean clarity.
            </p>

            <div className="flex items-center justify-center gap-3 py-3">
              <button
                type="button"
                onClick={() =>
                  setActiveDateModal((prev) =>
                    prev ? { ...prev, count: Math.max(0, prev.count - 1) } : null
                  )
                }
                className="w-10 h-10 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] font-bold text-lg flex items-center justify-center hover:bg-[#E8EBDD]"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={activeDateModal.count}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setActiveDateModal((prev) => (prev ? { ...prev, count: val } : null));
                }}
                className="font-serif text-3xl font-medium w-16 text-center text-[#252B25] dark:text-[#E8EBDD] bg-transparent border-b border-[#E3DED5] dark:border-[#313831] focus:outline-none focus:border-[#46644B]"
              />
              <button
                type="button"
                onClick={() =>
                  setActiveDateModal((prev) => (prev ? { ...prev, count: prev.count + 1 } : null))
                }
                className="w-10 h-10 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] font-bold text-lg flex items-center justify-center hover:bg-[#E8EBDD]"
              >
                +
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveCount}
                className="flex-1 py-2.5 rounded-xl bg-[#46644B] text-white text-xs font-semibold hover:bg-[#38503C] transition-colors"
              >
                Save Record
              </button>
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
                className="py-2.5 px-4 rounded-xl border border-[#E3DED5] dark:border-[#313831] text-xs font-medium"
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

export default WeedPage;
