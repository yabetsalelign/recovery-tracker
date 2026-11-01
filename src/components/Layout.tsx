import React, { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getActiveNavigationLabel, primaryNavigationItems } from "../utils/navigation";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideNav = false,
  hideHeader = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const activeNavigationLabel = getActiveNavigationLabel(currentPath);

  return (
    <div className="min-h-screen bg-[#FFF8F2] dark:bg-[#1A1614] text-[#261810] dark:text-[#F4EFEA] font-sans transition-colors duration-150">
      {/* Top App Bar */}
      {!hideHeader && (
        <header className="fixed top-0 inset-x-0 z-40 bg-[#FFF8F2]/90 dark:bg-[#1A1614]/90 backdrop-blur-md border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3 max-w-5xl mx-auto">
            <button
              type="button"
              className="flex items-center gap-2.5 text-left"
              onClick={() => navigate("/home")}
              aria-label="Recovery Tracker home"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#3D2C24] dark:bg-[#D47A55] text-white dark:text-[#211710]">
                <span className="material-symbols-outlined text-[18px]">
                  spa
                </span>
              </div>
              <span className="font-serif text-lg font-medium leading-none text-[#261810] dark:text-[#F4EFEA]">
                Recovery Tracker
              </span>
            </button>

            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
              {primaryNavigationItems.map((item) => {
                const isActive = activeNavigationLabel === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => navigate(item.path)}
                    className={`min-h-11 px-3.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-[#3D2C24] text-white dark:bg-[#D47A55] dark:text-[#211710]"
                        : "text-[#5E4D45] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#2A2522]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`relative w-full ${!hideHeader ? "pt-20" : "pt-4"} ${!hideNav ? "pb-24 md:pb-12" : "pb-8"}`}>
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideNav && (
        <nav
          aria-label="Primary navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFF8F2]/95 dark:bg-[#1A1614]/95 backdrop-blur-md border-t border-[#D2C3BE]/50 dark:border-[#39302B]"
        >
          <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
            {primaryNavigationItems.map((item) => {
              const isActive = activeNavigationLabel === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => navigate(item.path)}
                  className={`flex min-w-[56px] min-h-[44px] flex-col items-center justify-center rounded-xl px-2 transition-colors ${
                    isActive
                      ? "text-[#3D2C24] dark:text-[#D47A55] font-bold"
                      : "text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
