export interface PrimaryNavigationItem {
  label: string;
  path: string;
  icon: string;
  matchPaths: string[];
}

export const primaryNavigationItems: PrimaryNavigationItem[] = [
  { label: "Home", path: "/home", icon: "home", matchPaths: ["/home", "/", "/add-addiction"] },
  { label: "Calendar", path: "/calendar", icon: "calendar_month", matchPaths: ["/calendar", "/day"] },
  { label: "Journal", path: "/notes", icon: "menu_book", matchPaths: ["/notes"] },
  {
    label: "Progress",
    path: "/progress",
    icon: "bar_chart",
    matchPaths: ["/progress", "/streaks", "/counter", "/sesh", "/weed", "/porn"],
  },
  { label: "Settings", path: "/settings", icon: "tune", matchPaths: ["/settings"] },
];

export const getActiveNavigationLabel = (pathname: string): string | undefined =>
  primaryNavigationItems.find((item) =>
    item.matchPaths.some((path) =>
      path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`)
    )
  )?.label;
