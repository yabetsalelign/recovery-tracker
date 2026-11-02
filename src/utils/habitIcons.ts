/**
 * Returns a Material Symbols icon name for a given habit tracker name.
 * Icons are chosen to be simple, outline, and semantically meaningful —
 * not emoji or overly literal.
 */
export function getHabitIcon(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("alcohol") || lower.includes("drink") || lower.includes("sobriety")) return "water_drop";
  if (lower.includes("sesh") || lower.includes("smoke") || lower.includes("nicotine") || lower.includes("cigarette")) return "air";
  if (lower.includes("weed") || lower.includes("cannabis") || lower.includes("herb")) return "eco";
  if (lower.includes("porn") || lower.includes("screen") || lower.includes("curfew") || lower.includes("phone")) return "do_not_disturb_on";
  if (lower.includes("gambl")) return "casino";
  if (lower.includes("food") || lower.includes("eat") || lower.includes("binge")) return "restaurant";
  if (lower.includes("coffee") || lower.includes("caffeine")) return "local_cafe";
  if (lower.includes("exercise") || lower.includes("gym") || lower.includes("run")) return "directions_run";
  if (lower.includes("meditat") || lower.includes("mindful") || lower.includes("breath")) return "self_improvement";
  if (lower.includes("sleep") || lower.includes("rest")) return "bedtime";
  if (lower.includes("sugar") || lower.includes("sweet")) return "nutrition";
  // default — botanical / growth
  return "spa";
}
