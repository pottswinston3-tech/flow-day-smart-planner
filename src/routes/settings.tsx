import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { getSettings, updateSettings, updateProfile } from "@/lib/data.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: () => <AppShell><SettingsPage /></AppShell> });

function SettingsPage() {
  const qc = useQueryClient();
  const { student, signOut, refresh } = useAuth();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const [name, setName] = useState(student?.name ?? "");
  useEffect(() => { if (student) setName(student.name); }, [student]);

  async function setField<K extends "clock_24h" | "theme" | "notifications">(k: K, v: unknown) {
    await updateSettings({ data: { [k]: v } as never });
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function saveName() {
    try {
      await updateProfile({ data: { name } });
      await refresh();
      toast.success("Name updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>

      <Section title="Profile">
        <Row label="Student ID"><div className="text-muted-foreground">{student?.studentId}</div></Row>
        <Row label="Display name">
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-xl bg-surface-2 border border-border px-3 py-2 text-sm" />
            <button onClick={saveName} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save</button>
          </div>
        </Row>
      </Section>

      <Section title="Preferences">
        <Row label="24-hour clock">
          <Toggle on={!!q.data?.clock_24h} onChange={(v) => setField("clock_24h", v)} />
        </Row>
        <Row label="Notifications">
          <Toggle on={!!q.data?.notifications} onChange={(v) => setField("notifications", v)} />
        </Row>
        <Row label="Theme">
          <div className="flex gap-2">
            {(["dark","light"] as const).map((t) => (
              <button key={t} onClick={() => setField("theme", t)} className={`rounded-xl px-3 py-1.5 text-sm capitalize ${q.data?.theme === t ? "bg-primary text-primary-foreground" : "bg-surface-2"}`}>{t}</button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Integrations">
        <p className="text-sm text-muted-foreground">Google Calendar sync — coming soon.</p>
      </Section>

      <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-sm hover:text-destructive">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card-gradient rounded-2xl p-5 ring-1 ring-border shadow-elegant">
      <h2 className="mb-3 font-display font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
      <div className="text-sm font-medium">{label}</div>
      <div>{children}</div>
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`h-7 w-12 rounded-full p-0.5 transition-colors ${on ? "bg-primary" : "bg-surface-2"}`}>
      <div className={`h-6 w-6 rounded-full bg-foreground transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}
