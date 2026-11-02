import React, { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import type { CanonicalTrackerRecord, DayRecord, DayRecordStatus } from "../types/tracker";
import { getEffectiveTarget } from "../utils/unifiedCalculations";

interface Props { tracker: CanonicalTrackerRecord; date: string; initial?: DayRecord; onClose: () => void; onSave: (record: DayRecord | null) => void }
const TrackerDayModal: React.FC<Props> = ({ tracker, date, initial, onClose, onSave }) => {
  const [status, setStatus] = useState<DayRecordStatus | "note_only" | "">(initial?.status || (initial?.note ? "note_only" : ""));
  const [value, setValue] = useState(initial?.value === undefined ? "" : String(initial.value));
  const [time, setTime] = useState(initial?.timestamp || "");
  const [note, setNote] = useState(initial?.note || "");
  const [error, setError] = useState("");
  const target = getEffectiveTarget(tracker, date);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        const items = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], select:not(:disabled)');
        if (!items?.length) return;
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handle);
    return () => { window.removeEventListener("keydown", handle); previous?.focus(); };
  }, [onClose]);

  const submit = () => {
    setError("");
    if (!status) { setError("Choose a day status or select note only."); return; }
    if (status === "note_only" && !note.trim()) { setError("Add a note before saving a note-only entry."); return; }
    const record: DayRecord = { ...initial, note: note.trim() || undefined };
    if (status === "note_only") { delete record.status; delete record.value; delete record.timestamp; }
    else {
      record.status = status;
      const isFrequencyEntry = tracker.modality === "frequency";
      const hasHabitQuantity = tracker.modality === "daily_habit" && status === "completed" && target.rule === "at_least" && value.trim() !== "";
      if (isFrequencyEntry || hasHabitQuantity) {
        const parsed = Number(value);
        if (value.trim() === "" || !Number.isFinite(parsed) || parsed < 0) { setError("Enter a valid quantity of zero or more."); return; }
        if (tracker.modality === "daily_habit" && target.rule === "at_least" && status === "completed" && parsed < target.minimum) { setError(`Enter at least ${target.minimum} ${target.unit || "units"} to meet this target.`); return; }
        record.value = parsed;
      } else if (tracker.modality === "daily_habit" && status === "completed" && target.rule === "at_least") {
        delete record.value;
      } else if (tracker.modality === "daily_habit" && status === "skipped") delete record.value;
      if (tracker.modality === "boundary" && target.rule === "before_time") {
        if (time) {
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { setError("Enter a valid time."); return; }
          record.timestamp = time;
          record.status = time <= target.cutoff ? "adhered" : "breached";
        }
      } else if (tracker.modality !== "boundary") delete record.timestamp;
    }
    onSave(record);
  };

  const existingEntry = Boolean(initial && Object.keys(initial).length > 0);
  const choose = (value: DayRecordStatus | "note_only") => setStatus(value);
  const button = (id: DayRecordStatus | "note_only", label: string) => <button type="button" aria-pressed={status === id} onClick={() => choose(id)} className={`min-h-11 px-3 rounded-full border text-sm ${status === id ? "bg-[#FDD0C6] border-[#D47A55] text-[#261810]" : "border-[#D2C3BE] dark:border-[#39302B]"}`}>{label}</button>;

  return <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="tracker-day-title" className="vesper-card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-xl">
      <header className="flex items-start justify-between gap-3"><div><h2 id="tracker-day-title" className="font-serif text-2xl">{format(parseISO(date), "EEEE, MMMM d")}</h2><p className="text-sm text-[#78564F] dark:text-[#A99A8F]">{tracker.name}</p></div><button ref={closeRef} type="button" onClick={onClose} className="tracker-calendar-nav" aria-label="Close day editor">×</button></header>
      <fieldset className="space-y-3"><legend className="text-sm font-semibold mb-2">{tracker.modality === "abstinence" ? "How was this day?" : tracker.modality === "frequency" ? "Record a quantity" : tracker.modality === "daily_habit" ? "How did it go?" : "Boundary"}</legend>
        {tracker.modality === "abstinence" && <div className="flex flex-wrap gap-2">{button("confirmed_clean", "Clean day")}{button("lapsed", "Record lapse")}</div>}
        {tracker.modality === "frequency" && (
          <div className="space-y-2">
            <label htmlFor="tracker-count" className="block text-sm">
              Quantity{target.rule === "at_most" && target.unit ? ` (${target.unit})` : ""}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="tracker-calendar-nav"
                aria-label="Decrease quantity"
                onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - 1)))}
              >
                −
              </button>
              <input
                id="tracker-count"
                type="number"
                min="0"
                step="any"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="tracker-field text-center"
                placeholder="0"
              />
              <button
                type="button"
                className="tracker-calendar-nav"
                aria-label="Increase quantity"
                onClick={() => setValue(String((Number(value) || 0) + 1))}
              >
                +
              </button>
            </div>
            <p className="text-xs text-[#78564F] dark:text-[#A99A8F]">
              {target.rule === "zero"
                ? "A recorded zero is a successful day."
                : target.rule === "at_most"
                ? `Target: at most ${target.limit}${target.unit ? ` ${target.unit}` : ""}.`
                : "Record the daily quantity."}
            </p>
            <button
              type="button"
              aria-pressed={status === "recorded"}
              onClick={() => choose("recorded")}
              className={`min-h-11 px-3 rounded-full border text-sm ${
                status === "recorded"
                  ? "bg-[#FDD0C6] border-[#D47A55] text-[#261810]"
                  : "border-[#D2C3BE] dark:border-[#39302B]"
              }`}
            >
              Record this quantity
            </button>
          </div>
        )}
        {tracker.modality === "daily_habit" && <div className="space-y-3"><div className="flex flex-wrap gap-2">{button("completed", "Completed")}{button("skipped", "Planned rest day")}</div>{target.rule === "at_least" && (target.minimum !== 1 || target.unit) && <div><label htmlFor="habit-quantity" className="block text-sm mb-1">Quantity, if tracked (minimum {target.minimum}{target.unit ? ` ${target.unit}` : ""})</label><input id="habit-quantity" type="number" min="0" step="any" value={value} onChange={(event) => setValue(event.target.value)} className="tracker-field" /></div>}</div>}
        {tracker.modality === "boundary" && <div className="space-y-3"><div className="flex flex-wrap gap-2">{button("adhered", "Adhered")}{button("breached", "Breach")}</div>{target.rule === "before_time" && <div><label htmlFor="boundary-time" className="block text-sm mb-1">Time (cutoff {target.cutoff})</label><input id="boundary-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="tracker-field" /></div>}</div>}
      </fieldset>
      <div className="space-y-2"><label htmlFor="tracker-day-note" className="block text-sm font-semibold">Note for this day</label><textarea id="tracker-day-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="tracker-field resize-y" placeholder="Add a reflection or context" /><button type="button" aria-pressed={status === "note_only"} onClick={() => choose("note_only")} className={`min-h-11 px-3 rounded-full border text-sm ${status === "note_only" ? "bg-[#FDD0C6] border-[#D47A55] text-[#261810]" : "border-[#D2C3BE] dark:border-[#39302B]"}`}>Save note only</button></div>
      {error && <p role="alert" className="text-sm text-[#A31616] dark:text-[#FFB4AB]">{error}</p>}
      <div className="flex flex-wrap gap-2 pt-1"><button type="button" onClick={submit} className="btn-primary flex-1">{existingEntry ? "Save changes" : "Save entry"}</button>{existingEntry && <button type="button" onClick={() => { if (window.confirm("Remove this day entry? Its note and measurement will also be removed.")) onSave(null); }} className="min-h-11 px-4 rounded-full border border-[#D2C3BE] dark:border-[#39302B]">Remove entry</button>}<button type="button" onClick={onClose} className="btn-secondary">Cancel</button></div>
    </section>
  </div>;
};
export default TrackerDayModal;
