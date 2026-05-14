import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashPin, newToken, requireSession } from "@/lib/auth.server";

const credsSchema = z.object({
  studentId: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9._-]+$/, "Letters, numbers, . _ - only"),
  name: z.string().trim().min(1).max(80).optional(),
  pin: z.string().min(4).max(32),
});

export const signupStudent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credsSchema.extend({ name: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sid = data.studentId.toLowerCase();
    const existing = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("student_id", sid)
      .maybeSingle();
    if (existing.data) throw new Error("That Student ID is already registered. Try signing in.");

    const insert = await supabaseAdmin
      .from("students")
      .insert({ student_id: sid, name: data.name, pin_hash: hashPin(data.pin, sid) })
      .select("id, student_id, name")
      .single();
    if (insert.error || !insert.data) throw new Error(insert.error?.message ?? "Signup failed");

    await supabaseAdmin.from("settings").insert({ student_uuid: insert.data.id });

    // Seed default links
    const seed = [
      { label: "Spotify", url: "https://open.spotify.com", icon: "music", pinned: true, sort_order: 0 },
      { label: "Google Classroom", url: "https://classroom.google.com", icon: "graduation", pinned: true, sort_order: 1 },
      { label: "Clever Portal", url: "https://clever.com/in/login", icon: "key", pinned: false, sort_order: 2 },
      { label: "SmartPass", url: "https://smartpass.app", icon: "ticket", pinned: false, sort_order: 3 },
      { label: "chatham-nj.org", url: "https://www.chatham-nj.org", icon: "globe", pinned: false, sort_order: 4 },
    ].map((l) => ({ ...l, student_uuid: insert.data!.id }));
    await supabaseAdmin.from("links").insert(seed);

    const token = newToken();
    await supabaseAdmin.from("sessions").insert({ token, student_uuid: insert.data.id });
    return { token, student: insert.data };
  });

export const loginStudent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const sid = data.studentId.toLowerCase();
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, student_id, name, pin_hash")
      .eq("student_id", sid)
      .maybeSingle();
    if (!student || student.pin_hash !== hashPin(data.pin, sid)) {
      throw new Error("Wrong Student ID or PIN");
    }
    const token = newToken();
    await supabaseAdmin.from("sessions").insert({ token, student_uuid: student.id });
    return {
      token,
      student: { id: student.id, student_id: student.student_id, name: student.name },
    };
  });

export const me = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  return { studentUuid: s.studentUuid, studentId: s.studentId, name: s.name };
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const s = await requireSession();
    // delete current token via header again
    const auth = (await import("@tanstack/react-start/server")).getRequestHeader("authorization");
    const token = auth?.slice(7).trim();
    if (token) await supabaseAdmin.from("sessions").delete().eq("token", token);
    return { ok: true, studentUuid: s.studentUuid };
  } catch {
    return { ok: true };
  }
});
