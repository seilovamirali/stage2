import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProgressRing, Bar } from "@/components/ProgressRing";
import { Confetti } from "@/components/Confetti";
import { BookTeaser } from "@/components/BookTeaser";
import { ChainGrid, CheckOrb, CompoundChart, FourLawsCard, HabitDots, IdentityField } from "@/components/Atomic";
import { MyRaceCard } from "@/components/Race";
import { meQuery, useGroup, useHabits, useToday, useToggleTask, useUserHabits, type MarkAction } from "@/hooks/use-habits";
import { useBookProgress } from "@/hooks/use-book";
import {
  activeDaily, activeWeekly, computePoints, currentStreak, formatRuDate,
  levelInfo, markTimes, weekStart, type TaskDef,
} from "@/lib/habits";
import { pagePhrase } from "@/lib/book";
import {
  compoundSeries, dayChain, daysLeftPhrase, habitChain, lawForDate, missedYesterday, monthRace, monthTitle, monthWindow, upgradePhrase,
} from "@/lib/atomic";

export const Route = createFileRoute("/_authenticated/today")({
  component: TodayPage,
});

function TodayPage() {
  const { data: me } = useQuery(meQuery);
  const group = useGroup();
  const { data, isLoading } = group;
  const habitsQ = useHabits();
  const everyone = useUserHabits();
  const books = useBookProgress();
  const today = useToday();
  const toggle = useToggleTask(me?.id);
  const tasks = habitsQ.data ?? [];
  const dailyTasks = activeDaily(tasks);
  const weeklyTasks = activeWeekly(tasks);
  const dailyCount = dailyTasks.length;

  const mine = useMemo(() => (data?.completions ?? []).filter((c) => c.user_id === me?.id), [data, me]);
  const profile = data?.profiles.find((p) => p.id === me?.id);
  const myBook = books.data?.find((row) => row.user_id === me?.id);
  const timesToday = (key: string) => {
    const row = mine.find((item) => item.task_key === key && item.completed_on === today);
    return row ? markTimes(row) : 0;
  };
  const todaySet = new Set(mine.filter((c) => c.completed_on === today && markTimes(c) >= 1).map((c) => c.task_key));
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
        const own = (everyone.data ?? []).filter((habit) => habit.userId === person.id);
        const plan = own.length ? own : [];
        const result = monthRace(list, plan, month.start, month.end, today, person.created_at);
        return { id: person.id, position: result.positionDays, pace: result.pace.pct, points: computePoints(list, month.start, today, plan) };
      })
      .sort((a, b) => b.position - a.position || b.pace - a.pace || b.points - a.points);
  }, [data, everyone.data, month.end, month.start, today]);
  const place = Math.max(1, standings.findIndex((row) => row.id === me?.id) + 1);
  const leader = standings[0]?.id === me?.id && standings.length > 0;
  const showMiss = missedYesterday(mine, today, tasks, profile?.created_at) && doneDaily < dailyCount;
  const curve = useMemo(() => compoundSeries(mine, today, tasks), [mine, tasks, today]);
  const chain = useMemo(() => dayChain(mine, today, tasks), [mine, tasks, today]);

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

  const onToggle = (task: TaskDef, action: MarkAction) => {
    if (action === "mark" || action === "double") {
      setBurstKey(task.key);
      window.setTimeout(() => setBurstKey((current) => current === task.key ? null : current), 700);
    }
    toggle.mutate({ key: task.key, action });
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
        <Button asChild variant="outline" className="w-full">
          <Link to="/manage">Настроить мои привычки</Link>
        </Button>

        {showMiss && (
          <section className="border border-gold bg-gold-soft px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Не пропускай дважды</p>
            <p className="mt-1 text-sm leading-relaxed">Вчера был пропуск. Сегодня достаточно одного маленького шага, чтобы цепочка жила дальше.</p>
          </section>
        )}

        <FourLawsCard law={lawForDate(today)} />

        <CompoundChart points={curve} />
        <ChainGrid dots={chain} />

        {dailyCount > 0 && doneDaily === dailyCount && (
          <div className="animate-pop border border-gold bg-gold px-4 py-3 text-center text-sm font-semibold text-gold-foreground">
            Все задания на сегодня выполнены
          </div>
        )}

        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Сегодня</h2>
          <div className="space-y-3">
            {dailyTasks.length === 0 && <p className="text-sm text-muted-foreground">Нет ежедневных привычек. Настройте свой список — у других участников он не изменится.</p>}
            {dailyTasks.map((task, index) => (
              <HabitCard
                key={task.key}
                task={task}
                times={timesToday(task.key)}
                burst={burstKey === task.key}
                index={index}
                userId={me?.id}
                dots={habitChain(mine, task.key, today)}
                pageLabel={task.key === "reading" ? (myBook ? pagePhrase(myBook.current_page) : "Укажите свою страницу") : undefined}
                disabled={isLoading || !me || toggle.isPending}
                highlightDouble={race.debt > 0}
                onAction={(action) => onToggle(task, action)}
              />
            ))}
          </div>
        </section>

        {weeklyTasks.length > 0 && (
          <section>
            <h2 className="font-display mb-3 text-xl font-bold">На этой неделе</h2>
            <div className="space-y-3">
              {weeklyTasks.map((task) => {
                const weekCount = mine.filter((c) => c.task_key === task.key && c.completed_on >= ws && c.completed_on <= today).reduce((sum, row) => sum + markTimes(row), 0);
                const times = timesToday(task.key);
                const full = weekCount >= task.target;
                return (
                  <div key={task.key} className={`border p-4 ${full ? "border-gold bg-gold-soft" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <CheckOrb done={times > 0 || full} burst={burstKey === task.key} />
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
                    <MarkButtons times={times} full={full} disabled={isLoading || !me || toggle.isPending} highlightDouble={race.debt > 0} onAction={(action) => onToggle(task, action)} />
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

function HabitCard({ task, times, burst, index, userId, dots, pageLabel, disabled, highlightDouble, onAction }: {
  task: TaskDef;
  times: number;
  burst: boolean;
  index: number;
  userId: string | undefined;
  dots: { date: string; on: boolean }[];
  pageLabel: string | undefined;
  disabled: boolean;
  highlightDouble: boolean;
  onAction: (action: MarkAction) => void;
}) {
  return (
    <article
      className={`animate-fade-up border p-4 ${times > 0 ? "border-gold bg-gold-soft/70" : "border-border bg-card"}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <CheckOrb done={times > 0} burst={burst} />
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
        <MarkButtons times={times} full={false} disabled={disabled} highlightDouble={highlightDouble} onAction={onAction} />
      </div>
    </article>
  );
}

function MarkButtons({ times, full, disabled, highlightDouble, onAction }: {
  times: number;
  full: boolean;
  disabled: boolean;
  highlightDouble: boolean;
  onAction: (action: MarkAction) => void;
}) {
  if (times >= 2) {
    return <Button variant="undo" size="xl" className="w-full" disabled={disabled} onClick={() => onAction("undo-double")}>Убрать x2</Button>;
  }
  if (times === 1) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="undo" size="xl" disabled={disabled} onClick={() => onAction("clear")}>Отменить</Button>
        <Button variant={highlightDouble ? "gold" : "hero"} size="xl" disabled={disabled} onClick={() => onAction("double")}>Сделать x2</Button>
      </div>
    );
  }
  return (
    <Button variant={full ? "undo" : "hero"} size="xl" className="w-full" disabled={disabled || full} onClick={() => onAction("mark")}>
      {full ? "Цель недели достигнута" : "Выполнено"}
    </Button>
  );
}
