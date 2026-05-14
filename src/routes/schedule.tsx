import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listClasses, upsertClass, deleteClass, bulkInsertClasses, parseScheduleText } from "@/lib/data.functions";
import { CLASS_COLORS, colorClasses } from "@/lib/schedule";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/schedule")({ component: () => <AppShell><SchedulePage /></AppShell> });

type ClassRow = Awaited<ReturnType<typeof listClasses>>[number];

function emptyForm(): Omit<ClassRow, "id" | "created_at" | "student_uuid"> & { id?: string } {
  return { name: "", subject: "", teacher: "", room: "", period: "", days: [], start_time: "08:00", end_time: "08:45", color: "teal", notes: "" };
}

function SchedulePage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["classes"], queryFn: () => listClasses() });
  const [form, setForm] = useState(emptyForm());
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.days.length === 0) return toast.error("Pick at least one day");
    try {
      await upsertClass({ data: form as never });
      toast.success(form.id ? "Class updated" : "Class added");
      setForm(emptyForm());
      qc.invalidateQueries({ queryKey: ["classes"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this class?")) return;
    await deleteClass({ data: { id } });
    qc.invalidateQueries({ queryKey: ["classes"] });
  }

  async function runAI() {
    if (aiText.trim().length < 10) return toast.error("Paste your schedule first");
    setAiBusy(true);
    try {
      const res = await parseScheduleText({ data: { text: aiText } });
      if (res.classes.length === 0) return toast.error("No classes detected");
      await bulkInsertClasses({ data: { classes: res.classes.map((c) => ({ ...c, color: "teal" })) } });
      toast.success(`Added ${res.classes.length} classes`);
      setAiText("");
      qc.invalidateQueries({ queryKey: ["classes"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI failed");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Schedule</h1>

      <section className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant">
        <h2 className="mb-3 flex items-center gap-2 font-display font-semibold"><Sparkles className="h-4 w-4 text-primary" /> AI schedule import</h2>
        <p className="mb-3 text-sm text-muted-foreground">Paste your schedule (from a PDF, doc, or screenshot text). AI will extract classes, days, and times.</p>
        <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={5} placeholder="Paste your schedule here…" className="w-full rounded-xl bg-surface-2 border border-border p-3 text-sm" />
        <button onClick={runAI} disabled={aiBusy} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {aiBusy ? "Analyzing…" : "Extract classes with AI"}
        </button>
      </section>

      <section className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant">
        <h2 className="mb-3 font-display font-semibold">{form.id ? "Edit class" : "Add a class"}</h2>
        <form onSubmit={save} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required className="col-span-2" />
          <Input label="Teacher" value={form.teacher ?? ""} onChange={(v) => setForm({ ...form, teacher: v })} />
          <Input label="Room" value={form.room ?? ""} onChange={(v) => setForm({ ...form, room: v })} />
          <Input label="Subject" value={form.subject ?? ""} onChange={(v) => setForm({ ...form, subject: v })} />
          <Input label="Period" value={form.period ?? ""} onChange={(v) => setForm({ ...form, period: v })} />
          <Input label="Start" type="time" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} required />
          <Input label="End" type="time" value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} required />
          <div className="col-span-2 md:col-span-2">
            <div className="mb-1.5 text-sm font-medium">Days</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((d) => {
                const on = form.days.includes(d);
                return (
                  <button type="button" key={d} onClick={() => setForm({ ...form, days: on ? form.days.filter((x) => x !== d) : [...form.days, d].sort() })}
                    className={`h-10 w-10 rounded-xl text-sm font-semibold ring-1 ${on ? "bg-primary text-primary-foreground ring-primary" : "bg-surface-2 ring-border text-muted-foreground"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2 md:col-span-2">
            <div className="mb-1.5 text-sm font-medium">Color</div>
            <div className="flex flex-wrap gap-2">
              {CLASS_COLORS.map((c) => {
                const cc = colorClasses(c);
                return (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`h-8 w-8 rounded-lg ${cc.dot} ${form.color === c ? "ring-2 ring-foreground" : ""}`} />
                );
              })}
            </div>
          </div>
          <div className="col-span-2 flex gap-2 md:col-span-4">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> {form.id ? "Save" : "Add class"}</button>
            {form.id && <button type="button" onClick={() => setForm(emptyForm())} className="rounded-xl bg-surface-2 px-4 py-2 text-sm">Cancel</button>}
          </div>
        </form>
      </section>

      <section className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant">
        <h2 className="mb-3 font-display font-semibold">All classes</h2>
        {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (q.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No classes yet — add some above or use AI import.</p>
        ) : (
          <ul className="space-y-2">
            {q.data!.map((c) => {
              const cc = colorClasses(c.color);
              return (
                <li key={c.id} className={`flex items-center gap-3 rounded-xl ${cc.bg} ring-1 ${cc.ring} p-3`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${cc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.days.map((d) => `D${d}`).join(" · ")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[c.teacher, c.room && `Room ${c.room}`, `${c.start_time}–${c.end_time}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button onClick={() => setForm({ ...c, subject: c.subject ?? "", teacher: c.teacher ?? "", room: c.room ?? "", period: c.period ?? "", notes: c.notes ?? "" })} className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs">Edit</button>
                  <button onClick={() => remove(c.id)} className="rounded-lg bg-surface-2 p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, className }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <div className="mb-1 text-sm font-medium">{label}</div>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
