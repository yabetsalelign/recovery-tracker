import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useUser } from "./context/UserContext";
import { useRecovery } from "./context/RecoveryContext";

interface ToastState {
  show: boolean;
  message: string;
}

const Settings: React.FC = () => {
  const {
    theme,
    toggleTheme,
    fontScale,
    setFontScale,
    gentleTransitions,
    setGentleTransitions,
    discreetMode,
    setDiscreetMode,
  } = useTheme();

  const { name, setName } = useUser();
  const { exportJSON, exportCSV, validateAndImportJSON, resetAllData } = useRecovery();

  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });
  const [showWipeModal, setShowWipeModal] = useState<boolean>(false);
  const [showBreathingModal, setShowBreathingModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Breathing state
  const [breathPhase, setBreathPhase] = useState<string>("Inhale");
  const [breathScale, setBreathScale] = useState<number>(1);

  const showNotification = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 2000);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (showBreathingModal) {
      let step = 0;
      setBreathPhase("Inhale");
      setBreathScale(1.25);
      interval = setInterval(() => {
        step = (step + 1) % 3;
        if (step === 0) {
          setBreathPhase("Inhale");
          setBreathScale(1.25);
        } else if (step === 1) {
          setBreathPhase("Hold");
          setBreathScale(1.25);
        } else {
          setBreathPhase("Exhale");
          setBreathScale(0.85);
        }
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showBreathingModal]);

  const handleExportJSON = () => {
    try {
      exportJSON();
      showNotification("Backup downloaded");
    } catch {
      showNotification("Error exporting backup");
    }
  };

  const handleExportCSV = () => {
    try {
      exportCSV();
      showNotification("CSV downloaded");
    } catch {
      showNotification("Error generating CSV");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") {
        showNotification("Unable to read file");
        return;
      }

      const res = validateAndImportJSON(content);
      if (res.success) {
        showNotification("Backup restored");
      } else {
        showNotification(res.error || "Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmResetData = () => {
    resetAllData();
    setShowWipeModal(false);
    setName("");
    showNotification("All records reset");
  };

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#261810] dark:text-[#F4EFEA]">
            Settings
          </h1>
          <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
            Preferences, appearance, and local data management.
          </p>
        </header>

        {/* Profile */}
        <section aria-labelledby="profile-heading" className="bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
          <h2 id="profile-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Profile
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Display name"
              placeholder="Your name or initials"
              className="min-h-11 flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D2C3BE]/60 dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-[#261810] dark:text-[#F4EFEA] focus:outline-none focus:border-[#3D2C24] dark:focus:border-[#D47A55]"
            />
            <button
              type="button"
              onClick={() => showNotification("Name saved")}
              className="min-h-11 px-4 rounded-xl btn-primary text-xs font-semibold"
            >
              Save
            </button>
          </div>
        </section>

        {/* Appearance */}
        <section aria-labelledby="appearance-heading" className="bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] space-y-4">
          <h2 id="appearance-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Appearance
          </h2>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA] block">
              Theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={theme === "light"}
                onClick={() => {
                  toggleTheme("light");
                  showNotification("Warm Paper theme active");
                }}
                className={`min-h-11 p-3 rounded-xl border text-left transition-colors ${
                  theme === "light"
                    ? "border-[#3D2C24] bg-[#FBF2E7]"
                    : "border-[#D2C3BE]/50 dark:border-[#39302B] bg-white dark:bg-[#1E1B18]"
                }`}
              >
                <span className="font-semibold text-xs text-[#261810] block">Warm Paper</span>
                <span className="text-[11px] text-[#6B5B54]">Light ivory & cream</span>
              </button>

              <button
                type="button"
                aria-pressed={theme === "dark"}
                onClick={() => {
                  toggleTheme("dark");
                  showNotification("Charcoal Night theme active");
                }}
                className={`min-h-11 p-3 rounded-xl border text-left transition-colors ${
                  theme === "dark"
                    ? "border-[#D47A55] bg-[#1E1B18]"
                    : "border-[#D2C3BE]/50 dark:border-[#39302B] bg-white dark:bg-[#1E1B18]"
                }`}
              >
                <span className="font-semibold text-xs text-[#F4EFEA] block">Charcoal Night</span>
                <span className="text-[11px] text-[#A99A8F]">Warm dark charcoal</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#D2C3BE]/40 dark:border-[#39302B] flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Reading size
              </span>
              <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                Standard or comfortable typography
              </span>
            </div>
            <div className="flex bg-[#FBF2E7] dark:bg-[#1E1B18] p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setFontScale("standard")}
                aria-pressed={fontScale === "standard"}
                className={`min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  fontScale === "standard"
                    ? "bg-white dark:bg-[#2A2522] text-[#261810] dark:text-[#F4EFEA] shadow-xs"
                    : "text-[#6B5B54] dark:text-[#A99A8F]"
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setFontScale("comfort")}
                aria-pressed={fontScale === "comfort"}
                className={`min-h-11 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  fontScale === "comfort"
                    ? "bg-white dark:bg-[#2A2522] text-[#261810] dark:text-[#F4EFEA] shadow-xs"
                    : "text-[#6B5B54] dark:text-[#A99A8F]"
                }`}
              >
                Comfort
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#D2C3BE]/40 dark:border-[#39302B] flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Reduced motion
              </span>
              <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                Minimize UI movement
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gentleTransitions}
              onClick={() => setGentleTransitions(!gentleTransitions)}
              className={`min-h-11 w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                gentleTransitions ? "bg-[#B06060] dark:bg-[#C47A6A]" : "bg-[#D2C3BE] dark:bg-[#39302B]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  gentleTransitions ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section aria-labelledby="privacy-heading" className="bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
          <h2 id="privacy-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Privacy
          </h2>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Discreet mode
              </span>
              <span className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
                Obscure sensitive habit names when in public
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={discreetMode}
              onClick={() => setDiscreetMode(!discreetMode)}
              className={`min-h-11 min-w-11 w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                discreetMode ? "bg-[#B06060] dark:bg-[#C47A6A]" : "bg-[#D2C3BE] dark:bg-[#39302B]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  discreetMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Data & Backup */}
        <section aria-labelledby="data-heading" className="bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
          <div className="space-y-0.5">
            <h2 id="data-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Data & Backups
            </h2>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              Your records stay on this device. Export copies for safekeeping.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportJSON}
              className="min-h-11 p-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-left hover:border-[#3D2C24] transition-colors"
            >
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Export backup (JSON)
              </span>
              <span className="text-[11px] text-[#6B5B54] dark:text-[#A99A8F]">
                Full journal & tracker data
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-11 p-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-left hover:border-[#3D2C24] transition-colors"
            >
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Export spreadsheet (CSV)
              </span>
              <span className="text-[11px] text-[#6B5B54] dark:text-[#A99A8F]">
                Tabular check-in records
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#D2C3BE]/40 dark:border-[#39302B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <label className="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-xs font-semibold text-[#261810] dark:text-[#F4EFEA] cursor-pointer hover:border-[#3D2C24]">
              <span>Restore from backup</span>
              <input accept=".json" className="hidden" onChange={handleImportFile} type="file" />
            </label>

            <button
              type="button"
              onClick={() => setShowWipeModal(true)}
              className="min-h-11 px-4 py-2 rounded-xl text-xs font-semibold text-[#BA1A1A] dark:text-[#F0A08D] hover:bg-[#FDECEB] dark:hover:bg-[#4A2B25] transition-colors"
            >
              Reset all data
            </button>
          </div>
        </section>

        {/* Grounding & Support */}
        <section aria-labelledby="grounding-heading" className="bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] space-y-3">
          <h2 id="grounding-heading" className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
            Grounding & Support
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowBreathingModal(true)}
              className="min-h-11 p-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-left hover:border-[#3D2C24] transition-colors"
            >
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Box breathing
              </span>
              <span className="text-[11px] text-[#6B5B54] dark:text-[#A99A8F]">
                Quick calming exercise
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="min-h-11 p-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] bg-[#FBF2E7] dark:bg-[#1E1B18] text-left hover:border-[#3D2C24] transition-colors"
            >
              <span className="font-semibold text-xs text-[#261810] dark:text-[#F4EFEA] block">
                Support resources
              </span>
              <span className="text-[11px] text-[#6B5B54] dark:text-[#A99A8F]">
                Helplines & emergency aids
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#261810] dark:bg-[#F4EFEA] text-white dark:text-[#211710] px-4 py-2 rounded-xl text-xs font-semibold shadow-lg"
        >
          {toast.message}
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
              Reset all records?
            </h3>
            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              This will permanently delete all journal entries and check-ins from this device.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={confirmResetData}
                className="min-h-11 flex-1 py-2 rounded-xl bg-[#BA1A1A] text-white text-xs font-semibold"
              >
                Reset everything
              </button>
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="min-h-11 py-2 px-3 rounded-xl border border-[#D2C3BE] dark:border-[#39302B] text-xs font-semibold text-[#5E4D45] dark:text-[#D0C4BA]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Box Breathing Modal */}
      {showBreathingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-[#2A2522] rounded-2xl p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl text-center space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Box breathing
              </h3>
              <button
                type="button"
                onClick={() => setShowBreathingModal(false)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#6B5B54] dark:text-[#A99A8F]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center">
              <div
                style={{ transform: `scale(${breathScale})`, transition: "transform 3.5s ease-in-out" }}
                className="w-24 h-24 rounded-full bg-[#FBF2E7] dark:bg-[#1E1B18] border-2 border-[#3D2C24] dark:border-[#D47A55] flex items-center justify-center"
              >
                <span className="font-serif text-base font-medium text-[#261810] dark:text-[#F4EFEA]">
                  {breathPhase}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
              Follow the rhythm to steady your breathing.
            </p>

            <button
              type="button"
              onClick={() => setShowBreathingModal(false)}
              className="min-h-11 w-full py-2 rounded-xl btn-primary text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Support Resources Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#2A2522] rounded-2xl p-5 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[#261810] dark:text-[#F4EFEA]">
                Support resources
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="min-h-11 min-w-11 flex items-center justify-center text-[#6B5B54] dark:text-[#A99A8F]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] space-y-0.5">
                <span className="font-semibold text-[#261810] dark:text-[#F4EFEA] block">
                  SAMHSA National Helpline
                </span>
                <p className="text-[#6B5B54] dark:text-[#A99A8F]">1-800-662-4357 · 24/7 free and confidential</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] space-y-0.5">
                <span className="font-semibold text-[#261810] dark:text-[#F4EFEA] block">
                  Crisis Text Line
                </span>
                <p className="text-[#6B5B54] dark:text-[#A99A8F]">Text HOME to 741741 · 24/7 crisis support</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FBF2E7] dark:bg-[#1E1B18] space-y-0.5">
                <span className="font-semibold text-[#261810] dark:text-[#F4EFEA] block">
                  988 Suicide & Crisis Lifeline
                </span>
                <p className="text-[#6B5B54] dark:text-[#A99A8F]">Call or text 988 · 24/7 immediate help</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="min-h-11 w-full py-2 rounded-xl btn-primary text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;
