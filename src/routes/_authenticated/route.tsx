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
  { to: "/today", label: "Сегодня", icon: "☀️" },
  { to: "/leaderboard", label: "Рейтинг", icon: "🏆" },
  { to: "/book", label: "Книга", icon: "📚" },
  { to: "/profile", label: "Профиль", icon: "👤" },
] as const;

function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-col items-center gap-0.5 px-0.5 py-2 text-[11px] font-medium leading-tight text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-10 items-center justify-center rounded-full text-lg transition-all ${isActive ? "bg-secondary scale-105" : ""}`}>
                    {t.icon}
                  </span>
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
