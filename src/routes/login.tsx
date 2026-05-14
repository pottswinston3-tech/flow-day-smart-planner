import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { signupStudent, loginStudent } from "@/lib/auth.functions";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { student, loading, setSession } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && student) navigate({ to: "/" });
  }, [loading, student, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const fn = mode === "signup" ? signupStudent : loginStudent;
      const payload = mode === "signup" ? { studentId, name, pin } : { studentId, pin };
      const res = await fn({ data: payload });
      setSession(res.token, {
        studentUuid: res.student.id,
        studentId: res.student.student_id,
        name: res.student.name,
      });
      toast.success(mode === "signup" ? "Welcome to DayFlow!" : "Welcome back!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="font-display text-4xl font-bold">DayFlow</h1>
          <p className="mt-2 text-muted-foreground">Your AI-powered student planner.</p>
        </div>

        <div className="glass shadow-elegant rounded-3xl p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Student ID">
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoCapitalize="none"
                placeholder="e.g. jdoe26"
                className="input"
              />
            </Field>

            {mode === "signup" && (
              <Field label="Your name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="input"
                />
              </Field>
            )}

            <Field label="PIN" hint="4–32 characters. No email needed.">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                type="password"
                minLength={4}
                placeholder="••••"
                className="input"
              />
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          No email required. Just your Student ID.
        </p>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--foreground);
          border-radius: 0.75rem;
          padding: 0.75rem 0.875rem;
          font-size: 0.95rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 25%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
