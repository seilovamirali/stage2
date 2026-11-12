import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AtomMark } from "@/components/Atomic";
import { DAILY_TASKS } from "@/lib/habits";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/today", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-6 pb-16 pt-14">
        <AtomMark />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Stage 2</p>
        <h1 className="font-display mt-3 text-5xl font-bold leading-[1.05]">1% лучше каждый день</h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
          Книга и спорт. Маленькие повторения складываются в другого человека — и в гонку с друзьями.
        </p>
        <Button asChild variant="hero" size="xl" className="mt-8 w-full">
          <Link to="/auth">Присоединиться</Link>
        </Button>

        <ul className="mt-14 divide-y divide-border border-y border-border">
          {DAILY_TASKS.map((task) => (
            <li key={task.key} className="flex items-baseline justify-between gap-4 py-4">
              <span>
                <span className="font-semibold">{task.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{task.description}</span>
              </span>
              <span className="text-xl" aria-hidden>{task.emoji}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
          {["1% в день", "Цепочка", "Трасса"].map((item) => (
            <p key={item} className="border border-border px-2 py-3 text-center text-xs font-semibold">{item}</p>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">Список один для всей группы. Одно задание — одно очко.</p>
      </div>
    </div>
  );
}
