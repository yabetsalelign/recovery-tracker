import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import { useTheme } from "./context/ThemeContext";
import { useUser } from "./context/UserContext";
import { useRecovery } from "./context/RecoveryContext";

interface ToastState {
  show: boolean;
  message: string;
  icon: string;
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

  const [toast, setToast] = useState<ToastState>({ show: false, message: "", icon: "check_circle" });
  const [showWipeModal, setShowWipeModal] = useState<boolean>(false);
  const [showBreathingModal, setShowBreathingModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Breathing state
  const [breathPhase, setBreathPhase] = useState<string>("Inhale");
  const [breathScale, setBreathScale] = useState<number>(1);

  const showNotification = (msg: string, icon = "check_circle") => {
    setToast({ show: true, message: msg, icon });
    setTimeout(() => {
      setToast({ show: false, message: "", icon: "check_circle" });
    }, 2500);
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
      showNotification("Archive JSON downloaded", "file_download_done");
    } catch {
      showNotification("Error exporting JSON", "error");
    }
  };

  const handleExportCSV = () => {
    try {
      exportCSV();
      showNotification("Check-ins CSV downloaded", "file_download_done");
    } catch {
      showNotification("Error generating CSV", "error");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") {
        showNotification("Unable to read file", "error");
        return;
      }

      const res = validateAndImportJSON(content);
      if (res.success) {
        showNotification("Archive restored successfully", "task_alt");
      } else {
        showNotification(res.error || "Invalid archive format", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmResetData = () => {
    resetAllData();
    setShowWipeModal(false);
    setName("");
    showNotification("Local records reset", "delete");
  };

  return (
    <Layout title="Settings & Privacy">
      <div className="pt-2 pb-6 space-y-6">
        {/* Editorial Subheader */}
        <section className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#46644B] dark:text-[#8EAA92]">
            <span className="material-symbols-outlined text-[17px]">verified_user</span>
            <span className="text-[11px] uppercase tracking-widest font-semibold">Private by Architecture</span>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#252B25] dark:text-[#E8EBDD]">
            Preferences & Privacy
          </h1>
          <p className="text-sm text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
            Honest, device-first controls. You keep complete sovereignty over your recovery archive and visual atmosphere.
          </p>
        </section>

        {/* User Profile */}
        <section className="bg-white dark:bg-[#212521] rounded-2xl p-4 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">Display Name</span>
            <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">Local profile</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or initials"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#E3DED5] dark:border-[#313831] bg-[#F7F4EE] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] focus:outline-none focus:border-[#46644B]"
            />
            <button
              type="button"
              onClick={() => showNotification("Name updated")}
              className="px-3.5 py-2 rounded-lg bg-[#46644B] text-white text-xs font-medium hover:bg-[#38503C] transition-colors"
            >
              Save
            </button>
          </div>
        </section>

        {/* Atmosphere & Reading */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#46644B] dark:text-[#8EAA92] text-[20px]">palette</span>
              Atmosphere & Reading
            </h2>
            <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0] uppercase tracking-wider">Look & Feel</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Warm Light Option */}
            <div
              onClick={() => {
                toggleTheme("light");
                showNotification("Warm Paper palette active");
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
                theme === "light"
                  ? "bg-white border-[#46644B]"
                  : "bg-white/80 dark:bg-[#212521] border-[#E3DED5] dark:border-[#313831]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">Warm Paper</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    theme === "light" ? "bg-[#46644B] text-white" : "border border-[#E3DED5]"
                  }`}
                >
                  {theme === "light" && <span className="material-symbols-outlined text-[13px]">check</span>}
                </div>
              </div>
              <p className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0] leading-snug mb-3">
                Ivory pulp paper with calming forest sage pigment.
              </p>
              <div className="h-7 rounded-lg bg-[#F7F4EE] border border-[#E3DED5] flex items-center px-2 gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#46644B]"></div>
                <div className="h-1.5 w-8 rounded-full bg-[#E3DED5]"></div>
                <div className="h-1.5 w-5 rounded-full bg-[#B16F4C] ml-auto"></div>
              </div>
            </div>

            {/* Charcoal Night Option */}
            <div
              onClick={() => {
                toggleTheme("dark");
                showNotification("Charcoal Night palette active");
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
                theme === "dark"
                  ? "bg-[#212521] border-[#8EAA92]"
                  : "bg-[#212521]/70 border-[#313831]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-[#E8EBDD]">Charcoal Night</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    theme === "dark" ? "bg-[#8EAA92] text-[#181B18]" : "border border-white/20"
                  }`}
                >
                  {theme === "dark" && <span className="material-symbols-outlined text-[13px]">check</span>}
                </div>
              </div>
              <p className="text-[11.5px] text-[#A6ABA0] leading-snug mb-3">
                Deep slate ground with warm, low-glare contrast.
              </p>
              <div className="h-7 rounded-lg bg-[#181B18] border border-white/10 flex items-center px-2 gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#8EAA92]"></div>
                <div className="h-1.5 w-8 rounded-full bg-white/20"></div>
                <div className="h-1.5 w-5 rounded-full bg-[#D49877] ml-auto"></div>
              </div>
            </div>
          </div>

          {/* Reading Scale & Transitions Card */}
          <div className="bg-white dark:bg-[#212521] rounded-2xl p-4 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">Reading Scale</span>
                <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                  Adjust typography for relaxed contemplation
                </span>
              </div>
              <div className="flex items-center bg-[#F2EFE8] dark:bg-[#181B18] p-1 rounded-xl gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFontScale("standard");
                    showNotification("Standard reading scale");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    fontScale === "standard"
                      ? "bg-white dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] shadow-xs font-semibold"
                      : "text-[#77786F] dark:text-[#A6ABA0]"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFontScale("comfort");
                    showNotification("Comfort reading scale");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    fontScale === "comfort"
                      ? "bg-white dark:bg-[#2C332C] text-[#46644B] dark:text-[#8EAA92] shadow-xs font-semibold"
                      : "text-[#77786F] dark:text-[#A6ABA0]"
                  }`}
                >
                  Comfort
                </button>
              </div>
            </div>

            <div className="h-px bg-[#E3DED5]/60 dark:bg-[#313831] w-full"></div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">Gentle Transitions</span>
                <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                  Mute swift animations for peaceful focus
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gentleTransitions}
                onClick={() => {
                  const next = !gentleTransitions;
                  setGentleTransitions(next);
                  showNotification(next ? "Gentle transitions enabled" : "Standard animations active");
                }}
                className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors duration-200 shrink-0 ${
                  gentleTransitions ? "bg-[#46644B]" : "bg-[#E3DED5] dark:bg-[#313831]"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-xs transform transition-transform duration-200 flex items-center justify-center ${
                    gentleTransitions ? "translate-x-5" : "translate-x-0"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] text-[#46644B]">spa</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Local Storage & Privacy */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#46644B] dark:text-[#8EAA92] text-[20px]">lock_clock</span>
              Local Storage & Privacy
            </h2>
            <span className="text-[11px] text-[#46644B] dark:text-[#8EAA92] font-semibold tracking-wider uppercase">
              100% Device-Only
            </span>
          </div>

          <div className="bg-[#E8EBDD]/50 dark:bg-[#2C332C]/40 border border-[#E3DED5] dark:border-[#313831] rounded-2xl p-4 flex gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#212521] flex items-center justify-center shrink-0 text-[#46644B] dark:text-[#8EAA92] border border-[#E3DED5] dark:border-[#313831]">
              <span className="material-symbols-outlined text-[22px]">vpn_key_off</span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">
                Zero Telemetry & Offline Sovereignty
              </span>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                Your journal reflections, sobriety milestones, and habit check-ins reside exclusively in your browser’s{" "}
                <code className="font-mono text-[11px] bg-white dark:bg-[#181B18] px-1.5 py-0.5 rounded border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD]">
                  localStorage
                </code>
                . No analytics cookies, no behavioral tracking, and no external cloud servers ever touch your records.
              </p>
            </div>
          </div>

          {/* Backup & Export Actions */}
          <div className="bg-white dark:bg-[#212521] rounded-2xl p-4 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-3">
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">Physical Archival Backups</span>
              <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">
                Download portable backup copies or restore an archive file
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] hover:bg-[#F2EFE8] dark:hover:bg-[#282D28] border border-[#E3DED5]/80 dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#212521] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92] border border-[#E3DED5] dark:border-[#313831]">
                    <span className="material-symbols-outlined text-[19px]">download_for_offline</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">Export Data Archive (JSON)</span>
                    <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
                      Full recovery journal, check-ins, and metadata
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#77786F] text-[18px]">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] hover:bg-[#F2EFE8] dark:hover:bg-[#282D28] border border-[#E3DED5]/80 dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#212521] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92] border border-[#E3DED5] dark:border-[#313831]">
                    <span className="material-symbols-outlined text-[19px]">table_view</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">Download Check-ins (CSV)</span>
                    <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
                      Tabular spreadsheet of dates, habits, and status
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#77786F] text-[18px]">chevron_right</span>
              </button>

              <label className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] hover:bg-[#F2EFE8] dark:hover:bg-[#282D28] border border-[#E3DED5]/80 dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#212521] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92] border border-[#E3DED5] dark:border-[#313831]">
                    <span className="material-symbols-outlined text-[19px]">file_upload</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">Import Archive File</span>
                    <span className="text-[11px] text-[#77786F] dark:text-[#A6ABA0]">
                      Restore previously exported backup safely
                    </span>
                  </div>
                </div>
                <input accept=".json" className="hidden" onChange={handleImportFile} type="file" />
                <span className="material-symbols-outlined text-[#77786F] text-[18px]">drive_folder_upload</span>
              </label>
            </div>
          </div>
        </section>

        {/* Discreet Dashboard */}
        <section className="bg-white dark:bg-[#212521] rounded-2xl p-4 border border-[#E3DED5] dark:border-[#313831] shadow-xs flex items-center justify-between gap-3">
          <div className="flex flex-col pr-2">
            <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">
              Conceal Specialized Habit Trackers
            </span>
            <span className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
              Discreetly obscure specific habit titles when sharing screens or opening in public
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={discreetMode}
            onClick={() => {
              const next = !discreetMode;
              setDiscreetMode(next);
              showNotification(next ? "Discreet dashboard enabled" : "All habit flows visible");
            }}
            className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors duration-200 shrink-0 ${
              discreetMode ? "bg-[#46644B]" : "bg-[#E3DED5] dark:bg-[#313831]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                discreetMode ? "translate-x-5" : "translate-x-0"
              }`}
            ></div>
          </button>
        </section>

        {/* Gentle Grounding */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#B16F4C] dark:text-[#D49877] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]">self_improvement</span>
              Gentle Grounding
            </h2>
            <span className="text-[11px] text-[#B16F4C] dark:text-[#D49877] uppercase tracking-wider font-semibold">
              Immediate Relief
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setShowBreathingModal(true)}
              className="p-4 rounded-2xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] hover:bg-[#F8F6F1] dark:hover:bg-[#282D28] transition-colors cursor-pointer shadow-xs flex flex-col"
            >
              <div className="w-9 h-9 rounded-xl bg-[#E8EBDD] dark:bg-[#2C332C] flex items-center justify-center text-[#46644B] dark:text-[#8EAA92] mb-2.5">
                <span className="material-symbols-outlined text-[20px]">air</span>
              </div>
              <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD] mb-0.5">Box Breathing</span>
              <span className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0]">Calm the vagus nerve</span>
            </div>

