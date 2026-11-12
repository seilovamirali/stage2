import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { meQuery, useGroup, useHabits, useToday } from "@/hooks/use-habits";
import { Bar } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { CompoundChart } from "@/components/Atomic";
import { RaceHistory, RaceRules, RaceTrack, type Racer } from "@/components/Race";
import { compoundSeries, daysLeftPhrase, monthRace, monthTitle, monthWindow, shiftMonth } from "@/lib/atomic";
import { ALL_TASKS, activeDaily, computePoints, currentStreak } from "@/lib/habits";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data: me } = useQuery(meQuery);
  const group = useGroup();
  const { data, isLoading } = group;
  const habitsQ = useHabits();
  const tasks = habitsQ.data ?? ALL_TASKS;
  const today = useToday();
  const current = monthWindow(today);
  const [monthStartDate, setMonthStartDate] = useState(current.start);
  const month = monthWindow(monthStartDate);
  const past = today > month.end;
  const asOf = past ? month.end : today;

  const rows = useMemo(() => {
    if (!data) return [];
    return data.profiles
      .map((person) => {
        const list = data.completions.filter((row) => row.user_id === person.id);
        const race = monthRace(list, tasks, month.start, month.end, past ? month.end : today, person.created_at);
        const daily = activeDaily(tasks);
        const todayDone = new Set(list.filter((row) => row.completed_on === today && daily.some((task) => task.key === row.task_key)).map((row) => row.task_key));
        return {
          ...person,
          daily,
          race,
          points: computePoints(list, month.start, asOf, tasks),
          streak: currentStreak(list, today, tasks),
          todayDone,
          list,
        };
      })
      .sort((a, b) => b.points - a.points || b.race.pace.pct - a.race.pace.pct || a.display_name.localeCompare(b.display_name, "ru"));
  }, [asOf, data, month.end, month.start, past, tasks, today]);

  const winner = past ? rows[0] : undefined;
  const meRow = rows.find((row) => row.id === me?.id);

  return (
    <div className="space-y-6 px-4 pb-8 pt-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Stage 2</p>
        <h1 className="font-display mt-2 text-3xl font-bold">Трасса</h1>
        <p className="mt-1 text-sm text-muted-foreground">{monthTitle(month.start)}. {daysLeftPhrase(past ? 0 : monthRace([], [], month.start, month.end, today).daysLeft, past)}. Старт {month.start.slice(8)} · финиш {month.end.slice(8)}.</p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setMonthStartDate(shiftMonth(month.start, -1))}>Прошлый</Button>
        <p className="text-sm font-semibold">{monthTitle(month.start)}</p>
        <Button variant="outline" disabled={!past} onClick={() => setMonthStartDate(shiftMonth(month.start, 1))}>Дальше</Button>
      </div>

      {past && winner && (
        <p className="border border-gold bg-gold-soft px-3 py-2 text-sm font-semibold">Победитель: {winner.display_name} · {winner.race.positionDays} дн.</p>
      )}

      {group.isError || habitsQ.isError ? (
        <Button variant="outline" className="w-full" onClick={() => { void group.refetch(); void habitsQ.refetch(); }}>Не удалось загрузить. Повторить</Button>
      ) : isLoading || habitsQ.isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Загрузка…</p>
      ) : (
        <>
          <RaceTrack
            motionKey={month.start}
            racers={rows.map((racer): Racer => ({
              id: racer.id,
              name: racer.display_name,
              emoji: racer.avatar_emoji,
              pct: racer.race.pace.pct,
              position: racer.race.positionPct,
              points: racer.points,
              debt: racer.race.debt,
              isMe: racer.id === me?.id,
            }))}
          />
          {meRow && (
            <section>
              <h2 className="font-display mb-3 text-xl font-bold">История месяца</h2>
              <RaceHistory days={meRow.race.days} />
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {meRow.race.days.filter((day) => day.delta > 0).map((day) => (
                  <li key={day.date}>{day.date.slice(8)}.{month.start.slice(5, 7)} · {day.delta} оч.</li>
                ))}
              </ul>
            </section>
          )}
          <RaceRules />
          <section>
            <h2 className="font-display mb-3 text-xl font-bold">1% лучше</h2>
            <ul className="space-y-2">
              {rows.map((racer, index) => (
                <li key={racer.id} className={`rounded-2xl border p-3 ${racer.id === me?.id ? "border-gold bg-gold-soft" : "bg-card"}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-muted-foreground">{index + 1}</span>
                    <span className="text-2xl">{racer.avatar_emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{racer.display_name}</p>
                      <p className="text-xs text-muted-foreground">темп {racer.race.pace.pct}% · {racer.points} оч.</p>
                    </div>
                    <span className="font-display text-lg font-bold">{racer.points}</span>
                  </div>
                  <div className="mt-2">
                    <CompoundChart compact points={compoundSeries(racer.list, today, tasks)} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display mb-3 text-xl font-bold">Сегодня в группе</h2>
            <ul className="space-y-2">
              {rows.map((racer) => (
                <li key={`today-${racer.id}`} className="rounded-2xl border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{racer.avatar_emoji}</span>
                    <span className="flex-1 truncate font-medium">{racer.display_name}</span>
                    <span className="text-sm font-bold">{racer.todayDone.size}/{racer.daily.length}</span>
                  </div>
                  <Bar value={racer.daily.length === 0 ? 0 : (racer.todayDone.size / racer.daily.length) * 100} className="mt-2" />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {racer.daily.map((task) => (
                      <span key={task.key} title={task.title} className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${racer.todayDone.has(task.key) ? "bg-done" : "bg-muted opacity-40 grayscale"}`}>{task.emoji}</span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Серия {racer.streak}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
