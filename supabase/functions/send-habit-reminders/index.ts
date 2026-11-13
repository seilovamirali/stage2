// Sends a Web Push to Stage 2 members who have fewer than 6 of today's
// shared habits marked. Refuses every request until CRON_SECRET is set and
// presented in the x-cron-secret header, so a deploy by itself notifies nobody.
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import webpush from "npm:web-push@3.6.7";
import { habitsLeft, reminderBody } from "./remind.ts";

const HABIT_KEYS = ["book", "sport", "language", "vitamin_c", "vitamin_e", "kk"];

function almatyParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number(read("hour")),
    minute: Number(read("minute")),
  };
}

function untilMidnight(hour: number, minute: number): string {
  const left = 24 * 60 - (hour * 60 + minute);
  const hh = Math.floor(left / 60);
  const mm = left % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const secret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!secret || provided !== secret) return json({ error: "unauthorized" }, 401);

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!vapidPublic || !vapidPrivate || !subject || !supabaseUrl || !serviceKey) {
    return json({ error: "missing secrets" }, 500);
  }

  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);
  const supabase = createClient(supabaseUrl, serviceKey);
  const clock = almatyParts(new Date());
  const until = untilMidnight(clock.hour, clock.minute);

  const [{ data: subscriptions, error: subError }, { data: completions, error: doneError }] = await Promise.all([
    supabase.from("club_push_subscriptions").select("id, user_id, endpoint, p256dh, auth"),
    supabase.from("club_completions").select("user_id, task_key").eq("completed_on", clock.date).in("task_key", HABIT_KEYS),
  ]);
  if (subError || doneError) return json({ error: "query failed" }, 500);

  const byUser = new Map<string, string[]>();
  for (const row of completions ?? []) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row.task_key);
    byUser.set(row.user_id, list);
  }

  let sent = 0;
  let skipped = 0;
  let removed = 0;
  let failed = 0;
  for (const sub of subscriptions ?? []) {
    const left = habitsLeft(byUser.get(sub.user_id) ?? []);
    if (left <= 0) {
      skipped += 1;
      continue;
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: "Stage 2",
          body: reminderBody(left, until),
          url: "/stage2/today",
        }),
      );
      sent += 1;
    } catch (error) {
      const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (status === 404 || status === 410) {
        await supabase.from("club_push_subscriptions").delete().eq("id", sub.id);
        removed += 1;
      } else {
        failed += 1;
      }
    }
  }

  return json({ date: clock.date, sent, skipped, removed, failed });
});
