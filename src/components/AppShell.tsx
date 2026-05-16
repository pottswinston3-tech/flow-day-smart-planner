import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, CalendarDays, ListChecks, Link as LinkIcon, Settings, LogOut } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/links", label: "Links", icon: LinkIcon },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { student, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !student) navigate({ to: "/login" });
  }, [loading, student, navigate]);

  if (loading || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8 lg:flex-row">
        <aside className="lg:sticky lg:top-8 lg:h-fit lg:w-64">
          <div className="glass shadow-elegant rounded-2xl p-5">
            <Link to="/" className="mb-6 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold">S</div>
              <div>
                <div className="font-display text-lg font-semibold leading-tight">Smart Scheduler</div>
                <div className="text-xs text-muted-foreground">Hi, {student.name.split(" ")[0]}</div>
              </div>
            </Link>
            <nav className="flex flex-row gap-1 lg:flex-col">
              {NAV.map(({ to, label, icon: Icon }) => {
                const active = loc.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={[
                      "flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors lg:flex-none",
                      active
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={() => signOut()}
              className="mt-4 hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:flex"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
