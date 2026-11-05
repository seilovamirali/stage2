import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const meta = data.user.user_metadata?.display_name;
    const { error } = await supabase.rpc("club_ensure_member", {
      p_display_name: typeof meta === "string" ? meta : null,
    });
    if (error) {
      const missing = error.code === "PGRST202" || /club_ensure_member|schema cache/i.test(error.message);
      throw new Error(missing ? "База Stage 2 ещё не настроена" : error.message);
    }
  },
  component: AppLayout,
});

const TABS = [
  { to: "/today", label: "Сегодня" },
  { to: "/leaderboard", label: "Рейтинг" },
  { to: "/book", label: "Книга" },
  { to: "/profile", label: "Профиль" },
] as const;

function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-col items-center gap-1 px-1 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {({ isActive }) => (
                <>
                  <span className={`size-1.5 rounded-full ${isActive ? "bg-gold" : "bg-transparent"}`} />
                  {t.label}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
