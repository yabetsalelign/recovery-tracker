import React from "react";

interface WelcomeMessageProps {
  name: string;
  onProceed: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ name, onProceed }) => {
  return (
    <div className="bg-white dark:bg-[#2A2522] rounded-2xl p-6 sm:p-8 border border-[#D2C3BE] dark:border-[#39302B] space-y-4 text-center">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-medium text-[#261810] dark:text-[#F4EFEA]">
          Hello, {name}
        </h1>
        <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
          A quiet space for your daily recovery practice.
        </p>
      </div>

      <button
        onClick={onProceed}
        className="w-full min-h-11 py-2.5 rounded-xl bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710] text-xs font-semibold"
      >
        Go to Home
      </button>
    </div>
  );
};

export default WelcomeMessage;
