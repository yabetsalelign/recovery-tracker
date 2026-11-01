import React from "react";
import { differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";

interface Milestone {
  target: number;
  label: string;
}

const Counter: React.FC = () => {
  const navigate = useNavigate();
  const { counterStartDate, setCounterStartDate } = useRecovery();

  const startDate = new Date(counterStartDate + "T00:00:00");
  const now = new Date();
  const elapsedDays = !isNaN(startDate.getTime())
    ? Math.max(0, differenceInDays(now, startDate))
    : 0;

  const milestones: Milestone[] = [
    { target: 1, label: "1 day" },
    { target: 7, label: "7 days (1 week)" },
    { target: 14, label: "14 days (2 weeks)" },
    { target: 30, label: "30 days (1 month)" },
    { target: 60, label: "60 days (2 months)" },
    { target: 90, label: "90 days (3 months)" },
  ];

  return (
    <Layout title="Day Counter">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
              Day counter
            </h1>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F] mt-0.5">
              Days since your chosen start date.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="min-h-11 px-3.5 rounded-full btn-secondary text-xs font-semibold"
          >
            ← Progress
          </button>
        </header>

        {/* Counter Hero */}
        <div className="p-6 vesper-card text-center space-y-3">
          <span className="font-serif text-5xl sm:text-6xl text-[#261810] dark:text-[#F4EFEA] font-medium leading-none block">
            {elapsedDays}
          </span>
          <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F] block">
            {elapsedDays === 1 ? "day" : "days"}
          </span>

          <div className="pt-3 border-t border-[#D2C3BE]/50 dark:border-[#39302B] flex items-center justify-center gap-2 text-xs">
            <label htmlFor="counter-start-date" className="text-[#6B5B54] dark:text-[#A99A8F]">
              Start date:
            </label>
            <input
              id="counter-start-date"
              type="date"
              value={counterStartDate}
              onChange={(e) => setCounterStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FFFDFB] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] font-medium focus:outline-none"
            />
          </div>
        </div>

        {/* Milestones list */}
        <div className="vesper-card p-5 space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Milestones
          </h2>

          <div className="space-y-1.5">
            {milestones.map((m) => {
              const reached = elapsedDays >= m.target;
              return (
                <div
                  key={m.target}
                  className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
                    reached
                      ? "bg-[#FDD0C6]/20 dark:bg-[#FDD0C6]/10 border border-[#FDD0C6]/40 dark:border-[#FDD0C6]/20"
                      : "opacity-60"
                  }`}
                >
                  <span className="text-xs font-semibold text-[#261810] dark:text-[#F4EFEA]">
                    {m.label}
                  </span>
                  <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F] flex items-center gap-1">
                    {reached ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] text-[#46644B] dark:text-[#8EAA92]">
                          check
                        </span>
                        <span className="font-medium text-[#46644B] dark:text-[#8EAA92]">Reached</span>
                      </>
                    ) : (
                      <span>{m.target - elapsedDays} days remaining</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Counter;
