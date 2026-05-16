import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSession } from "@/lib/auth.server";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const classSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  subject: z.string().trim().max(80).optional().nullable(),
  teacher: z.string().trim().max(80).optional().nullable(),
  room: z.string().trim().max(40).optional().nullable(),
  period: z.string().trim().max(20).optional().nullable(),
  days: z.array(z.number().int().min(1).max(4)).max(4),
  start_time: z.string().regex(timeRegex),
  end_time: z.string().regex(timeRegex),
  color: z.string().trim().max(20).default("teal"),
  notes: z.string().max(2000).optional().nullable(),
});

export const listClasses = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  const { data, error } = await supabaseAdmin
    .from("classes")
    .select("*")
    .eq("student_uuid", s.studentUuid)
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertClass = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => classSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("classes")
        .update({ ...data })
        .eq("id", data.id)
        .eq("student_uuid", s.studentUuid);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("classes")
      .insert({ ...data, student_uuid: s.studentUuid })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { id: row.id };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("classes")
      .delete()
      .eq("id", data.id)
      .eq("student_uuid", s.studentUuid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkInsertClasses = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ classes: z.array(classSchema.omit({ id: true })).min(1).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireSession();
    const rows = data.classes.map((c) => ({ ...c, student_uuid: s.studentUuid }));
    const { error } = await supabaseAdmin.from("classes").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

/* TASKS */
const taskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  notes: z.string().max(4000).optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  completed: z.boolean().default(false),
  class_id: z.string().uuid().optional().nullable(),
});

