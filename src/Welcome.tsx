import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Layout from "./components/Layout";

const Welcome: React.FC = () => {
  const { name, setName } = useUser();
  const [hasStarted, setHasStarted] = useState<boolean>(() => Boolean(name && name.trim()));
  const navigate = useNavigate();

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
      <div className="py-8 max-w-sm sm:max-w-md mx-auto space-y-6">
        {!hasStarted ? (
          <div className="bg-white dark:bg-[#2A2522] rounded-2xl p-6 sm:p-8 border border-[#D2C3BE] dark:border-[#39302B] space-y-5 text-center">
            <div className="space-y-1">
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#261810] dark:text-[#F4EFEA] tracking-tight">
                Recovery Tracker
              </h1>
              <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                A quiet, private journal for your recovery.
              </p>
            </div>

            <form onSubmit={handleStart} className="space-y-4 pt-2">
              <div className="text-left space-y-1.5">
                <label className="block text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]" htmlFor="user-name-input">
                  What should we call you?
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name or initials"
                  className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-[#D2C3BE]/60 dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] text-xs focus:outline-none focus:border-[#3D2C24]"
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full min-h-11 py-2.5 rounded-xl btn-primary text-xs font-semibold disabled:opacity-50 transition-all"
              >
                Get started
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#2A2522] rounded-2xl p-6 sm:p-8 border border-[#D2C3BE] dark:border-[#39302B] space-y-5 text-center">
            <div className="space-y-1">
              <h1 className="font-serif text-3xl font-medium text-[#261810] dark:text-[#F4EFEA]">
                Welcome, {name}
              </h1>
              <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                Your space is ready whenever you want to check in or write.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleProceed}
                className="w-full min-h-11 py-2.5 rounded-xl btn-primary text-xs font-semibold transition-all"
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={() => setHasStarted(false)}
                className="text-xs text-[#6B5B54] dark:text-[#A99A8F] hover:underline"
              >
                Change name
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Welcome;
