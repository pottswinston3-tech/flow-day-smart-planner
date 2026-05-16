ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct access" ON public.notes FOR ALL USING (false) WITH CHECK (false);