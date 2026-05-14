import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { me, logout as logoutFn } from "@/lib/auth.functions";
import { useNavigate } from "@tanstack/react-router";

type Student = { studentUuid: string; studentId: string; name: string };

type AuthCtx = {
  student: Student | null;
  loading: boolean;
  setSession: (token: string, student: Student) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("dayflow.session") : null;
    if (!token) {
      setStudent(null);
      setLoading(false);
      return;
    }
    try {
      const s = await me();
      setStudent(s);
    } catch {
      localStorage.removeItem("dayflow.session");
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setSession = useCallback((token: string, s: Student) => {
    localStorage.setItem("dayflow.session", token);
    setStudent(s);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutFn();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("dayflow.session");
    setStudent(null);
    navigate({ to: "/login" });
  }, [navigate]);

  return (
    <Ctx.Provider value={{ student, loading, setSession, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
