-- Personal Stage 2 habits (copy-on-write) and x2 marks for the monthly race.
-- Idempotent. Does not read or modify the original Habits tables
-- (profiles, habits, completions, book_progress, jawshan_*, daily_reminders,
-- personal_messages) or their functions and policies.
-- club_habits stays the untouched template. Member edits go only to club_user_habits.

CREATE TABLE IF NOT EXISTS public.club_user_habits (
  user_id uuid NOT NULL,
  key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL,
  kind text NOT NULL,
  weekly_target integer,
  points integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 100,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_user_habits_pkey PRIMARY KEY (user_id, key),
  CONSTRAINT club_user_habits_key_check CHECK (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  CONSTRAINT club_user_habits_title_check CHECK (char_length(title) BETWEEN 1 AND 80),
  CONSTRAINT club_user_habits_description_check CHECK (char_length(description) <= 200),
  CONSTRAINT club_user_habits_emoji_check CHECK (char_length(emoji) BETWEEN 1 AND 8),
  CONSTRAINT club_user_habits_kind_check CHECK (kind = ANY (ARRAY['daily'::text, 'weekly'::text])),
  CONSTRAINT club_user_habits_points_check CHECK (points BETWEEN 1 AND 1000),
  CONSTRAINT club_user_habits_weekly_target_check CHECK (
    (kind = 'daily' AND weekly_target IS NULL)
    OR (kind = 'weekly' AND weekly_target BETWEEN 1 AND 14)
  )
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_user_habits_user_id_fkey') THEN
    ALTER TABLE public.club_user_habits
      ADD CONSTRAINT club_user_habits_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.club_completions ADD COLUMN IF NOT EXISTS times smallint NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_completions_times_check') THEN
    ALTER TABLE public.club_completions
      ADD CONSTRAINT club_completions_times_check CHECK (times BETWEEN 1 AND 2);
  END IF;
END $$;

-- Personal keys are not rows in the shared template.
ALTER TABLE public.club_completions DROP CONSTRAINT IF EXISTS club_completions_task_key_fkey;

-- One private copy of the original book + sport set. Does not update club_habits.
INSERT INTO public.club_user_habits (user_id, key, title, description, emoji, kind, weekly_target, points, sort_order)
SELECT p.id, v.key, v.title, v.description, v.emoji, v.kind, v.weekly_target, v.points, v.sort_order
FROM public.club_profiles p
CROSS JOIN (
  VALUES
    ('reading', 'Книга', '10 страниц или 30 минут аудиокниги', '📚', 'daily', NULL::integer, 10, 10),
    ('sport', 'Спорт', 'Тренировка в зале или 10 000 шагов', '💪', 'daily', NULL::integer, 10, 20)
) AS v(key, title, description, emoji, kind, weekly_target, points, sort_order)
ON CONFLICT (user_id, key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.club_seed_user_habits(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.club_user_habits (user_id, key, title, description, emoji, kind, weekly_target, points, sort_order)
  VALUES
    (p_user, 'reading', 'Книга', '10 страниц или 30 минут аудиокниги', '📚', 'daily', NULL, 10, 10),
    (p_user, 'sport', 'Спорт', 'Тренировка в зале или 10 000 шагов', '💪', 'daily', NULL, 10, 20)
  ON CONFLICT (user_id, key) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.club_seed_user_habits(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.club_ensure_member(p_display_name text DEFAULT NULL)
RETURNS public.club_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  row public.club_profiles;
  name text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Войдите, чтобы присоединиться';
  END IF;

  INSERT INTO public.club_members (user_id)
  VALUES (uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO row FROM public.club_profiles WHERE id = uid;
  IF NOT FOUND THEN
    name := left(btrim(coalesce(
      nullif(btrim(p_display_name), ''),
      nullif(btrim(coalesce(auth.jwt() -> 'user_metadata' ->> 'display_name', '')), ''),
      'Участник'
    )), 40);
    IF name IS NULL OR char_length(name) < 1 THEN
      name := 'Участник';
    END IF;
    INSERT INTO public.club_profiles (id, display_name)
    VALUES (uid, name)
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO row FROM public.club_profiles WHERE id = uid;
  END IF;

  PERFORM public.club_seed_user_habits(uid);
  RETURN row;
END;
$function$;

REVOKE ALL ON FUNCTION public.club_ensure_member(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.club_ensure_member(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.club_user_habits_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.user_id := OLD.user_id;
    NEW.key := OLD.key;
    NEW.created_at := OLD.created_at;
  END IF;
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Можно менять только свои привычки';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS club_user_habits_guard ON public.club_user_habits;
CREATE TRIGGER club_user_habits_guard
  BEFORE INSERT OR UPDATE ON public.club_user_habits
  FOR EACH ROW EXECUTE FUNCTION public.club_user_habits_guard();

CREATE OR REPLACE FUNCTION public.club_validate_completion_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  today date := (now() AT TIME ZONE 'Asia/Almaty')::date;
  wk date;
  cnt int;
  hab public.club_user_habits%ROWTYPE;
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Можно отмечать только свои привычки';
  END IF;
  IF NEW.times IS NULL OR NEW.times < 1 OR NEW.times > 2 THEN
    RAISE EXCEPTION 'Отметка может быть обычной или x2';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.task_key IS DISTINCT FROM OLD.task_key OR NEW.completed_on IS DISTINCT FROM OLD.completed_on THEN
      RAISE EXCEPTION 'Нельзя переносить отметку';
    END IF;
    IF NEW.times = OLD.times THEN
      RETURN NEW;
    END IF;
  END IF;
  IF NEW.completed_on <> today THEN
    RAISE EXCEPTION 'Можно отмечать только сегодняшний день';
  END IF;
  SELECT * INTO hab FROM public.club_user_habits WHERE user_id = NEW.user_id AND key = NEW.task_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Неизвестная привычка';
  END IF;
  IF hab.archived THEN
    RAISE EXCEPTION 'Эта привычка в архиве';
  END IF;
  IF hab.kind = 'weekly' THEN
    wk := date_trunc('week', today)::date;
    SELECT coalesce(sum(times), 0) INTO cnt FROM public.club_completions
      WHERE user_id = NEW.user_id
        AND task_key = NEW.task_key
        AND completed_on >= wk
        AND completed_on < wk + 7
        AND (TG_OP = 'INSERT' OR id IS DISTINCT FROM NEW.id);
    IF cnt + NEW.times > hab.weekly_target THEN
      RAISE EXCEPTION 'Недельная цель уже достигнута';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS club_completions_validate_insert ON public.club_completions;
CREATE TRIGGER club_completions_validate_insert
  BEFORE INSERT ON public.club_completions
  FOR EACH ROW EXECUTE FUNCTION public.club_validate_completion_write();

DROP TRIGGER IF EXISTS club_completions_validate_update ON public.club_completions;
CREATE TRIGGER club_completions_validate_update
  BEFORE UPDATE ON public.club_completions
  FOR EACH ROW EXECUTE FUNCTION public.club_validate_completion_write();

ALTER TABLE public.club_user_habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club user habits read" ON public.club_user_habits;
CREATE POLICY "club user habits read" ON public.club_user_habits
  FOR SELECT TO authenticated USING (public.club_is_member());

DROP POLICY IF EXISTS "club user habits insert own" ON public.club_user_habits;
CREATE POLICY "club user habits insert own" ON public.club_user_habits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club user habits update own" ON public.club_user_habits;
CREATE POLICY "club user habits update own" ON public.club_user_habits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.club_is_member())
  WITH CHECK (user_id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club user habits delete own" ON public.club_user_habits;
CREATE POLICY "club user habits delete own" ON public.club_user_habits
  FOR DELETE TO authenticated USING (user_id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club completions update own" ON public.club_completions;
CREATE POLICY "club completions update own" ON public.club_completions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.club_is_member())
  WITH CHECK (user_id = auth.uid() AND public.club_is_member());

-- The shared template is readable, but members can no longer rewrite it.
DROP POLICY IF EXISTS "club habits insert" ON public.club_habits;
DROP POLICY IF EXISTS "club habits update" ON public.club_habits;
REVOKE INSERT, UPDATE, DELETE ON public.club_habits FROM authenticated;

REVOKE ALL ON public.club_user_habits FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_user_habits TO authenticated;
GRANT UPDATE ON public.club_completions TO authenticated;
GRANT ALL ON public.club_user_habits TO service_role;

ALTER TABLE public.club_user_habits REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'club_user_habits'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.club_user_habits;
    END IF;
  END IF;
END $$;
