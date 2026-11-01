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
  title = "",
  hideNav = false,
  hideHeader = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const activeNavigationLabel = getActiveNavigationLabel(currentPath);

  return (
    <div className="min-h-screen bg-paper dark:bg-[#211B18] text-[#261810] dark:text-[#F8EFE4] font-sans transition-colors duration-200">
      {/* Top App Bar */}
      {!hideHeader && (
        <header className="fixed top-0 inset-x-0 z-40 pt-safe bg-[#FFF8F2]/95 dark:bg-[#211B18]/95 backdrop-blur-md border-b border-[#D2C3BE] dark:border-[#51433D] transition-colors duration-200">
          <div className="h-16 px-3 sm:px-4 md:px-8 flex items-center justify-between gap-3 max-w-6xl mx-auto">
            <button
              type="button"
              className="flex min-w-0 shrink-0 items-center gap-2.5 text-left"
              onClick={() => navigate("/home")}
              aria-label="Recovery Tracker home"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#46644B] text-white shadow-xs">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  spa
                </span>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="whitespace-nowrap font-serif text-sm sm:text-lg font-semibold leading-none text-[#261810] dark:text-[#F8EFE4]">
                  Recovery Tracker
                </span>
                {title && (
                  <span className="hidden min-[400px]:block text-[11px] uppercase tracking-wider mt-1 text-[#5E4D45] dark:text-[#D5C3B9] font-semibold">
                    {title}
                  </span>
                )}
              </div>
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
                    className={`min-h-11 px-3 rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#FDD0C6] text-[#3D2C24]"
                        : "text-[#5E4D45] hover:bg-[#F6EDE2] dark:text-[#D5C3B9] dark:hover:bg-[#453630]"
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
      <main className={`relative w-full ${!hideHeader ? "pt-20" : "pt-4"} ${!hideNav ? "pb-24 md:pb-10" : "pb-8"} min-h-screen`}>
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8">
          {children}
        </div>
      </main>

      {/* Persistent Bottom Navigation */}
      {!hideNav && (
        <nav aria-label="Primary navigation" className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#FFF8F2]/95 dark:bg-[#211B18]/95 backdrop-blur-md border-t border-[#D2C3BE] dark:border-[#51433D] transition-colors duration-200">
          <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
            {primaryNavigationItems.map((item) => {
              const isActive = activeNavigationLabel === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => navigate(item.path)}
                  className={`flex min-w-[56px] min-h-[44px] flex-col items-center justify-center rounded-xl px-2 transition-colors duration-150 ${
                    isActive
                      ? "bg-[#FDD0C6]/60 text-[#3D2C24] dark:bg-[#453630] dark:text-[#FDD0C6] font-semibold"
                      : "text-[#5E4D45] dark:text-[#D5C3B9] hover:text-[#261810] dark:hover:text-[#F8EFE4]"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
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
