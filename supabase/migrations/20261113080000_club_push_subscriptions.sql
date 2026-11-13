-- Stage 2 Web Push subscriptions.
-- Idempotent. Does not read or modify Habits tables, club_completions,
-- club_habits, club_book_progress, or the bak_20261112_* backups.
--
-- RLS: a member can read and write only their own subscription rows.
-- The reminder function uses the service role and bypasses RLS.
-- Applying this file does not send any notification.
--
-- Scheduling is skipped until both database settings exist:
--   alter database postgres set app.stage2_push_url = 'https://rveijqsmfzncelpexlmm.supabase.co/functions/v1/send-habit-reminders';
--   alter database postgres set app.stage2_cron_secret = '<CRON_SECRET>';
-- Re-run this file after those settings (and the function secrets) exist.
-- 20:00 Asia/Almaty = 15:00 UTC, 22:30 Asia/Almaty = 17:30 UTC.

CREATE TABLE IF NOT EXISTS public.club_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.club_profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_push_subscriptions_endpoint_check CHECK (char_length(endpoint) BETWEEN 12 AND 2000),
  CONSTRAINT club_push_subscriptions_p256dh_check CHECK (char_length(p256dh) BETWEEN 8 AND 200),
  CONSTRAINT club_push_subscriptions_auth_check CHECK (char_length(auth) BETWEEN 8 AND 200),
  CONSTRAINT club_push_subscriptions_owner_endpoint UNIQUE (user_id, endpoint)
);

ALTER TABLE public.club_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_push_owner_only ON public.club_push_subscriptions;
CREATE POLICY club_push_owner_only
  ON public.club_push_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE ALL ON public.club_push_subscriptions FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_push_subscriptions TO authenticated;
GRANT ALL ON public.club_push_subscriptions TO service_role;

DO $$
DECLARE
  push_url text := current_setting('app.stage2_push_url', true);
  cron_secret text := current_setting('app.stage2_cron_secret', true);
  job record;
BEGIN
  IF push_url IS NULL OR cron_secret IS NULL OR push_url = '' OR cron_secret = '' THEN
    RAISE NOTICE 'Stage 2 push cron skipped: set app.stage2_push_url and app.stage2_cron_secret, then run this migration again.';
    RETURN;
  END IF;

  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    CREATE EXTENSION IF NOT EXISTS pg_net;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Stage 2 push cron skipped, extensions unavailable: %', SQLERRM;
    RETURN;
  END;

  FOR job IN SELECT jobid FROM cron.job WHERE jobname IN ('stage2_push_2000', 'stage2_push_2230')
  LOOP
    PERFORM cron.unschedule(job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'stage2_push_2000',
    '0 15 * * *',
    format(
      $job$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', %L), body := '{}'::jsonb, timeout_milliseconds := 10000)$job$,
      push_url,
      cron_secret
    )
  );
  PERFORM cron.schedule(
    'stage2_push_2230',
    '30 17 * * *',
    format(
      $job$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', %L), body := '{}'::jsonb, timeout_milliseconds := 10000)$job$,
      push_url,
      cron_secret
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Stage 2 push cron skipped: %', SQLERRM;
END $$;
