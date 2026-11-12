-- Static Stage 2 habits and a counter reset.
-- Idempotent. Wrapped in one transaction.
-- Does not read or modify the original Habits tables, and does not touch
-- backup tables named bak_20261112_*. club_book_progress and club_user_habits
-- rows are left as they are.

BEGIN;

DELETE FROM public.club_completions;

INSERT INTO public.club_habits (key, title, description, emoji, kind, weekly_target, points, sort_order, archived)
VALUES
  ('book', 'Книга', '10 страниц или 30 минут аудиокниги', '📚', 'daily', NULL, 1, 10, false),
  ('sport', 'Спорт', 'Тренировка в зале или 10 000 шагов', '💪', 'daily', NULL, 1, 20, false),
  ('language', 'Иностранный язык', 'Занятие', '🗣️', 'daily', NULL, 1, 30, false),
  ('vitamin_c', 'Витамин C', 'Принять', '🍊', 'daily', NULL, 1, 40, false),
  ('vitamin_e', 'Витамин E', 'Принять', '💊', 'daily', NULL, 1, 50, false),
  ('kk', 'КК', 'Отметить', '✨', 'daily', NULL, 1, 60, false)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  kind = EXCLUDED.kind,
  weekly_target = EXCLUDED.weekly_target,
  points = EXCLUDED.points,
  sort_order = EXCLUDED.sort_order,
  archived = false;

DELETE FROM public.club_habits
WHERE key NOT IN ('book', 'sport', 'language', 'vitamin_c', 'vitamin_e', 'kk');

DROP POLICY IF EXISTS "club habits insert" ON public.club_habits;
DROP POLICY IF EXISTS "club habits update" ON public.club_habits;
REVOKE INSERT, UPDATE, DELETE ON public.club_habits FROM authenticated;

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

-- Check-offs belong to the shared list again, one mark per habit per day.
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
  IF NOT FOUND OR hab.archived THEN
    RAISE EXCEPTION 'Неизвестная привычка';
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

DROP TRIGGER IF EXISTS club_completions_validate_insert ON public.club_completions;
CREATE TRIGGER club_completions_validate_insert
  BEFORE INSERT ON public.club_completions
  FOR EACH ROW EXECUTE FUNCTION public.club_validate_completion_insert();

-- If an earlier migration pointed updates at per-user habits, put them back
-- on the shared list. Creating the function is harmless when no update trigger exists.
CREATE OR REPLACE FUNCTION public.club_validate_completion_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.task_key IS DISTINCT FROM OLD.task_key
    OR NEW.completed_on IS DISTINCT FROM OLD.completed_on
    OR NEW.id IS DISTINCT FROM OLD.id
  ) THEN
    RAISE EXCEPTION 'Нельзя переносить отметку';
  END IF;
  RETURN NEW;
END;
$function$;

COMMIT;