            <div
              onClick={() => setShowSupportModal(true)}
              className="p-4 rounded-2xl bg-white dark:bg-[#212521] border border-[#E3DED5] dark:border-[#313831] hover:bg-[#F8F6F1] dark:hover:bg-[#282D28] transition-colors cursor-pointer shadow-xs flex flex-col"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F9ECE5] dark:bg-[#3A271E] flex items-center justify-center text-[#B16F4C] dark:text-[#D49877] mb-2.5">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </div>
              <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD] mb-0.5">Support Lines</span>
              <span className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0]">Confidential 24/7 aids</span>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#BA1A1A] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              Data Management
            </h2>
            <span className="text-[11px] text-[#BA1A1A] font-semibold tracking-wider uppercase">Caution</span>
          </div>

          <div className="bg-white dark:bg-[#212521] rounded-2xl p-4 border border-[#E3DED5] dark:border-[#313831] shadow-xs space-y-3.5">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-[#252B25] dark:text-[#E8EBDD]">Reset Browser Memory</span>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                Permanently purges all journal entries, sobriety milestones, and habit check-ins from this device's browser
                localStorage. This action cannot be undone without a saved backup file.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWipeModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FDECEB] dark:bg-[#441B1B] border border-[#BA1A1A]/20 text-[#7A1010] dark:text-[#FFB4AB] text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Clear All Local Data
            </button>
          </div>
        </section>

        {/* Version Footnote */}
        <div className="pt-2 text-center space-y-1">
          <span className="text-xs text-[#77786F] dark:text-[#A6ABA0]">Recovery Tracker • v2.0 Warm Editorial</span>
          <p className="font-serif italic text-sm text-[#77786F] dark:text-[#A6ABA0]">
            “Your progress belongs to you, always.”
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-[#252B25] text-white rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 z-50 border border-white/10 animate-fade-in">
          <span className="material-symbols-outlined text-[17px] text-[#8EAA92]">{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-5 shadow-xl border border-[#E3DED5] dark:border-[#313831] space-y-4">
            <div className="w-11 h-11 rounded-full bg-[#FDECEB] text-[#BA1A1A] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">delete_forever</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">Confirm Total Reset</h3>
              <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
                Are you sure you wish to wipe your journal entries, streaks, and check-ins? Your records will be
                permanently removed from this device's memory.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={confirmResetData}
                className="w-full py-2.5 bg-[#BA1A1A] text-white rounded-xl text-xs font-semibold hover:bg-[#A31616] transition-colors"
              >
                Yes, Erase Everything
              </button>
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="w-full py-2.5 bg-[#F2EFE8] dark:bg-[#2C332C] text-[#252B25] dark:text-[#E8EBDD] rounded-xl text-xs font-medium hover:bg-[#E3DED5] transition-colors"
              >
                Cancel and Keep Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centering Breath Modal */}
      {showBreathingModal && (
        <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-6 shadow-xl border border-[#E3DED5] dark:border-[#313831] flex flex-col items-center gap-3.5 text-center">
            <span className="text-[11px] uppercase tracking-widest text-[#46644B] dark:text-[#8EAA92] font-semibold">
              Grounding Exercise
            </span>
            <h3 className="font-serif text-2xl font-medium text-[#252B25] dark:text-[#E8EBDD]">Centering Breath</h3>
            <div className="relative w-36 h-36 flex items-center justify-center my-3">
              <div
                style={{ transform: `scale(${breathScale})`, transition: "transform 3.5s ease-in-out" }}
                className="w-24 h-24 rounded-full bg-[#E8EBDD] dark:bg-[#2C332C] border border-[#46644B]/20 flex items-center justify-center"
              >
                <span className="text-sm font-bold text-[#46644B] dark:text-[#8EAA92] tracking-wide">
                  {breathPhase}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
              Take a quiet moment to regulate. Inhale for four counts, hold gently, then release.
            </p>
            <button
              type="button"
              onClick={() => setShowBreathingModal(false)}
              className="w-full mt-1 py-2.5 bg-[#F2EFE8] dark:bg-[#2C332C] border border-[#E3DED5] dark:border-[#313831] text-[#252B25] dark:text-[#E8EBDD] rounded-xl text-xs font-medium transition-colors"
            >
              Return to Settings
            </button>
          </div>
        </div>
      )}

      {/* Support Lines Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-5 border border-[#E3DED5] dark:border-[#313831] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E3DED5] dark:border-[#313831]">
              <h3 className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">Support Resources</h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#77786F] hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] flex flex-col">
                <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">SAMHSA National Helpline</span>
                <span className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0]">Free, confidential, 24/7 treatment referral.</span>
                <a href="tel:18006624357" className="text-xs text-[#46644B] dark:text-[#8EAA92] font-mono mt-1 font-semibold hover:underline">
                  1-800-662-4357
                </a>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] flex flex-col">
                <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">Crisis Text Line</span>
                <span className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0]">Free crisis intervention via SMS.</span>
                <span className="text-xs text-[#46644B] dark:text-[#8EAA92] font-mono mt-1 font-semibold">Text HOME to 741741</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F6F1] dark:bg-[#181B18] border border-[#E3DED5] dark:border-[#313831] flex flex-col">
                <span className="font-semibold text-xs text-[#252B25] dark:text-[#E8EBDD]">988 Suicide & Crisis Lifeline</span>
                <span className="text-[11.5px] text-[#77786F] dark:text-[#A6ABA0]">Trained crisis counselors available anytime.</span>
                <a href="tel:988" className="text-xs text-[#46644B] dark:text-[#8EAA92] font-mono mt-1 font-semibold hover:underline">
                  Dial 988
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;
