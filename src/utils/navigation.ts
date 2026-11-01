export interface PrimaryNavigationItem {
  label: string;
  path: string;
  icon: string;
  matchPaths: string[];
}

export const primaryNavigationItems: PrimaryNavigationItem[] = [
  { label: "Home", path: "/home", icon: "spa", matchPaths: ["/home", "/", "/add-addiction"] },
  { label: "Calendar", path: "/calendar", icon: "calendar_today", matchPaths: ["/calendar", "/day"] },
  { label: "Journal", path: "/notes", icon: "edit_note", matchPaths: ["/notes"] },
  {
    label: "Progress",
    path: "/progress",
    icon: "monitoring",
    matchPaths: ["/progress", "/streaks", "/counter", "/sesh", "/weed", "/porn"],
  },
  { label: "Settings", path: "/settings", icon: "settings", matchPaths: ["/settings"] },
];

export const getActiveNavigationLabel = (pathname: string): string | undefined =>
  primaryNavigationItems.find((item) =>
    item.matchPaths.some((path) =>
      path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)
    )
  )?.label;
