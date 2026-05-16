CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_uuid uuid NOT NULL,
  date date NOT NULL,
  content text NOT NULL DEFAULT '',
  google_event_id text,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_uuid, date)
);
CREATE INDEX idx_notes_student_date ON public.notes(student_uuid, date);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS synced_at timestamptz;