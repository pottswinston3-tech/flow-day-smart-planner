// DayFlow rotating schedule helpers.
// Anchor: Thursday, May 14, 2026 = Day 2.
// Skip weekends. Each weekday increments the day (1→2→3→4→1).

const ANCHOR_ISO = "2026-05-14";
const ANCHOR_DAY = 2;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function countWeekdaysBetween(start: Date, end: Date): number {
  // signed count of weekdays from start (exclusive) to end (inclusive).
  const ms = 24 * 60 * 60 * 1000;
  const direction = end >= start ? 1 : -1;
  let count = 0;
  const cur = new Date(start);
  while (ymd(cur) !== ymd(end)) {
    cur.setTime(cur.getTime() + direction * ms);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count += direction;
  }
  return count;
}

export type Override = {
  date: string; // YYYY-MM-DD
  kind: "override" | "holiday" | "half-day" | "delay" | "assembly";
  forced_day: number | null;
  note?: string | null;
};

export function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

export function rotatingDay(date: Date, overrides: Override[] = []): number | null {
  const key = ymd(date);
  const ov = overrides.find((o) => o.date === key);
  if (ov) {
    if (ov.kind === "holiday") return null;
    if (ov.forced_day) return ov.forced_day;
  }
  if (isWeekend(date)) return null;

  const anchor = parseYmd(ANCHOR_ISO);
  const target = parseYmd(key);
  const diff = countWeekdaysBetween(anchor, target);
  // (ANCHOR_DAY - 1 + diff) mod 4 + 1
  const mod = ((ANCHOR_DAY - 1 + diff) % 4 + 4) % 4;
  return mod + 1;
}

export function nextSchoolDay(from: Date, overrides: Override[] = []): { date: Date; day: number } | null {
  const cur = new Date(from);
  for (let i = 0; i < 30; i++) {
    cur.setDate(cur.getDate() + 1);
    const d = rotatingDay(cur, overrides);
    if (d) return { date: new Date(cur), day: d };
  }
  return null;
}

// "HH:MM" → minutes since midnight
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesNow(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function formatTime(t: string, clock24: boolean): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (clock24) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatClock(d: Date, clock24: boolean, withSeconds = true): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  if (clock24) {
    return withSeconds ? `${String(h).padStart(2, "0")}:${m}:${s}` : `${String(h).padStart(2, "0")}:${m}`;
  }
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return withSeconds ? `${h12}:${m}:${s} ${period}` : `${h12}:${m} ${period}`;
}

export const CLASS_COLORS = [
  "teal",
  "sky",
  "indigo",
  "violet",
  "rose",
  "amber",
  "emerald",
  "slate",
] as const;
export type ClassColor = (typeof CLASS_COLORS)[number];

export function colorClasses(color: string): { bg: string; ring: string; text: string; dot: string } {
  const map: Record<string, { bg: string; ring: string; text: string; dot: string }> = {
    teal: { bg: "bg-teal-500/15", ring: "ring-teal-400/40", text: "text-teal-200", dot: "bg-teal-400" },
    sky: { bg: "bg-sky-500/15", ring: "ring-sky-400/40", text: "text-sky-200", dot: "bg-sky-400" },
    indigo: { bg: "bg-indigo-500/15", ring: "ring-indigo-400/40", text: "text-indigo-200", dot: "bg-indigo-400" },
    violet: { bg: "bg-violet-500/15", ring: "ring-violet-400/40", text: "text-violet-200", dot: "bg-violet-400" },
    rose: { bg: "bg-rose-500/15", ring: "ring-rose-400/40", text: "text-rose-200", dot: "bg-rose-400" },
    amber: { bg: "bg-amber-500/15", ring: "ring-amber-400/40", text: "text-amber-200", dot: "bg-amber-400" },
    emerald: { bg: "bg-emerald-500/15", ring: "ring-emerald-400/40", text: "text-emerald-200", dot: "bg-emerald-400" },
    slate: { bg: "bg-slate-500/15", ring: "ring-slate-400/40", text: "text-slate-200", dot: "bg-slate-400" },
  };
  return map[color] ?? map.teal;
}
