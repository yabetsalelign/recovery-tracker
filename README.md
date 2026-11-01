# Recovery Tracker

A private, local-first web app for tracking daily habits, logging journal entries, and visualizing streak progress over time. All data is stored in your browser — nothing is sent to a server.

---

## Features

| Feature | Details |
|---|---|
| **Daily check-ins** | Mark each tracked habit as checked in for any day from the calendar view |
| **Per-day journaling** | Write journal notes for each habit on any date, with a collapsible timeline view |
| **Progress charts** | Bar chart (daily check-in rate) and pie chart (monthly success %) per habit |
| **Streak tracking** | Consecutive-day streaks with milestone messages at 7 and 30 days |
| **Multiple habits** | Add and remove any number of named habits; built-in detail pages for "sesh", "weed", and "porn" |
| **Theme switching** | Light / dark mode, persisted across sessions |
| **CSV export** | Download all check-in records as a CSV file from the Progress page |
| **Mobile-ready** | Capacitor configuration included for Android packaging (`android/` directory) |

---

## Technology Stack

| Layer | Choice |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 (Warm Editorial: Ivory `#F7F4EE`, Sage `#46644B`, Terracotta `#B16F4C`) |
| Typography | Google Fonts: Newsreader (editorial serif), Plus Jakarta Sans, Inter |
| Icons | Google Material Symbols Outlined |
| Date utilities | date-fns 3 |
| Routing | React Router 6 |
| Mobile | Capacitor (app ID `com.jabez.trackify`) |
| Deployment | Vercel (SPA rewrite rules included via `vercel.json`) |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

---

## Installation

```bash
git clone <your-repo-url>
cd recovery-tracker
npm install
```

---

## Available Scripts

```bash
npm run dev         # Start Vite dev server at http://localhost:5173
npm run build       # Production build → dist/
npm run preview     # Preview the production build locally
npm run typecheck   # Typecheck TypeScript source files
npm test            # Run workflow regression test suite
```

---

## Data Storage — Privacy Details

> **All data lives in your browser's `localStorage`. Nothing is transmitted to any server.**

| Topic | Details |
|---|---|
| **Storage mechanism** | Browser `localStorage` on the device running the app |
| **Encryption** | None — stored as plaintext JSON |
| **Cross-device sync** | Not supported |
| **Backups** | Not provided — clearing browser storage will erase all records |
| **Export** | CSV download on the Progress page (habit name, date, checked-in status) |
| **Deletion** | DevTools → Application → Local Storage, or the per-habit Delete button in Calendar view |

### localStorage keys written by the app

| Key | Content |
|---|---|
| `userName` | Display name entered on the Welcome screen |
| `theme` | `"light"` or `"dark"` |
| `addictions` | JSON array of tracked habit names |
| `trackers` | JSON array with `name`, `checkIns`, and `notes` per habit |
| `selectedDate` | Last-selected calendar date |
| `seshData` | Daily usage counts for the "sesh" habit |
| `weedData` | Daily usage counts for the "weed" habit |
| `pornData` | Daily usage counts and notes for the "porn" habit |

---

## Deployment

### Vercel (web)

The repo includes `vercel.json` with an SPA rewrite rule so React Router links work correctly after a page refresh.

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the framework preset to **Vite** (or leave it on auto-detect).
4. Deploy — no environment variables are required.

### Android (Capacitor)

```bash
npm run build          # Build the web bundle first
npx cap sync android   # Sync assets into the android/ directory
# Open android/ in Android Studio to run or build an APK
```

The Capacitor app ID is `com.jabez.trackify` and the app name is `trackify`.

---

## Repository Structure

```
recovery-tracker/
├── android/              # Capacitor Android project
├── public/
│   ├── app-icon.png      # Web app icon (512x512)
│   ├── favicon.png       # Web favicon (64x64)
│   ├── sunrise.jpg       # Background image used by Layout
│   └── sunrise.jpg.avif
├── scripts/
│   └── generate_icons.py # Android & web launcher icon generation script
├── src/
│   ├── components/       # Layout.tsx, ThemeModal.tsx
│   ├── context/          # ThemeContext.tsx, UserContext.tsx, RecoveryContext.tsx
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Recovery calculations and helpers
│   ├── App.tsx           # Router and context providers
│   ├── Welcome.tsx       # Name entry / onboarding
│   ├── Home.tsx          # Dashboard / navigation hub
│   ├── Calendar.tsx      # Monthly calendar with check-in indicators
│   ├── Day.tsx           # Per-day check-in view
│   ├── Notes.tsx         # Journal notes per habit
│   ├── Progress.tsx      # Charts and CSV export
│   ├── Streaks.tsx       # Streak display
│   ├── AddAddiction.tsx  # Add a new habit
│   ├── SeshPage.tsx      # Daily count calendar for "sesh"
│   ├── WeedPage.tsx      # Daily count calendar for "weed"
│   └── pornPage.tsx      # Daily count calendar + notes for "porn"
├── tests/
│   └── verify-workflows.test.js # Core recovery & calculation test suite
├── capacitor.config.json
├── vercel.json
├── vite.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Known Limitations

- No authentication — anyone with device access can view all data.
- No cloud backup — browser storage can be cleared accidentally.
- Habit detail pages (Sesh, Weed, Porn) are fixed; other habits only use the shared Calendar / Day check-in flow.
- Streak counting depends on the user having logged data for each day; unlogged days (even if clean) are not counted as successes.
