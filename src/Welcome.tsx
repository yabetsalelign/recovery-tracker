import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Layout from "./components/Layout";

const Welcome: React.FC = () => {
  const { name, setName } = useUser();
  const [hasStarted, setHasStarted] = useState<boolean>(() => Boolean(name && name.trim()));
  const navigate = useNavigate();

  const affirmations = [
    "One day at a time.",
    "You are not your mistakes.",
    "Small steps still move forward.",
    "You deserve peace and clarity.",
    "Healing is a quiet, steady practice.",
  ];
  const [affirmation] = useState<string>(
    () => affirmations[Math.floor(Math.random() * affirmations.length)]
  );

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setHasStarted(true);
    }
  };

  const handleProceed = () => {
    navigate("/home");
  };

  return (
    <Layout title="Welcome" hideNav={!name}>
      <div className="pt-6 pb-12 max-w-sm md:max-w-md mx-auto space-y-6">
        {!hasStarted ? (
          <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-[24px]">spa</span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#46644B] dark:text-[#8EAA92]">
                Personal Sanctuary
              </span>
              <h1 className="font-serif text-3xl font-medium text-[#252B25] dark:text-[#E8EBDD] tracking-tight">
                Recovery Tracker
              </h1>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                A private, local-first space for mindful habit tracking, journal reflections, and personal sovereignty.
              </p>
            </div>

            <form onSubmit={handleStart} className="space-y-4 pt-1">
              <div className="text-left space-y-1">
                <label className="block text-xs font-semibold text-[#252B25] dark:text-[#E8EBDD]" htmlFor="user-name-input">
                  How should we address you?
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name or initials"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DED5] dark:border-[#313831] bg-[#F8F6F1] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] text-sm focus:outline-none focus:border-[#46644B]"
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl bg-[#46644B] hover:bg-[#38503C] text-white text-xs font-semibold tracking-wide transition-all disabled:opacity-50 shadow-xs"
              >
                Begin Your Journey
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-5 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-[24px]">nature</span>
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif text-3xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
                Welcome, {name}
              </h1>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                You’ve taken your first intentional step. Keep showing up for yourself. You’re doing better than you think.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5]/80 dark:border-[#313831]">
              <span className="text-[10px] uppercase tracking-widest text-[#77786F] dark:text-[#A6ABA0] font-semibold block mb-1">
                Today’s Gentle Thought
              </span>
              <p className="font-serif italic text-base text-[#252B25] dark:text-[#E8EBDD]">
                “{affirmation}”
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleProceed}
                className="w-full py-3 rounded-xl bg-[#46644B] hover:bg-[#38503C] text-white text-xs font-semibold tracking-wide transition-all shadow-xs"
              >
                Enter Dashboard
              </button>
              <button
                type="button"
                onClick={() => setHasStarted(false)}
                className="text-xs text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] dark:hover:text-[#E8EBDD] underline"
              >
                Update display name
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Welcome;
