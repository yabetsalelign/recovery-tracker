import React from "react";
import { differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useRecovery } from "./context/RecoveryContext";

interface Milestone {
  target: number;
  label: string;
  desc: string;
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
    { target: 1, label: "24 Hours Presence", desc: "The foundational day" },
    { target: 7, label: "One Week of Rhythm", desc: "Initial habit stabilization" },
    { target: 14, label: "Two Weeks Clarity", desc: "Mental and somatic balance" },
    { target: 30, label: "One Month of Renewal", desc: "Neural pathway strengthening" },
    { target: 60, label: "Two Months Steady", desc: "Consistent grounded practice" },
    { target: 90, label: "Quarter Year Reset", desc: "Deep transformative lifestyle" },
  ];

  return (
    <Layout title="Day Counter">
      <div className="pt-2 pb-6 space-y-5">
        <header className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#46644B] dark:text-[#8EAA92]">
              Continuous Timer
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
            Sovereign Day Counter
          </h1>
          <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            Measuring consecutive time in renewal. Set your intentional start date below.
          </p>
        </header>

        {/* Hero Days Display */}
        <div className="p-6 bg-white dark:bg-[#212521] rounded-2xl border border-[#E3DED5] dark:border-[#313831] shadow-xs text-center space-y-3">
          <span className="text-[11px] uppercase tracking-wider text-[#77786F] dark:text-[#A6ABA0] font-semibold block">
            Time in Renewal
          </span>
          <div className="font-serif text-5xl md:text-6xl text-[#46644B] dark:text-[#8EAA92] font-medium leading-none">
            {elapsedDays}
          </div>
          <span className="text-sm font-medium text-[#77786F] dark:text-[#A6ABA0] block">
            {elapsedDays === 1 ? "day maintained" : "days maintained"}
          </span>

          <div className="pt-2 border-t border-[#E3DED5]/80 dark:border-[#313831] max-w-xs mx-auto flex items-center justify-between text-xs">
            <span className="text-[#77786F] dark:text-[#A6ABA0]">Journey began:</span>
            <input
              type="date"
              value={counterStartDate}
              onChange={(e) => setCounterStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] font-medium focus:outline-none"
            />
          </div>
        </div>

        {/* Milestone Thresholds */}
        <div className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
            Renewal Milestones
          </h2>

          <div className="space-y-2">
            {milestones.map((m) => {
              const reached = elapsedDays >= m.target;
              return (
                <div
                  key={m.target}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    reached
                      ? "bg-[#E8EBDD]/60 dark:bg-[#2C332C]/60 border-[#46644B]/30"
                      : "bg-white dark:bg-[#212521] border-[#E3DED5] dark:border-[#313831]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        reached
                          ? "bg-[#46644B] text-white"
                          : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {reached ? "check" : "flag"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]">
                        {m.label} ({m.target}d)
                      </h3>
                      <p className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">{m.desc}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      reached
                        ? "bg-[#46644B] text-white"
                        : "bg-[#F8F6F1] dark:bg-[#181B18] text-[#77786F] dark:text-[#A6ABA0]"
                    }`}
                  >
                    {reached ? "Achieved" : `${m.target - elapsedDays}d away`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/home")}
          className="w-full py-2.5 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-white dark:bg-[#212521] text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD] hover:bg-[#F2EFE8] transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </Layout>
  );
};

export default Counter;
