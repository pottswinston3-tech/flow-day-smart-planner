// Server-only helpers for DayFlow custom Student ID + PIN auth.
// Never import this from client code.
import { createHash, randomBytes } from "crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SALT = "dayflow.v1.pepper";

export function hashPin(pin: string, studentId: string): string {
  return createHash("sha256").update(`${SALT}:${studentId}:${pin}`).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export type StudentSession = {
  studentUuid: string;
  studentId: string;
  name: string;
};

export async function requireSession(): Promise<StudentSession> {
  const auth = getRequestHeader("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new Error("Not signed in");
  }
  const token = auth.slice(7).trim();
  if (!token) throw new Error("Not signed in");

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("student_uuid, expires_at, students(student_id, name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) throw new Error("Session invalid");
  if (new Date(data.expires_at) < new Date()) {
    await supabaseAdmin.from("sessions").delete().eq("token", token);
    throw new Error("Session expired");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const student = data.students as any;
  return {
    studentUuid: data.student_uuid,
    studentId: student.student_id,
    name: student.name,
  };
}
