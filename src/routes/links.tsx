import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listLinks, upsertLink, deleteLink } from "@/lib/data.functions";
import { toast } from "sonner";
import { Plus, Trash2, Pin, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/links")({ component: () => <AppShell><LinksPage /></AppShell> });

function LinksPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["links"], queryFn: () => listLinks() });
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertLink({ data: { label, url, pinned: false, sort_order: (q.data?.length ?? 0) } });
      setLabel(""); setUrl("");
      qc.invalidateQueries({ queryKey: ["links"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bad URL");
    }
  }
  async function togglePin(l: { id: string; label: string; url: string; pinned: boolean; sort_order: number; icon: string | null }) {
    await upsertLink({ data: { id: l.id, label: l.label, url: l.url, pinned: !l.pinned, sort_order: l.sort_order, icon: l.icon } });
    qc.invalidateQueries({ queryKey: ["links"] });
  }
  async function remove(id: string) { await deleteLink({ data: { id } }); qc.invalidateQueries({ queryKey: ["links"] }); }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Student links</h1>

      <form onSubmit={add} className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Label" className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://…" className="rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((l) => (
          <div key={l.id} className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="font-display text-lg font-semibold truncate">{l.label}</div>
              <button onClick={() => togglePin(l)} className={`rounded-lg p-1.5 ${l.pinned ? "bg-primary/20 text-primary" : "bg-surface-2 text-muted-foreground"}`}>
                <Pin className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground truncate">{l.url}</div>
            <div className="mt-4 flex gap-2">
              <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/15 text-primary px-3 py-2 text-sm font-medium ring-1 ring-primary/30">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button onClick={() => remove(l.id)} className="rounded-xl bg-surface-2 p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
