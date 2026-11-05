-- Stage 2 (книга и спорт). Separate tables in the existing Supabase project.
-- Idempotent: safe to run again. Does not read or modify existing Habits
-- tables, functions, triggers, or policies (profiles, habits, completions,
-- book_progress, jawshan_assignments, jawshan_done, daily_reminders,
-- personal_messages, and anything else already in the project).
-- Apply in the Supabase SQL editor as an admin (postgres).
--
-- After it succeeds:
--   select key, title from public.club_habits order by sort_order;
--     -- reading / Книга, sport / Спорт
--   select public.club_is_member();  -- false until this site calls club_ensure_member

-- ---------------------------------------------------------------------------
-- Membership. A row exists only after this site calls club_ensure_member
-- on login. Old Habits accounts stay out until they sign in here.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.club_members (
  user_id uuid PRIMARY KEY,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '🙂',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_profiles_name_check CHECK (char_length(display_name) BETWEEN 1 AND 40),
  CONSTRAINT club_profiles_emoji_check CHECK (char_length(avatar_emoji) BETWEEN 1 AND 8)
);

CREATE TABLE IF NOT EXISTS public.club_habits (
  key text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL,
  kind text NOT NULL,
  weekly_target integer,
  points integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 100,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_habits_key_check CHECK (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  CONSTRAINT club_habits_title_check CHECK (char_length(title) BETWEEN 1 AND 80),
  CONSTRAINT club_habits_description_check CHECK (char_length(description) <= 200),
  CONSTRAINT club_habits_emoji_check CHECK (char_length(emoji) BETWEEN 1 AND 8),
  CONSTRAINT club_habits_kind_check CHECK (kind = ANY (ARRAY['daily'::text, 'weekly'::text])),
  CONSTRAINT club_habits_points_check CHECK (points BETWEEN 1 AND 1000),
  CONSTRAINT club_habits_weekly_target_check CHECK (
    (kind = 'daily' AND weekly_target IS NULL)
    OR (kind = 'weekly' AND weekly_target BETWEEN 1 AND 14)
  )
);

CREATE TABLE IF NOT EXISTS public.club_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_key text NOT NULL,
  completed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_completions_once UNIQUE (user_id, task_key, completed_on)
);

