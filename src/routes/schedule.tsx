import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  listClasses,
  listTasks,
  listOverrides,
  listNotesRange,
  getNote,
  upsertNote,
  gcalStatus,
  syncTasksToGcal,
  syncNoteToGcal,
} from "@/lib/data.functions";
import {
  rotatingDay,
  timeToMinutes,
  formatTime,
  ymdLocal,
  type Override,
} from "@/lib/schedule";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  CloudUpload,
  StickyNote,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/schedule")({
  component: () => (
    <AppShell>
      <SchedulePage />
    </AppShell>
  ),
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

function buildGrid(month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const cells: { date: Date; inMonth: boolean }[] = [];
  const leading = start.getDay();
  for (let i = leading - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(start.getDate() - i - 1);
    cells.push({ date: d, inMonth: false });
  }
  for (let i = 1; i <= end.getDate(); i++) {
    cells.push({ date: new Date(month.getFullYear(), month.getMonth(), i), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(last.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

function SchedulePage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string>(ymdLocal(new Date()));
  const [noteDraft, setNoteDraft] = useState("");
  const [noteDirty, setNoteDirty] = useState(false);
  const [syncing, setSyncing] = useState<"tasks" | "note" | null>(null);

  const classesQ = useQuery({ queryKey: ["classes"], queryFn: () => listClasses() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const overridesQ = useQuery({ queryKey: ["overrides"], queryFn: () => listOverrides() });
  const gcalQ = useQuery({ queryKey: ["gcal"], queryFn: () => gcalStatus() });

  const monthStart = ymdLocal(startOfMonth(month));
  const monthEnd = ymdLocal(endOfMonth(month));
  const notesQ = useQuery({
    queryKey: ["notes", monthStart, monthEnd],
    queryFn: () => listNotesRange({ data: { start: monthStart, end: monthEnd } }),
  });

  const selectedNoteQ = useQuery({
    queryKey: ["note", selected],
    queryFn: () => getNote({ data: { date: selected } }),
  });

  useEffect(() => {
    setNoteDraft(selectedNoteQ.data?.content ?? "");
    setNoteDirty(false);
  }, [selectedNoteQ.data, selected]);

  const overrides = (overridesQ.data ?? []) as Override[];
  const grid = useMemo(() => buildGrid(month), [month]);

  const tasksByDate = useMemo(() => {
    const m = new Map<string, typeof tasksQ.data>();
    for (const t of tasksQ.data ?? []) {
      if (!t.due_date) continue;
      const k = ymdLocal(new Date(t.due_date));
      const arr = m.get(k) ?? [];
      arr.push(t);
      m.set(k, arr as never);
    }
    return m;
  }, [tasksQ.data]);

  const notesSet = useMemo(() => {
    const s = new Set<string>();
    for (const n of notesQ.data ?? []) if (n.content?.trim()) s.add(n.date);
    return s;
  }, [notesQ.data]);

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);

  const selectedDay = rotatingDay(selectedDate, overrides);
  const selectedClasses = useMemo(() => {
    if (!selectedDay || !classesQ.data) return [];
    return classesQ.data
      .filter((c) => c.days.includes(selectedDay))
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }, [selectedDay, classesQ.data]);

  const selectedTasks = (tasksByDate.get(selected) ?? []) as NonNullable<typeof tasksQ.data>;

  // 7-day agenda from selected date
  const agenda = useMemo(() => {
    const items: { date: string; classes: typeof selectedClasses; tasks: typeof selectedTasks }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + i);
      const key = ymdLocal(d);
      const day = rotatingDay(d, overrides);
      const cls = day
        ? (classesQ.data ?? [])
            .filter((c) => c.days.includes(day))
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
        : [];
      const tks = (tasksByDate.get(key) ?? []) as NonNullable<typeof tasksQ.data>;
      if (cls.length || tks.length) items.push({ date: key, classes: cls as never, tasks: tks });
    }
    return items;
  }, [selectedDate, classesQ.data, overrides, tasksByDate]);

  async function saveNote() {
    try {
      await upsertNote({ data: { date: selected, content: noteDraft } });
      setNoteDirty(false);
      qc.invalidateQueries({ queryKey: ["notes", monthStart, monthEnd] });
      qc.invalidateQueries({ queryKey: ["note", selected] });
      toast.success("Note saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function pushTasks() {
    if (!gcalQ.data?.connected) {
      toast.error("Connect Google Calendar first (in Settings)");
      return;
    }
    setSyncing("tasks");
    try {
      const res = await syncTasksToGcal();
      toast.success(`Synced ${res.count} task${res.count === 1 ? "" : "s"} to Google Calendar`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  async function pushNote() {
    if (!gcalQ.data?.connected) {
      toast.error("Connect Google Calendar first (in Settings)");
      return;
    }
    if (noteDirty) await saveNote();
    setSyncing("note");
    try {
      await syncNoteToGcal({ data: { date: selected } });
      toast.success("Note synced to Google Calendar");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  const todayKey = ymdLocal(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Month view · agenda · daily notes {gcalQ.data?.connected ? "· Google Calendar connected" : "· Google Calendar not connected"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={pushTasks}
            disabled={syncing === "tasks"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {syncing === "tasks" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            Sync tasks to Google
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <section className="bg-card-gradient ring-1 ring-border shadow-elegant rounded-2xl p-4 lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <button onClick={() => setMonth(addMonths(month, -1))} className="rounded-lg p-2 hover:bg-surface-2"><ChevronLeft className="h-4 w-4" /></button>
            <h2 className="font-display text-lg font-semibold">
              {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg p-2 hover:bg-surface-2"><ChevronRight className="h-4 w-4" /></button>
          </header>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS.map((d) => <div key={d} className="py-1.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map(({ date, inMonth }) => {
              const key = ymdLocal(date);
              const day = rotatingDay(date, overrides);
              const tCount = (tasksByDate.get(key)?.length ?? 0);
              const hasNote = notesSet.has(key);
              const isSelected = key === selected;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={[
                    "relative flex aspect-square flex-col items-stretch justify-between rounded-lg border p-1.5 text-left text-xs transition",
                    inMonth ? "bg-card" : "bg-surface-2/40 text-muted-foreground",
                    isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className={isToday ? "font-bold text-primary" : "font-medium"}>{date.getDate()}</span>
                    {day && (
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                        D{day}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {tCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-900">
                        {tCount}
                      </span>
                    )}
                    {hasNote && <StickyNote className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Today</span>
            <span className="inline-flex items-center gap-1"><span className="rounded bg-primary/10 px-1 text-primary font-semibold">D#</span> Rotation day</span>
            <span className="inline-flex items-center gap-1"><span className="rounded bg-amber-100 px-1 text-amber-900">#</span> Tasks due</span>
            <span className="inline-flex items-center gap-1"><StickyNote className="h-3 w-3" /> Has note</span>
          </div>
        </section>

        {/* Selected day detail */}
        <section className="bg-card-gradient ring-1 ring-border shadow-elegant rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold">
            {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {selectedDay ? `Day ${selectedDay}` : "No school"} ·{" "}
            {selectedClasses.length} class{selectedClasses.length === 1 ? "" : "es"} · {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"}
          </div>

          <div className="mt-4 space-y-3">
            {selectedClasses.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Classes</div>
                <ul className="space-y-1.5">
                  {selectedClasses.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2 text-sm">
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(c.start_time, false)} – {formatTime(c.end_time, false)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTasks.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasks due</div>
                <ul className="space-y-1.5">
                  {selectedTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm ring-1 ring-amber-200">
                      <CalendarCheck className="h-4 w-4 text-amber-700" />
                      <span className={`flex-1 truncate ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                      <span className="text-[10px] uppercase text-amber-800">{t.priority}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/tasks" className="mt-2 inline-block text-xs text-primary hover:underline">Open tasks →</Link>
              </div>
            )}

            {selectedClasses.length === 0 && selectedTasks.length === 0 && (
              <div className="rounded-lg bg-surface-2/50 p-4 text-sm text-muted-foreground">Nothing scheduled.</div>
            )}
          </div>
        </section>
      </div>

      {/* Notepad + Agenda */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="bg-card-gradient ring-1 ring-border shadow-elegant rounded-2xl p-5 lg:col-span-2">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold inline-flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" /> Notes — {selected}
              </h2>
              <p className="text-xs text-muted-foreground">Auto-saved per day. Push to Google Calendar to share with your calendar.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveNote}
                disabled={!noteDirty}
                className="rounded-xl bg-surface-2 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {noteDirty ? "Save" : "Saved"}
              </button>
              <button
                onClick={pushNote}
                disabled={syncing === "note"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {syncing === "note" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
                Sync
              </button>
            </div>
          </header>
          <textarea
            value={noteDraft}
            onChange={(e) => { setNoteDraft(e.target.value); setNoteDirty(true); }}
            rows={10}
            placeholder="Jot down homework reminders, ideas, questions for class…"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </section>

        <section className="bg-card-gradient ring-1 ring-border shadow-elegant rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold">Next 7 days</h2>
          {agenda.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing in the next week.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {agenda.map((a) => {
                const d = new Date(a.date);
                return (
                  <li key={a.date}>
                    <button
                      onClick={() => setSelected(a.date)}
                      className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-primary/40"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold">{d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.classes.length}c · {a.tasks.length}t
                        </span>
                      </div>
                      {a.tasks.slice(0, 2).map((t) => (
                        <div key={t.id} className="truncate text-xs text-muted-foreground">• {t.title}</div>
                      ))}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
