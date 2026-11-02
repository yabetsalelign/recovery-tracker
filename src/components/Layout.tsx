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
    <div className="min-h-dvh overflow-x-clip bg-[#FFF8F2] dark:bg-[#1A1614] text-[#261810] dark:text-[#F4EFEA] font-sans transition-colors duration-150">
      {/* Top App Bar */}
      {!hideHeader && (
        <header className="fixed top-0 inset-x-0 z-40 bg-[#FFF8F2]/90 dark:bg-[#1A1614]/90 backdrop-blur-md border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
          <div className="pt-safe min-h-16 px-4 md:px-8 flex items-center justify-between gap-3 max-w-5xl mx-auto">
            <button
              type="button"
              className="flex items-center gap-2.5 text-left"
              onClick={() => navigate("/home")}
              aria-label="Recovery Tracker home"
            >
              <div className="brand-badge">
                <img
                  src="/favicon.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 rounded-full object-cover"
                />
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
                    className={`min-h-11 px-4 rounded-full text-xs font-semibold transition-colors ${
                      isActive
                        ? "nav-active"
                        : "text-[#78564F] dark:text-[#D0C4BA] hover:bg-[#FBF2E7] dark:hover:bg-[#24201D] hover:text-[#261810] dark:hover:text-[#F4EFEA]"
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
      <main className={`relative w-full min-w-0 ${!hideHeader ? "pt-[calc(5rem+env(safe-area-inset-top))]" : "pt-4"} ${!hideNav ? "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12" : "pb-8"}`}>
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideNav && (
        <nav
          aria-label="Primary navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#FFF8F2]/95 dark:bg-[#1A1614]/95 backdrop-blur-md border-t border-[#D2C3BE]/50 dark:border-[#39302B]"
        >
          <div className="flex items-center justify-around min-h-16 max-w-md mx-auto px-2">
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
                      ? "nav-active-mobile font-bold"
                      : "text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
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