CREATE TABLE IF NOT EXISTS public.club_book_progress (
  user_id uuid PRIMARY KEY,
  book_title text NOT NULL DEFAULT '',
  total_pages integer NOT NULL DEFAULT 1,
  current_page integer NOT NULL DEFAULT 0,
  day_start_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Almaty')::date),
  day_start_page integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_book_progress_title_check CHECK (char_length(book_title) <= 120),
  CONSTRAINT club_book_progress_total_check CHECK (total_pages BETWEEN 1 AND 20000),
  CONSTRAINT club_book_progress_page_check CHECK (current_page >= 0 AND current_page <= total_pages),
  CONSTRAINT club_book_progress_start_check CHECK (day_start_page >= 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_members_user_id_fkey') THEN
    ALTER TABLE public.club_members
      ADD CONSTRAINT club_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_profiles_id_fkey') THEN
    ALTER TABLE public.club_profiles
      ADD CONSTRAINT club_profiles_id_fkey
      FOREIGN KEY (id) REFERENCES public.club_members(user_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_habits_created_by_fkey') THEN
    ALTER TABLE public.club_habits
      ADD CONSTRAINT club_habits_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.club_profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_completions_user_id_fkey') THEN
    ALTER TABLE public.club_completions
      ADD CONSTRAINT club_completions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_completions_task_key_fkey') THEN
    ALTER TABLE public.club_completions
      ADD CONSTRAINT club_completions_task_key_fkey
      FOREIGN KEY (task_key) REFERENCES public.club_habits(key);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_book_progress_user_id_fkey') THEN
    ALTER TABLE public.club_book_progress
      ADD CONSTRAINT club_book_progress_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS club_completions_user_day_idx
  ON public.club_completions (user_id, completed_on);
CREATE INDEX IF NOT EXISTS club_completions_task_idx
  ON public.club_completions (task_key);

-- Seeded habits. ON CONFLICT does nothing, so a later edit is kept.
INSERT INTO public.club_habits (key, title, description, emoji, kind, weekly_target, points, sort_order)
VALUES
  ('reading', 'Книга', '10 страниц или 30 минут аудиокниги', '📚', 'daily', NULL, 10, 10),
  ('sport', 'Спорт', 'Тренировка в зале или 10 000 шагов', '💪', 'daily', NULL, 10, 20)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Membership check. Security definer so policies can call it without
-- recursing through RLS. Reads only club_members.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.club_is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members WHERE user_id = auth.uid()
  );
$function$;

REVOKE ALL ON FUNCTION public.club_is_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.club_is_member() TO authenticated;

-- Called by this site on the first authenticated request. Inserts the caller
-- only. Later calls return the existing profile and do not rename it.
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
  IF FOUND THEN
    RETURN row;
  END IF;

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
  RETURN row;
END;
$function$;

REVOKE ALL ON FUNCTION public.club_ensure_member(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.club_ensure_member(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.club_profiles_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.display_name := left(btrim(coalesce(NEW.display_name, '')), 40);
  IF char_length(NEW.display_name) < 1 THEN
    RAISE EXCEPTION 'Введите имя';
  END IF;
  IF NEW.avatar_emoji IS NULL OR char_length(btrim(NEW.avatar_emoji)) < 1 THEN
    NEW.avatar_emoji := '🙂';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS club_profiles_guard ON public.club_profiles;
CREATE TRIGGER club_profiles_guard
  BEFORE INSERT OR UPDATE ON public.club_profiles
  FOR EACH ROW EXECUTE FUNCTION public.club_profiles_guard();

CREATE OR REPLACE FUNCTION public.club_habits_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.key IS DISTINCT FROM OLD.key THEN
    RAISE EXCEPTION 'Ключ привычки нельзя менять';
  END IF;
  IF TG_OP = 'INSERT' AND auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS club_habits_guard ON public.club_habits;
CREATE TRIGGER club_habits_guard
  BEFORE INSERT OR UPDATE ON public.club_habits
  FOR EACH ROW EXECUTE FUNCTION public.club_habits_guard();

CREATE OR REPLACE FUNCTION public.club_validate_completion_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  today date := (now() AT TIME ZONE 'Asia/Almaty')::date;
  wk date;
  cnt int;
  hab public.club_habits%ROWTYPE;
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Можно отмечать только свои привычки';
  END IF;
  IF NEW.completed_on <> today THEN
    RAISE EXCEPTION 'Можно отмечать только сегодняшний день';
  END IF;
  SELECT * INTO hab FROM public.club_habits WHERE key = NEW.task_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Неизвестная привычка';
  END IF;
  IF hab.archived THEN
    RAISE EXCEPTION 'Эта привычка в архиве';
  END IF;
  IF hab.kind = 'weekly' THEN
    wk := date_trunc('week', today)::date;
    SELECT count(*) INTO cnt FROM public.club_completions
      WHERE user_id = NEW.user_id
        AND task_key = NEW.task_key
        AND completed_on >= wk
        AND completed_on < wk + 7;
    IF cnt >= hab.weekly_target THEN
      RAISE EXCEPTION 'Недельная цель уже достигнута';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.club_validate_completion_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.completed_on <> (now() AT TIME ZONE 'Asia/Almaty')::date AND current_user = 'authenticated' THEN
    RAISE EXCEPTION 'Отменить можно только сегодняшнюю отметку';
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS club_completions_validate_insert ON public.club_completions;
CREATE TRIGGER club_completions_validate_insert
  BEFORE INSERT ON public.club_completions
  FOR EACH ROW EXECUTE FUNCTION public.club_validate_completion_insert();

DROP TRIGGER IF EXISTS club_completions_validate_delete ON public.club_completions;
CREATE TRIGGER club_completions_validate_delete
  BEFORE DELETE ON public.club_completions
  FOR EACH ROW EXECUTE FUNCTION public.club_validate_completion_delete();

-- Keeps «сегодня прочитано» as the page delta since the first save of the
-- Almaty day. The client cannot spoof day_start_*. The first save records
-- the current page as the day's start, so it does not count as pages read
-- today; later saves the same day do.
CREATE OR REPLACE FUNCTION public.club_book_progress_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  today date := (now() AT TIME ZONE 'Asia/Almaty')::date;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Нельзя менять владельца прогресса';
  END IF;
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Можно менять только свой прогресс';
  END IF;

  NEW.book_title := left(btrim(coalesce(NEW.book_title, '')), 120);
  IF NEW.total_pages IS NULL OR NEW.total_pages < 1 THEN
    NEW.total_pages := 1;
  ELSIF NEW.total_pages > 20000 THEN
    NEW.total_pages := 20000;
  END IF;
  IF NEW.current_page IS NULL OR NEW.current_page < 0 THEN
    NEW.current_page := 0;
  END IF;
  IF NEW.current_page > NEW.total_pages THEN
    NEW.current_page := NEW.total_pages;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.day_start_date := today;
    NEW.day_start_page := NEW.current_page;
  ELSIF OLD.day_start_date = today THEN
    NEW.day_start_date := OLD.day_start_date;
    NEW.day_start_page := OLD.day_start_page;
  ELSE
    NEW.day_start_date := today;
    NEW.day_start_page := OLD.current_page;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS club_book_progress_guard ON public.club_book_progress;
CREATE TRIGGER club_book_progress_guard
  BEFORE INSERT OR UPDATE ON public.club_book_progress
  FOR EACH ROW EXECUTE FUNCTION public.club_book_progress_guard();

-- ---------------------------------------------------------------------------
-- RLS. Only club members can see or change club rows. Joining is only
-- possible through club_ensure_member (security definer).
-- ---------------------------------------------------------------------------

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_book_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club members read" ON public.club_members;
CREATE POLICY "club members read" ON public.club_members
  FOR SELECT TO authenticated USING (public.club_is_member());

DROP POLICY IF EXISTS "club profiles read" ON public.club_profiles;
CREATE POLICY "club profiles read" ON public.club_profiles
  FOR SELECT TO authenticated USING (public.club_is_member());

DROP POLICY IF EXISTS "club profiles update own" ON public.club_profiles;
CREATE POLICY "club profiles update own" ON public.club_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.club_is_member())
  WITH CHECK (id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club habits read" ON public.club_habits;
CREATE POLICY "club habits read" ON public.club_habits
  FOR SELECT TO authenticated USING (public.club_is_member());

DROP POLICY IF EXISTS "club habits insert" ON public.club_habits;
CREATE POLICY "club habits insert" ON public.club_habits
  FOR INSERT TO authenticated WITH CHECK (public.club_is_member());

DROP POLICY IF EXISTS "club habits update" ON public.club_habits;
CREATE POLICY "club habits update" ON public.club_habits
  FOR UPDATE TO authenticated
  USING (public.club_is_member())
  WITH CHECK (public.club_is_member());

DROP POLICY IF EXISTS "club completions read" ON public.club_completions;
CREATE POLICY "club completions read" ON public.club_completions
  FOR SELECT TO authenticated USING (public.club_is_member());

DROP POLICY IF EXISTS "club completions insert own" ON public.club_completions;
CREATE POLICY "club completions insert own" ON public.club_completions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club completions delete own" ON public.club_completions;
CREATE POLICY "club completions delete own" ON public.club_completions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club book read" ON public.club_book_progress;
CREATE POLICY "club book read" ON public.club_book_progress
  FOR SELECT TO authenticated USING (public.club_is_member());

DROP POLICY IF EXISTS "club book insert own" ON public.club_book_progress;
CREATE POLICY "club book insert own" ON public.club_book_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.club_is_member());

DROP POLICY IF EXISTS "club book update own" ON public.club_book_progress;
CREATE POLICY "club book update own" ON public.club_book_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.club_is_member())
  WITH CHECK (user_id = auth.uid() AND public.club_is_member());

REVOKE ALL ON public.club_members, public.club_profiles, public.club_habits, public.club_completions, public.club_book_progress FROM PUBLIC, anon;
GRANT SELECT ON public.club_members TO authenticated;
GRANT SELECT, UPDATE ON public.club_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.club_habits TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.club_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.club_book_progress TO authenticated;
GRANT ALL ON public.club_members, public.club_profiles, public.club_habits, public.club_completions, public.club_book_progress TO service_role;

ALTER TABLE public.club_members REPLICA IDENTITY FULL;
ALTER TABLE public.club_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.club_habits REPLICA IDENTITY FULL;
ALTER TABLE public.club_completions REPLICA IDENTITY FULL;
ALTER TABLE public.club_book_progress REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'club_members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.club_members;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'club_profiles'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.club_profiles;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'club_habits'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.club_habits;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'club_completions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.club_completions;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'club_book_progress'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.club_book_progress;
    END IF;
  END IF;
END $$;
