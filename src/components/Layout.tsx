import React, { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

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
  const { name } = useUser();

  const getInitials = (str?: string): string => {
    if (!str || !str.trim()) return "RT";
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { label: "Home", path: "/home", icon: "spa", matchPaths: ["/home", "/", "/sesh", "/weed", "/porn"] },
    { label: "Calendar", path: "/calendar", icon: "calendar_today", matchPaths: ["/calendar", "/day"] },
    { label: "Journal", path: "/notes", icon: "edit_note", matchPaths: ["/notes"] },
    { label: "Progress", path: "/progress", icon: "monitoring", matchPaths: ["/progress", "/streaks", "/counter"] },
    { label: "Settings", path: "/settings", icon: "settings", matchPaths: ["/settings"] },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#181B18] text-[#252B25] dark:text-[#E8EBDD] font-sans transition-colors duration-200">
      {/* Top App Bar */}
      {!hideHeader && (
        <header className="fixed top-0 inset-x-0 z-40 pt-safe bg-[#F7F4EE]/95 dark:bg-[#181B18]/95 backdrop-blur-md border-b border-[#E3DED5] dark:border-[#313831] transition-colors duration-200">
          <div className="h-14 px-4 flex items-center justify-between max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#46644B] text-white shadow-xs">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  spa
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-[17px] font-medium leading-none text-[#252B25] dark:text-[#E8EBDD]">
                  Recovery Tracker
                </span>
                {title && (
                  <span className="text-[11px] uppercase tracking-wider mt-0.5 text-[#77786F] dark:text-[#A6ABA0] font-medium">
                    {title}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                aria-label="Add and Manage Goals"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] dark:hover:text-[#E8EBDD] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => navigate("/add-addiction")}
                title="Add and Manage Goals"
              >
                <span className="material-symbols-outlined text-[20px]">add_task</span>
              </button>

              <button
                aria-label="Settings and Privacy"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] dark:hover:text-[#E8EBDD] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => navigate("/settings")}
                title="Settings & Privacy"
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs bg-[#E3DED5] dark:bg-[#2C332C] text-[#252B25] dark:text-[#E8EBDD] cursor-pointer"
                onClick={() => navigate("/settings")}
                title={name || "Your Profile"}
              >
                <span>{getInitials(name)}</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`relative w-full ${!hideHeader ? "pt-16" : "pt-4"} ${!hideNav ? "pb-24" : "pb-8"} min-h-screen`}>
        <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4">
          {children}
        </div>
      </main>

      {/* Persistent Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#F7F4EE]/95 dark:bg-[#181B18]/95 backdrop-blur-md border-t border-[#E3DED5] dark:border-[#313831] transition-colors duration-200">
          <div className="flex items-center justify-around h-16 max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2">
            {navItems.map((item) => {
              const isActive = item.matchPaths.some((p) =>
                p === "/" ? currentPath === "/" : currentPath.startsWith(p)
              );
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors duration-150 ${
                    isActive
                      ? "text-[#46644B] dark:text-[#8EAA92] font-semibold"
                      : "text-[#77786F] dark:text-[#A6ABA0] hover:text-[#252B25] dark:hover:text-[#E8EBDD]"
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
