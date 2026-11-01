import React from "react";

interface WelcomeMessageProps {
  name: string;
  onProceed: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ name, onProceed }) => {
  const affirmations = [
    "One day at a time.",
    "You are not your mistakes.",
    "Small steps still move forward.",
    "You deserve peace.",
  ];
  const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];

  return (
    <div className="bg-white dark:bg-[#212521] rounded-2xl p-6 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-5 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#E8EBDD] dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] flex items-center justify-center mx-auto shadow-xs">
        <span className="material-symbols-outlined text-[24px]">nature</span>
      </div>

      <div className="space-y-1.5">
        <h1 className="font-serif text-3xl font-medium text-[#252B25] dark:text-[#E8EBDD]">
          Hello, {name}
        </h1>
        <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
          You’ve taken your first step. Keep showing up for yourself. You’re doing better than you think.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5]/80 dark:border-[#313831]">
        <p className="font-serif italic text-base text-[#252B25] dark:text-[#E8EBDD]">
          “{randomAffirmation}”
        </p>
      </div>

      <button
        onClick={onProceed}
        className="w-full py-3 rounded-xl bg-[#46644B] hover:bg-[#38503C] text-white text-xs font-semibold tracking-wide transition-all shadow-xs"
      >
        Proceed to Tracker
      </button>
    </div>
  );
};

export default WelcomeMessage;
