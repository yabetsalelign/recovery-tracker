import type { CanonicalTrackerRecord, TrackerTarget } from "./tracker";

export type Modality =
  | "abstinence"
  | "harm_reduction"
  | "moderation"
  | "time_restriction"
  | string;

export type Category =
  | "Substance Sobriety"
  | "Digital & Behavioral"
  | "Emotional & Mental"
  | "Physical Health"
  | string;

export interface TrackerRecord {
  id: number | string;
  name: string;
  category?: Category;
  modality?: Modality;
  limitVal?: number;
  curfewTime?: string;
  startDate?: string;
  checkIns: Record<string, boolean>;
  notes: Record<string, string>;
}

export interface GoalConfig {
  title?: string;
  name?: string;
  category?: Category;
  modality?: Modality;
  limitVal?: number;
  curfewTime?: string;
  startDate?: string;
  rationale?: string;
  target?: TrackerTarget;
}

export type CheckInsMap = Record<string, boolean>;
export type NotesMap = Record<string, string>;
export type GeneralNotesMap = Record<string, string>;
export type SpecializedTrackerData = Record<string, number>;
export interface EmotionalWeatherEntry {
  mood: string;
  note: string;
  checkedIn: boolean;
}
export type EmotionalWeatherMap = Record<string, EmotionalWeatherEntry>;

export interface NoteEntry {
  id: string;
  habit: string;
  isGeneral: boolean;
  date: string;
  text: string;
  trackerId?: string;
}

export type ThemeMode = "light" | "dark";
export type FontScale = "standard" | "comfort";

export interface ThemePreferences {
  theme: ThemeMode | string;
  fontScale: FontScale | string;
  gentleTransitions: boolean;
  discreetMode: boolean;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface BackupPayload {
  app?: string;
  version?: string;
  exportedAt?: string;
  userName?: string;
  theme?: string;
  fontScale?: string;
  gentleTransitions?: boolean;
  discreetMode?: boolean;
  counterStartDate?: string;
  addictions?: string[];
  trackers?: TrackerRecord[];
  generalNotes?: GeneralNotesMap;
  seshData?: SpecializedTrackerData;
  weedData?: SpecializedTrackerData;
  pornData?: SpecializedTrackerData;
  pornNotes?: string;
  emotionalWeather?: EmotionalWeatherMap;
}

export interface RecoveryContextType {
  canonicalTrackers: CanonicalTrackerRecord[];
  setTrackerDayRecord: (trackerId: string, dateStr: string, record: import("./tracker").DayRecord | null) => void;
  logTrackerDayStatus: (trackerId: string, dateStr: string, status: import("./tracker").DayRecordStatus, value?: number) => void;
  saveTrackerGeneralNote: (trackerId: string, note: string) => void;
  saveTrackerDayNote: (trackerId: string, dateStr: string, note: string) => void;
  deleteTrackerDayNote: (trackerId: string, dateStr: string) => void;
  migrationError?: string | null;
  trackers: TrackerRecord[];
  addictions: string[];
  generalNotes: GeneralNotesMap;
  seshData: SpecializedTrackerData;
  weedData: SpecializedTrackerData;
  pornData: SpecializedTrackerData;
  pornNotes: string;
  emotionalWeather: EmotionalWeatherMap;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  counterStartDate: string;
  setCounterStartDate: (date: string) => void;
  toggleCheckIn: (habitName: string, dateStr: string) => void;
  setCheckIn: (habitName: string, dateStr: string, isChecked: boolean) => void;
  completeDailyCheckin: (dateStr: string, mood?: string, note?: string) => void;
  savePornNotes: (text: string) => void;
  addGoal: (goalConfig: GoalConfig) => ActionResult;
  updateGoal: (trackerId: string, newConfig: Partial<GoalConfig>) => ActionResult;
  deleteGoal: (trackerId: string) => void;
  saveNote: (habitName: string, dateStr: string, text: string) => void;
  deleteNote: (habitName: string, dateStr: string) => void;
  getNote: (habitName: string, dateStr: string) => string;
  getAllNotes: () => NoteEntry[];
  logSpecializedCount: (type: "sesh" | "weed" | "porn", dateStr: string, count: number | string) => void;
  calculateStreak: (checkIns?: CheckInsMap | null, referenceDate?: Date) => number;
  calculateLongestStreak: (checkIns?: CheckInsMap | null) => number;
  calculateSpecializedStreak: (dataObj?: SpecializedTrackerData | null, referenceDate?: Date) => number;
  exportJSON: () => boolean;
  exportCSV: () => boolean;
  validateAndImportJSON: (content: string) => ActionResult<BackupPayload>;
  resetAllData: () => void;
}

export interface UserContextType {
  name: string;
  setName: (name: string) => void;
}

export interface ThemeContextType {
  theme: string;
  toggleTheme: (theme: string) => void;
  fontScale: string;
  setFontScale: (scale: string) => void;
  gentleTransitions: boolean;
  setGentleTransitions: React.Dispatch<React.SetStateAction<boolean>>;
  discreetMode: boolean;
  setDiscreetMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export * from "./tracker";