export const listTasks = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("student_uuid", s.studentUuid)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertTask = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => taskSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("tasks")
        .update({
          ...data,
          completed_at: data.completed ? new Date().toISOString() : null,
        })
        .eq("id", data.id)
        .eq("student_uuid", s.studentUuid);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("tasks")
      .insert({ ...data, student_uuid: s.studentUuid })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { id: row.id };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", data.id)
      .eq("student_uuid", s.studentUuid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleTask = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("tasks")
      .update({
        completed: data.completed,
        completed_at: data.completed ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("student_uuid", s.studentUuid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* LINKS */
const linkSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(500),
  icon: z.string().max(40).optional().nullable(),
  pinned: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const listLinks = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  const { data, error } = await supabaseAdmin
    .from("links")
    .select("*")
    .eq("student_uuid", s.studentUuid)
    .order("pinned", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => linkSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("links")
        .update({ ...data })
        .eq("id", data.id)
        .eq("student_uuid", s.studentUuid);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("links")
      .insert({ ...data, student_uuid: s.studentUuid })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { id: row.id };
  });

export const deleteLink = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("links")
      .delete()
      .eq("id", data.id)
      .eq("student_uuid", s.studentUuid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* SETTINGS */
const settingsSchema = z.object({
  clock_24h: z.boolean().optional(),
  theme: z.enum(["dark", "light"]).optional(),
  accent: z.string().max(20).optional(),
  notifications: z.boolean().optional(),
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  const { data } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("student_uuid", s.studentUuid)
    .maybeSingle();
  return (
    data ?? {
      student_uuid: s.studentUuid,
      clock_24h: false,
      theme: "dark",
      accent: "teal",
      notifications: true,
    }
  );
});

export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({ student_uuid: s.studentUuid, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ name: z.string().trim().min(1).max(80) }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("students")
      .update({ name: data.name })
      .eq("id", s.studentUuid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* OVERRIDES */
export const listOverrides = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireSession();
  const { data } = await supabaseAdmin
    .from("schedule_overrides")
    .select("*")
    .eq("student_uuid", s.studentUuid);
  return data ?? [];
});

export const upsertOverride = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        kind: z.enum(["override", "holiday", "half-day", "delay", "assembly"]),
        forced_day: z.number().int().min(1).max(4).nullable().optional(),
        note: z.string().max(200).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("schedule_overrides")
      .upsert({ ...data, student_uuid: s.studentUuid }, { onConflict: "student_uuid,date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOverride = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ date: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("schedule_overrides")
      .delete()
      .eq("student_uuid", s.studentUuid)
      .eq("date", data.date);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* AI PARSE — paste schedule text, extract classes via Lovable AI Gateway */
const aiClassShape = z.object({
  name: z.string(),
  subject: z.string().nullable().optional(),
  teacher: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
  days: z.array(z.number().int().min(1).max(4)),
  start_time: z.string().regex(timeRegex),
  end_time: z.string().regex(timeRegex),
});

export const parseScheduleText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ text: z.string().min(10).max(20000) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireSession();
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const sys = `You extract class schedule entries from raw text for a school using a rotating Day 1-4 schedule.
Return a JSON object with key "classes": an array of items, each with:
- name (string), subject (string|null), teacher (string|null), room (string|null), period (string|null),
- days (array of integers 1..4 — which rotation days the class meets),
- start_time (HH:MM 24h), end_time (HH:MM 24h)
If the text uses A/B/C/D days, map A->1,B->2,C->3,D->4. If the text only lists one day per class, use that single day.
Only include real class entries. Output JSON only — no markdown.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: data.text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_classes",
              description: "Return parsed classes",
              parameters: {
                type: "object",
                properties: {
                  classes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        subject: { type: "string", nullable: true },
                        teacher: { type: "string", nullable: true },
                        room: { type: "string", nullable: true },
                        period: { type: "string", nullable: true },
                        days: { type: "array", items: { type: "integer", minimum: 1, maximum: 4 } },
                        start_time: { type: "string" },
                        end_time: { type: "string" },
                      },
                      required: ["name", "days", "start_time", "end_time"],
                    },
                  },
                },
                required: ["classes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_classes" } },
      }),
    });

    if (resp.status === 429) throw new Error("AI rate limit reached, please try again in a minute.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable settings.");
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error("AI request failed");
    }
    const json = await resp.json();
    const argStr = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argStr) throw new Error("AI returned no result");
    const parsed = z.object({ classes: z.array(aiClassShape) }).safeParse(JSON.parse(argStr));
    if (!parsed.success) throw new Error("AI output did not match schema");
    return parsed.data;
  });

/* NOTES (daily notepad) */
const noteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string().max(20000).default(""),
});

export const listNotesRange = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { data: rows, error } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("student_uuid", s.studentUuid)
      .gte("date", data.start)
      .lte("date", data.end);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getNote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { data: row } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("student_uuid", s.studentUuid)
      .eq("date", data.date)
      .maybeSingle();
    return row;
  });

export const upsertNote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => noteSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { error } = await supabaseAdmin
      .from("notes")
      .upsert(
        { student_uuid: s.studentUuid, date: data.date, content: data.content, updated_at: new Date().toISOString() },
        { onConflict: "student_uuid,date" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* GOOGLE CALENDAR SYNC */
const GCAL_GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

async function gcalFetch(path: string, init: RequestInit = {}) {
  const lov = process.env.LOVABLE_API_KEY;
  const gcal = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
  if (!gcal) throw new Error("Google Calendar is not connected yet");
  const resp = await fetch(`${GCAL_GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lov}`,
      "X-Connection-Api-Key": gcal,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await resp.text();
  const json = text ? JSON.parse(text) : {};
  if (!resp.ok) {
    console.error("gcal error", resp.status, text);
    throw new Error(`Google Calendar error [${resp.status}]: ${json?.error?.message ?? text}`);
  }
  return json;
}

export const gcalStatus = createServerFn({ method: "GET" }).handler(async () => {
  await requireSession();
  return { connected: Boolean(process.env.GOOGLE_CALENDAR_API_KEY) };
});

export const syncTasksToGcal = createServerFn({ method: "POST" }).handler(async () => {
  const s = await requireSession();
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("student_uuid", s.studentUuid)
    .not("due_date", "is", null);
  if (!tasks || tasks.length === 0) return { ok: true, count: 0 };

  let count = 0;
  for (const t of tasks) {
    const due = new Date(t.due_date as string);
    const end = new Date(due.getTime() + 30 * 60_000);
    const body = {
      summary: `📚 ${t.title}`,
      description: `${t.notes ?? ""}\nPriority: ${t.priority}${t.completed ? "\n✅ Completed" : ""}`,
      start: { dateTime: due.toISOString() },
      end: { dateTime: end.toISOString() },
    };
    try {
      if (t.google_event_id) {
        await gcalFetch(`/calendars/primary/events/${encodeURIComponent(t.google_event_id)}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        const ev = await gcalFetch(`/calendars/primary/events`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        await supabaseAdmin
          .from("tasks")
          .update({ google_event_id: ev.id, synced_at: new Date().toISOString() })
          .eq("id", t.id);
      }
      count++;
    } catch (e) {
      console.error("sync task failed", t.id, e);
    }
  }
  return { ok: true, count };
});

export const syncNoteToGcal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireSession();
    const { data: note } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("student_uuid", s.studentUuid)
      .eq("date", data.date)
      .maybeSingle();
    if (!note || !note.content.trim()) throw new Error("Nothing to sync — note is empty");

    const body = {
      summary: `📝 Notes — ${data.date}`,
      description: note.content,
      start: { date: data.date },
      end: { date: data.date },
    };
    let eventId = note.google_event_id as string | null;
    if (eventId) {
      await gcalFetch(`/calendars/primary/events/${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    } else {
      const ev = await gcalFetch(`/calendars/primary/events`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      eventId = ev.id;
    }
    await supabaseAdmin
      .from("notes")
      .update({ google_event_id: eventId, synced_at: new Date().toISOString() })
      .eq("id", note.id);
    return { ok: true };
  });
