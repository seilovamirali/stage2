import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProgressRing, Bar } from "@/components/ProgressRing";
import { Confetti } from "@/components/Confetti";
import { BookTeaser } from "@/components/BookTeaser";
import { CheckOrb, FourLawsCard, HabitDots, IdentityField } from "@/components/Atomic";
import { DayCountdown } from "@/components/DayCountdown";
import { MotivationCard } from "@/components/MotivationCard";
import { PushOptIn } from "@/components/PushOptIn";
import { MyRaceCard, VehicleLegend } from "@/components/Race";
import { meQuery, useGroup, useHabits, useToday, useToggleTask } from "@/hooks/use-habits";
import { useBookProgress } from "@/hooks/use-book";
import {
  ALL_TASKS, activeDaily, activeWeekly, computePoints, currentStreak, formatRuDate,
  levelInfo, weekStart, type TaskDef,
} from "@/lib/habits";
import { pagePhrase } from "@/lib/book";
import {
  daysLeftPhrase, habitChain, lawForDate, monthRace, monthTitle, monthWindow, upgradePhrase,
} from "@/lib/atomic";

export const Route = createFileRoute("/_authenticated/today")({
  component: TodayPage,
});

function TodayPage() {
  const { data: me } = useQuery(meQuery);
  const group = useGroup();
  const { data, isLoading } = group;
  const habitsQ = useHabits();
  const books = useBookProgress();
  const today = useToday();
  const toggle = useToggleTask(me?.id);
  const tasks = habitsQ.data ?? ALL_TASKS;
  const dailyTasks = activeDaily(tasks);
  const weeklyTasks = activeWeekly(tasks);
  const dailyCount = dailyTasks.length;

  const mine = useMemo(() => (data?.completions ?? []).filter((c) => c.user_id === me?.id), [data, me]);
  const profile = data?.profiles.find((p) => p.id === me?.id);
  const myBook = books.data?.find((row) => row.user_id === me?.id);
  const todaySet = new Set(mine.filter((c) => c.completed_on === today).map((c) => c.task_key));
  const doneDaily = dailyTasks.filter((t) => todaySet.has(t.key)).length;
  const pct = dailyCount === 0 ? 0 : Math.round((doneDaily / dailyCount) * 100);
  const points = computePoints(mine, "0000-01-01", "9999-12-31", tasks);
  const lvl = levelInfo(points);
  const streak = currentStreak(mine, today, tasks);
  const ws = weekStart(today);
  const month = monthWindow(today);
  const race = useMemo(() => monthRace(mine, tasks, month.start, month.end, today, profile?.created_at), [mine, month.end, month.start, profile?.created_at, tasks, today]);
  const monthPoints = computePoints(mine, month.start, today, tasks);
  const standings = useMemo(() => {
    const profiles = data?.profiles ?? [];
    return profiles
      .map((person) => {
        const list = (data?.completions ?? []).filter((row) => row.user_id === person.id);
        const result = monthRace(list, tasks, month.start, month.end, today, person.created_at);
        return { id: person.id, pace: result.pace.pct, points: computePoints(list, month.start, today, tasks) };
      })
      .sort((a, b) => b.points - a.points || b.pace - a.pace);
  }, [data, month.end, month.start, tasks, today]);
  const place = Math.max(1, standings.findIndex((row) => row.id === me?.id) + 1);
  const leader = standings[0]?.id === me?.id && standings.length > 0;
  const [celebrate, setCelebrate] = useState(false);
  const [burstKey, setBurstKey] = useState<string | null>(null);
  const prevDone = useRef<number | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const prev = prevDone.current;
    prevDone.current = doneDaily;
    if (prev !== null && dailyCount > 0 && prev < dailyCount && doneDaily === dailyCount) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2800);
    }
  }, [dailyCount, doneDaily, isLoading]);

  const onToggle = (task: TaskDef, done: boolean) => {
    if (!done) {
      setBurstKey(task.key);
      window.setTimeout(() => setBurstKey((current) => current === task.key ? null : current), 700);
    }
    toggle.mutate({ key: task.key, done });
  };

  return (
    <div className="px-5 pb-8 pt-8">
      {celebrate && <Confetti />}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Stage 2</p>
        <p className="mt-3 text-sm capitalize text-muted-foreground">{formatRuDate(today)}</p>
        <h1 className="font-display mt-1 text-3xl font-bold leading-tight">
          Привет, {profile?.display_name ?? "…"}
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <ProgressRing value={pct} size={104} stroke={8} label={`${doneDaily}/${dailyCount}`} />
          <div className="flex-1 space-y-2">
            <Stat label="Серия" value={String(streak)} />
            <Stat label="Очки" value={String(points)} />
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ур. {lvl.level} · {lvl.title}</span>
                <span>{points}/{lvl.nextMin}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${lvl.progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 space-y-8">
        {(group.isError || habitsQ.isError) && (
          <Button variant="outline" className="w-full" onClick={() => { void group.refetch(); void habitsQ.refetch(); }}>
            Не удалось загрузить. Повторить
          </Button>
        )}

        <MyRaceCard
          month={monthTitle(month.start)}
          daysLeftText={daysLeftPhrase(race.daysLeft, false)}
          pace={race.pace.pct}
          position={race.positionPct}
          positionDays={race.positionDays}
          daysInMonth={race.daysInMonth}
          debt={race.debt}
          doubled={race.doubledToday}
          planned={race.plannedToday}
          points={monthPoints}
          place={data ? place : 1}
          total={Math.max(1, standings.length)}
          phrase={upgradePhrase(race.pace.done, race.pace.denom)}
          leader={leader}
        />
        <VehicleLegend />

        <DayCountdown />
        <MotivationCard today={today} />
        <PushOptIn userId={me?.id} />
        <FourLawsCard law={lawForDate(today)} />

        {dailyCount > 0 && doneDaily === dailyCount && (
          <div className="animate-pop border border-gold bg-gold px-4 py-3 text-center text-sm font-semibold text-gold-foreground">
            Все задания на сегодня выполнены
          </div>
        )}

        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Сегодня</h2>
          <div className="space-y-3">
            {dailyTasks.map((task, index) => (
              <HabitCard
                key={task.key}
                task={task}
                done={todaySet.has(task.key)}
                burst={burstKey === task.key}
                index={index}
                userId={me?.id}
                dots={habitChain(mine, task.key, today)}
                pageLabel={task.key === "book" ? (myBook ? pagePhrase(myBook.current_page) : "Укажите свою страницу") : undefined}
                disabled={isLoading || !me || toggle.isPending}
                onToggle={() => onToggle(task, todaySet.has(task.key))}
              />
            ))}
          </div>
        </section>

        {weeklyTasks.length > 0 && (
          <section>
            <h2 className="font-display mb-3 text-xl font-bold">На этой неделе</h2>
            <div className="space-y-3">
              {weeklyTasks.map((task) => {
                const weekCount = mine.filter((c) => c.task_key === task.key && c.completed_on >= ws && c.completed_on <= today).length;
                const doneToday = todaySet.has(task.key);
                const full = weekCount >= task.target;
                return (
                  <div key={task.key} className={`border p-4 ${full ? "border-gold bg-gold-soft" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <CheckOrb done={doneToday || full} burst={burstKey === task.key} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <span className="text-sm font-bold">{weekCount}/{task.target}</span>
                        </div>
                        <IdentityField userId={me?.id} habitKey={task.key} habitTitle={task.title} />
                        <p className="text-sm text-muted-foreground">{task.description} · +{task.points}</p>
                      </div>
                    </div>
                    <Bar value={(weekCount / task.target) * 100} className="mt-3" />
                    {doneToday ? (
                      <Button variant="undo" size="xl" className="mt-3 w-full" disabled={toggle.isPending} onClick={() => onToggle(task, true)}>Отменить</Button>
                    ) : (
                      <Button variant={full ? "undo" : "hero"} size="xl" className="mt-3 w-full" disabled={full || isLoading || !me} onClick={() => onToggle(task, false)}>
                        {full ? "Цель недели достигнута" : "Выполнено · +1"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
        <BookTeaser userId={me?.id} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-border px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function HabitCard({ task, done, burst, index, userId, dots, pageLabel, disabled, onToggle }: {
  task: TaskDef;
  done: boolean;
  burst: boolean;
  index: number;
  userId: string | undefined;
  dots: { date: string; on: boolean }[];
  pageLabel: string | undefined;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`animate-fade-up border p-4 ${done ? "border-gold bg-gold-soft/70" : "border-border bg-card"}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <CheckOrb done={done} burst={burst} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{task.emoji} {task.title}</h3>
          <IdentityField userId={userId} habitKey={task.key} habitTitle={task.title} />
          <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
          {pageLabel && <p className="mt-1 text-sm font-medium">{pageLabel}</p>}
          <div className="mt-3"><HabitDots dots={dots} /></div>
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${pageLabel ? "grid-cols-2" : "grid-cols-1"}`}>
        {pageLabel && (
          <Button asChild variant="outline" size="xl" className="px-2">
            <Link to="/book">Моя книга</Link>
          </Button>
        )}
        <Button variant={done ? "undo" : "hero"} size="xl" disabled={disabled} onClick={onToggle}>
          {done ? "Отменить" : "Выполнено · +1"}
        </Button>
      </div>
    </article>
  );
}
