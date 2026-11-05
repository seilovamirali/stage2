import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { meQuery, useGroup, useHabits, useToday } from "@/hooks/use-habits";
import { Bar } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { CompoundChart } from "@/components/Atomic";
import { RaceTrack, type Racer } from "@/components/Race";
import { compoundSeries } from "@/lib/atomic";
import {
  ALL_TASKS, activeDaily, completionPct, computePoints, currentStreak, diffDays, formatRuDate, periodRange, weekStart, type Period,
} from "@/lib/habits";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

const RACE_PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Сегодня" },
  { key: "week", label: "Неделя" },
];
const MORE_PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "Месяц" },
  { key: "all", label: "Всё время" },
];
const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  const { data: me } = useQuery(meQuery);
  const group = useGroup();
  const { data, isLoading } = group;
  const habitsQ = useHabits();
  const today = useToday();
  const tasks = habitsQ.data ?? ALL_TASKS;
  const dailyTasks = activeDaily(tasks);
  const [period, setPeriod] = useState<Period>("week");

  const rows = useMemo(() => {
    if (!data) return [];
    const dailyKeys = new Set(dailyTasks.map((task) => task.key));
    return data.profiles
      .map((p) => {
        const list = data.completions.filter((c) => c.user_id === p.id);
        const first = list[0]?.completed_on ?? p.created_at.slice(0, 10);
        const [from, to] = periodRange(period, today, first);
        const todayDone = new Set(list.filter((c) => c.completed_on === today && dailyKeys.has(c.task_key)).map((c) => c.task_key));
        const weekFrom = weekStart(today);
        const weekDone = list.filter((c) => c.completed_on >= weekFrom && c.completed_on <= today && dailyKeys.has(c.task_key)).length;
        const weekDays = diffDays(today, weekFrom) + 1;
        return {
          ...p,
          points: computePoints(list, from, to, tasks),
          pct: completionPct(list, from, to, tasks),
          weekPct: completionPct(list, weekFrom, today, tasks),
          weekDone,
          weekDays,
          streak: currentStreak(list, today, tasks),
          todayDone,
        };
      })
      .sort((a, b) => b.pct - a.pct || b.points - a.points || a.display_name.localeCompare(b.display_name, "ru"));
  }, [dailyTasks, data, period, tasks, today]);

  return (
    <div className="px-4 pt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Stage 2</p>
      <h1 className="font-display mt-2 text-3xl font-bold">Трасса</h1>
      <p className="mt-1 text-sm text-muted-foreground">Место на треке — процент выполнения. Финиш справа.</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {RACE_PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`h-11 rounded-full text-sm font-semibold transition-all ${period === p.key ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {MORE_PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`h-9 flex-1 text-xs font-semibold ${period === p.key ? "text-foreground underline decoration-gold decoration-2 underline-offset-4" : "text-muted-foreground"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {group.isError ? (
        <Button variant="outline" className="mt-6 w-full" onClick={() => group.refetch()}>Не удалось загрузить. Повторить</Button>
      ) : isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Загрузка…</p>
      ) : (
        <>
          <div className="mt-6">
            <RaceTrack
              motionKey={period}
              racers={rows.map((racer): Racer => ({
                id: racer.id,
                name: racer.display_name,
                emoji: racer.avatar_emoji,
                pct: racer.pct,
                points: racer.points,
                isMe: racer.id === me?.id,
              }))}
            />
          </div>

          <h2 className="font-display mb-3 mt-8 text-xl font-bold">1% лучше</h2>
          <ul className="space-y-2">
            {rows.map((r, i) => {
              const isMe = r.id === me?.id;
              return (
                <li key={r.id} className={`flex items-center gap-3 rounded-2xl border p-3 shadow-card ${isMe ? "border-gold bg-gold-soft" : "bg-card"}`}>
                  <span className="w-7 text-center text-lg font-bold text-muted-foreground">{MEDALS[i] ?? i + 1}</span>
                  <span className="text-2xl">{r.avatar_emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {r.display_name} {isMe && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">Вы</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.pct}% · серия {r.streak}</p>
                    <Bar value={r.pct} className="mt-1.5" />
                    <div className="mt-2">
                      <CompoundChart compact points={compoundSeries((data?.completions ?? []).filter((row) => row.user_id === r.id), today, tasks)} />
                    </div>
                  </div>
                  <span className="font-display text-lg font-bold text-primary">{r.points}</span>
                </li>
              );
            })}
          </ul>

          <h2 className="font-display mb-1 mt-8 text-xl font-bold">Эта неделя</h2>
          <p className="mb-3 text-sm text-muted-foreground">С {formatRuDate(weekStart(today))} · ежедневные отметки и процент недели</p>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={`week-${r.id}`} className="rounded-2xl border bg-card p-3 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.avatar_emoji}</span>
                  <span className="flex-1 truncate font-medium">{r.display_name}</span>
                  <span className="text-sm font-bold">{r.weekPct}%</span>
                </div>
                <Bar value={r.weekPct} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">{r.weekDone} ежедневных отметок за {r.weekDays} дн.</p>
              </li>
            ))}
          </ul>

          <h2 className="font-display mb-3 mt-8 text-xl font-bold">Сегодня в группе</h2>
          <ul className="space-y-2 pb-4">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-card p-3 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.avatar_emoji}</span>
                  <span className="flex-1 truncate font-medium">{r.display_name}</span>
                  <span className="text-sm font-bold">{r.todayDone.size}/{dailyTasks.length}</span>
                </div>
                <Bar value={dailyTasks.length === 0 ? 0 : (r.todayDone.size / dailyTasks.length) * 100} className="mt-2" />
                <div className="mt-2 flex flex-wrap gap-1">
                  {dailyTasks.map((t) => (
                    <span key={t.key} title={t.title}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${r.todayDone.has(t.key) ? "bg-done" : "bg-muted opacity-40 grayscale"}`}>
                      {t.emoji}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
