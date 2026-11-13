import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

function keyBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

type Status = "idle" | "busy" | "on" | "denied" | "unsupported" | "error";

export function PushOptIn({ userId }: { userId: string | undefined }) {
  const [status, setStatus] = useState<Status>("idle");
  const supported = typeof window !== "undefined"
    && "Notification" in window
    && "serviceWorker" in navigator
    && "PushManager" in window;

  const enable = async () => {
    if (!userId || !supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      });
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
      });
      const json = subscription.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        setStatus("error");
        return;
      }
      const { error } = await supabase.from("club_push_subscriptions").upsert(
        { user_id: userId, endpoint, p256dh, auth },
        { onConflict: "user_id,endpoint" },
      );
      setStatus(error ? "error" : "on");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="border border-border bg-card px-4 py-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!userId || status === "busy" || status === "on"}
        onClick={() => void enable()}
      >
        {status === "on" ? "Уведомления включены" : status === "busy" ? "Подключаем…" : "Включить уведомления"}
      </Button>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        На iPhone сначала добавьте сайт на экран «Домой»: «Поделиться» → «На экран Домой». Откройте Stage 2 с иконки и нажмите кнопку.
      </p>
      {status === "denied" && <p className="mt-2 text-xs text-gold">Браузер запретил уведомления.</p>}
      {status === "unsupported" && <p className="mt-2 text-xs text-gold">Этот браузер не показывает пуш-уведомления.</p>}
      {status === "error" && <p className="mt-2 text-xs text-gold">Не удалось сохранить подписку.</p>}
    </section>
  );
}
