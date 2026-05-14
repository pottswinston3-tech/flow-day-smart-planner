import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listTasks, upsertTask, toggleTask, deleteTask } from "@/lib/data.functions";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/tasks")({ component: () => <AppShell><TasksPage /></AppShell> });

function TasksPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await upsertTask({ data: { title, priority, completed: false, due_date: due ? new Date(due).toISOString() : null } });
      setTitle(""); setDue("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }
  async function toggle(id: string, completed: boolean) {
    await toggleTask({ data: { id, completed } });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }
  async function remove(id: string) {
    await deleteTask({ data: { id } });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Tasks</h1>

      <form onSubmit={add} className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm" />
        <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm" />
        <select value={priority} onChange={(e) => setPriority(e.target.value as "low"|"medium"|"high")} className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm">
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
      </form>

      <section className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant">
        {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (q.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {q.data!.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <input type="checkbox" checked={t.completed} onChange={(e) => toggle(t.id, e.target.checked)} className="h-5 w-5 accent-primary" />
                <div className="flex-1 min-w-0">
                  <div className={`truncate font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.due_date ? `Due ${new Date(t.due_date).toLocaleString()}` : "No due date"} · {t.priority}
                  </div>
                </div>
                <button onClick={() => remove(t.id)} className="rounded-lg bg-surface-2 p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
