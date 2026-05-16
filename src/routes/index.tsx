import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listClasses, listTasks, listOverrides, getSettings } from "@/lib/data.functions";
import { rotatingDay, nextSchoolDay, timeToMinutes, minutesNow, formatClock, formatTime, colorClasses, type Override } from "@/lib/schedule";
import { Clock, MapPin, User, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({ component: () => <AppShell><Dashboard /></AppShell> });

function Dashboard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const classesQ = useQuery({ queryKey: ["classes"], queryFn: () => listClasses() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const overridesQ = useQuery({ queryKey: ["overrides"], queryFn: () => listOverrides() });
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });

  const clock24 = settingsQ.data?.clock_24h ?? false;
  const overrides = (overridesQ.data ?? []) as Override[];

  const day = rotatingDay(now, overrides);
  const todays = useMemo(() => {
    if (!day || !classesQ.data) return [];
    return classesQ.data
      .filter((c) => c.days.includes(day))
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }, [day, classesQ.data]);

  const mins = minutesNow(now);
  const current = todays.find((c) => mins >= timeToMinutes(c.start_time) && mins < timeToMinutes(c.end_time));
  const next = todays.find((c) => timeToMinutes(c.start_time) > mins);

  const upcomingTasks = (tasksQ.data ?? []).filter((t) => !t.completed).slice(0, 5);
  const overdueCount = (tasksQ.data ?? []).filter((t) => !t.completed && t.due_date && new Date(t.due_date) < now).length;
  const doneToday = (tasksQ.data ?? []).filter((t) => t.completed && t.completed_at && new Date(t.completed_at).toDateString() === now.toDateString()).length;

  const nextDay = day ? null : nextSchoolDay(now, overrides);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            {day ? `Today is Day ${day}` : nextDay ? `No school today — next is Day ${nextDay.day}` : "No school"}
          </h1>
        </div>
        <div className="rounded-2xl bg-surface px-4 py-2 font-mono text-2xl tabular-nums shadow-elegant">
          {formatClock(now, clock24, true)}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Current class */}
        <div className="lg:col-span-2">
          <Card title="Current class">
            {current ? (
              <CurrentClassCard cls={current} now={mins} clock24={clock24} />
            ) : (
              <Empty msg={day ? (next ? "Between classes." : "All done for today!") : "Enjoy your day off."} />
            )}
          </Card>
        </div>
        {/* Next class */}
        <Card title="Next up">
          {next ? (
            <div>
              <Pill color={next.color}>{next.period ?? "Next"}</Pill>
              <div className="mt-2 font-display text-xl font-semibold">{next.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                in {Math.max(0, Math.round(timeToMinutes(next.start_time) - mins))} min · {formatTime(next.start_time, clock24)}
              </div>
            </div>
          ) : (
            <Empty msg={day ? "No more classes today." : "—"} />
          )}
        </Card>
      </div>

      {/* Today's schedule */}
      <Card title="Today's schedule" action={<Link to="/classes" className="text-sm text-primary hover:underline">Edit →</Link>}>
        {todays.length === 0 ? (
          <Empty msg="No classes for this day yet. Add some in Schedule." />
        ) : (
          <ol className="space-y-2">
            {todays.map((c) => {
              const isNow = current?.id === c.id;
              const cc = colorClasses(c.color);
              return (
                <li key={c.id} className={`flex items-center gap-4 rounded-xl ${cc.bg} ring-1 ${cc.ring} p-3`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${cc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.name}</span>
                      {isNow && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">NOW</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[c.teacher, c.room && `Room ${c.room}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground tabular-nums">
                    {formatTime(c.start_time, clock24)} – {formatTime(c.end_time, clock24)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {/* Tasks + stats */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Upcoming tasks" action={<Link to="/tasks" className="text-sm text-primary hover:underline">Open →</Link>}>
            {upcomingTasks.length === 0 ? (
              <Empty msg="You're all caught up." />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString()}` : "No due date"} · {t.priority}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Stat label="Overdue" value={overdueCount} tone={overdueCount ? "warn" : "ok"} />
          <Stat label="Done today" value={doneToday} tone="ok" icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card-gradient shadow-elegant rounded-2xl p-5 ring-1 ring-border">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-xl bg-surface-2/50 p-4 text-sm text-muted-foreground">{msg}</div>;
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  const cc = colorClasses(color);
  return <span className={`inline-flex items-center gap-1.5 rounded-full ${cc.bg} ${cc.text} px-2.5 py-1 text-xs font-medium ring-1 ${cc.ring}`}>{children}</span>;
}

function Stat({ label, value, tone, icon }: { label: string; value: number; tone: "ok" | "warn"; icon?: React.ReactNode }) {
  return (
    <div className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 flex items-center gap-2 font-display text-3xl font-bold ${tone === "warn" ? "text-warning" : ""}`}>
        {icon} {value}
      </div>
    </div>
  );
}

function CurrentClassCard({ cls, now, clock24 }: { cls: { id: string; name: string; teacher: string | null; room: string | null; subject: string | null; period: string | null; color: string; start_time: string; end_time: string }; now: number; clock24: boolean }) {
  const start = timeToMinutes(cls.start_time);
  const end = timeToMinutes(cls.end_time);
  const total = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(total, now - start));
  const pct = (elapsed / total) * 100;
  const remaining = Math.max(0, end - now);
  const cc = colorClasses(cls.color);

  return (
    <div className={`rounded-2xl ${cc.bg} ring-1 ${cc.ring} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Pill color={cls.color}>{cls.period ?? "Now"}</Pill>
          <div className="mt-2 font-display text-2xl font-bold md:text-3xl">{cls.name}</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {cls.teacher && <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{cls.teacher}</span>}
            {cls.room && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Room {cls.room}</span>}
            {cls.subject && <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{cls.subject}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Time left</div>
          <div className="font-mono text-3xl font-bold tabular-nums">{Math.floor(remaining)}m</div>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatTime(cls.start_time, clock24)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(cls.end_time, clock24)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-primary transition-[width] duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
