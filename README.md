# Recovery Tracker

Recovery Tracker is a private, local-first app for recording recovery goals, daily check-ins, reflections, and progress. Its editorial interface supports warm paper light mode and a warm espresso night mode, with layouts designed for desktop and mobile screens.

## Features

- **Recovery goals:** Create, edit, and manage personal goals and commitments.
- **Daily check-ins:** Record goal check-ins and an optional emotional-weather check-in.
- **Calendar:** Review activity by date, navigate between months, and add or review daily reflections.
- **Private journal:** Write, search, filter, edit, and revisit reflections stored on the device.
- **Progress and milestones:** Review a 21-day activity timeline, tracking summaries, goal rhythms, and milestones.
- **Specialized trackers:** Optional Sesh, Weed, and Porn trackers, plus a day counter.
- **Light and dark themes:** Choose Warm Paper or Charcoal Night in Settings. Explicit choices persist; first-time users follow their system color preference.
- **Reading and privacy preferences:** Adjust reading scale, transitions, and discreet tracker display.
- **Data portability:** Export a JSON archive, restore a validated archive, or download check-in data as CSV.
- **Responsive interface:** Primary navigation and key screens adapt across phone, tablet, and desktop widths.
- **Android packaging:** Capacitor configuration and an Android project are included.

## Technology

| Area | Technologies |
|---|---|
| UI | React 18, TypeScript, React Router |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 and shared CSS design tokens |
| Typography | Newsreader for editorial headings; Nunito Sans for interface and body text |
| Charts and animation | Chart.js, react-chartjs-2, Framer Motion |
| Date handling | date-fns |
| Mobile | Capacitor 7 for Android |

The theme palette is defined with CSS custom properties in `src/index.css`. The night palette uses warm brown-black backgrounds, antique-cream typography, and muted terracotta and amber accents. The saved theme preference is read during page initialization to reduce flashes of the wrong theme.

## Requirements

- Node.js 22.6 or later and npm 9 or later for the complete test suite. The tests use Node's `--experimental-strip-types` option.
- For Android builds: Android Studio/SDK and a compatible JDK. The Android Gradle build has been verified with JDK 21.

## Getting started

```bash
git clone https://github.com/yabetsalelign/recovery-tracker.git
cd recovery-tracker
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Commands

```bash
npm run dev         # Start the Vite development server
npm run typecheck   # Run the TypeScript compiler without emitting files
npm test            # Run workflow and regression tests
npm run build       # Create the production web bundle in dist/
npm run preview     # Preview the production bundle locally
```

## Data, privacy, and backups

Recovery records and preferences are stored in the browser's `localStorage` on the device. The app does not use a recovery-record backend or cloud synchronization. This means records are not automatically shared across devices, and clearing browser storage can remove them. Export a backup from **Settings → Local Storage & Privacy** before changing devices or clearing site data.

The app loads font and icon assets from Google Fonts, which requires a network connection for those external assets. This does not send journal entries or recovery records to Google Fonts.

Use Settings to:

- Export a JSON archive containing recovery data and app preferences.
- Import a previously exported archive; the app validates the archive before restoring it.
- Download check-in data as CSV.
- Clear local records when desired.

Keep downloaded backups somewhere private: exported files may contain sensitive personal information.

## Android

Build the web bundle and sync it to the Capacitor Android project:

```bash
npm run build
npx cap sync android
```

Then open `android/` in Android Studio to run or package the app. On Windows, a debug APK can be built from PowerShell with:

```powershell
Push-Location android
try {
    .\gradlew.bat --no-daemon assembleDebug
}
finally {
    Pop-Location
}
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The Capacitor app ID is `com.jabez.trackify`.

## Routes

| Route | Screen |
|---|---|
| `/` | Welcome and onboarding |
| `/home` | Recovery dashboard and daily check-in |
| `/calendar` | Monthly calendar and selected-day details |
| `/day` | Selected-day check-ins |
| `/notes` | Journal |
| `/progress` | Progress timeline and goal summaries |
| `/streaks` | Milestones |
| `/add-addiction` | Goal management |
| `/counter` | Day counter and milestones |
| `/sesh`, `/weed`, `/porn` | Specialized trackers |
| `/settings` | Theme, reading, privacy, and data management |

## Project layout

```text
recovery-tracker/
├── android/                 # Capacitor Android project
├── public/                  # App icons and static assets
├── src/
│   ├── components/          # Shared layout and theme UI
│   ├── context/             # User, recovery-data, and theme state
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Theme, navigation, and recovery helpers
│   ├── App.tsx              # Providers and route definitions
│   ├── Home.tsx              # Dashboard
│   ├── Calendar.tsx          # Calendar and daily records
│   ├── Notes.tsx             # Journal
│   ├── Progress.tsx          # Progress views
│   └── Settings.tsx          # Preferences, backups, and privacy
├── tests/
│   └── verify-workflows.test.js
├── capacitor.config.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Deployment

The project builds as a static Vite application. `npm run build` creates `dist/`; configure the hosting provider to serve that directory and rewrite application routes to `index.html` for client-side routing. A `vercel.json` SPA rewrite is included.

## Limitations

- There is no account system or automatic cross-device synchronization.
- Browser storage is not encrypted by the app; device and browser access controls remain important.
- Specialized tracker screens are provided for Sesh, Weed, and Porn. Other goals use the shared goal, calendar, and progress flows.
