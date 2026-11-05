import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProgressRing, Bar } from "@/components/ProgressRing";
import { Confetti } from "@/components/Confetti";
import { BookTeaser } from "@/components/BookTeaser";
import { meQuery, useGroup, useHabits, useToday, useToggleTask } from "@/hooks/use-habits";
import { useBookProgress } from "@/hooks/use-book";
import {
  ALL_TASKS, activeDaily, activeWeekly, computePoints, currentStreak, formatRuDate,
  levelInfo, weekStart, type TaskDef,
} from "@/lib/habits";
import { pagePhrase } from "@/lib/book";

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

  const [celebrate, setCelebrate] = useState(false);
  const prevDone = useRef<number | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const prev = prevDone.current;
    prevDone.current = doneDaily;
    if (prev !== null && dailyCount > 0 && prev < dailyCount && doneDaily === dailyCount) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3500);
    }
  }, [dailyCount, doneDaily, isLoading]);

  const onToggle = (t: TaskDef, done: boolean) => toggle.mutate({ key: t.key, done });

  return (
    <div>
      {celebrate && <Confetti />}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-gradient-hero px-5 pb-6 pt-8 text-primary-foreground">
        <div className="bg-pattern absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="text-sm capitalize opacity-80">{formatRuDate(today)}</p>
          <h1 className="font-display mt-1 text-2xl font-bold leading-tight">
            Привет, {profile?.display_name ?? "…"}!
          </h1>
          <p className="mt-1 text-sm opacity-80">Stage 2 · книга и спорт</p>
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing value={pct} label={`${doneDaily}/${dailyCount}`} />
            <div className="flex-1 space-y-2.5">
              <Stat label="Серия" value={`🔥 ${streak}`} />
              <Stat label="Очки" value={`✨ ${points}`} />
              <div>
                <div className="flex justify-between text-xs opacity-90">
                  <span>Ур. {lvl.level} · {lvl.title}</span>
                  <span>{points}/{lvl.nextMin}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                  <div className="h-full rounded-full bg-gradient-gold transition-all duration-700" style={{ width: `${lvl.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-4 pt-5">
        {(group.isError || habitsQ.isError) && (
          <Button variant="outline" className="w-full" onClick={() => { void group.refetch(); void habitsQ.refetch(); }}>
            Не удалось загрузить. Повторить
          </Button>
        )}

        {dailyCount > 0 && doneDaily === dailyCount && (
          <div className="animate-pop rounded-2xl bg-gradient-gold p-4 text-center font-semibold text-gold-foreground shadow-gold">
            Все задания на сегодня выполнены!
          </div>
        )}

        <section>
          <h2 className="font-display mb-3 text-xl font-bold">Ежедневные задания</h2>
          <div className="space-y-3">
            {dailyTasks.map((t, i) => {
              const done = todaySet.has(t.key);
              if (t.key === "reading") {
                return (
                  <ReadingTaskCard
                    key={t.key}
                    task={t}
                    done={done}
                    index={i}
                    pageLabel={myBook ? pagePhrase(myBook.current_page) : "Укажите свою страницу"}
                    disabled={isLoading || !me}
                    onClick={() => onToggle(t, done)}
                  />
                );
              }
              return (
                <TaskCard key={t.key} task={t} done={done} index={i} disabled={isLoading || !me}
                  onClick={() => onToggle(t, done)} />
              );
            })}
          </div>
        </section>

        {weeklyTasks.length > 0 && (
          <section>
            <h2 className="font-display mb-3 text-xl font-bold">На этой неделе</h2>
            <div className="space-y-3">
              {weeklyTasks.map((t) => {
                const weekCount = mine.filter((c) => c.task_key === t.key && c.completed_on >= ws && c.completed_on <= today).length;
                const doneToday = todaySet.has(t.key);
                const full = weekCount >= t.target;
                return (
                  <div key={t.key} className={`rounded-2xl border p-4 shadow-card transition-all ${full ? "border-gold/60 bg-gradient-done" : "bg-card"}`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-2xl">{t.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-semibold">{t.title}</h3>
                          <span className="text-sm font-bold text-primary">{weekCount}/{t.target}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.description} · +{t.points}</p>
                      </div>
                    </div>
                    <Bar value={(weekCount / t.target) * 100} className="mt-3" />
                    <div className="mt-3">
                      {doneToday ? (
                        <Button variant="undo" size="xl" className="w-full" onClick={() => onToggle(t, true)}>Отменить</Button>
                      ) : (
                        <Button variant={full ? "undo" : "hero"} size="xl" className="w-full" disabled={full || isLoading}
                          onClick={() => onToggle(t, false)}>
                          {full ? "Цель недели достигнута ✓" : "Выполнено"}
                        </Button>
                      )}
                    </div>
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
    <div className="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-3 py-1.5">
      <span className="text-xs opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ReadingTaskCard({ task, done, index, pageLabel, disabled, onClick }: {
  task: TaskDef;
  done: boolean;
  index: number;
  pageLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`animate-fade-up rounded-2xl border p-3.5 shadow-card transition-all duration-300 ${done ? "border-gold/60 bg-gradient-done" : "bg-card"}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${done ? "bg-primary" : "bg-secondary"}`}>
          {done ? <span className="animate-pop text-xl font-bold text-primary-foreground">✓</span> : task.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold ${done ? "text-primary" : ""}`}>{task.title}</h3>
          <p className="text-sm leading-snug text-muted-foreground">{task.description}</p>
          <p className="text-sm font-semibold text-primary">{pageLabel}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button asChild variant="gold" size="xl" className="px-2">
          <Link to="/book">Моя книга</Link>
        </Button>
        {done ? (
          <Button variant="undo" size="xl" className="px-2" onClick={onClick} disabled={disabled}>Отменить</Button>
        ) : (
          <Button variant="hero" size="xl" className="px-2" onClick={onClick} disabled={disabled}>Выполнено</Button>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, done, index, disabled, onClick }: { task: TaskDef; done: boolean; index: number; disabled: boolean; onClick: () => void }) {
  return (
    <div
      className={`animate-fade-up flex items-center gap-3 rounded-2xl border p-3.5 shadow-card transition-all duration-300 ${done ? "border-gold/60 bg-gradient-done" : "bg-card"}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${done ? "bg-primary" : "bg-secondary"}`}>
        {done ? <span className="animate-pop text-xl font-bold text-primary-foreground">✓</span> : task.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className={`font-semibold ${done ? "text-primary" : ""}`}>{task.title}</h3>
        <p className="text-sm leading-snug text-muted-foreground">{task.description}</p>
      </div>
      {done ? (
        <Button variant="undo" size="xl" className="px-4" onClick={onClick} disabled={disabled}>Отменить</Button>
      ) : (
        <Button variant="hero" size="xl" className="px-4" onClick={onClick} disabled={disabled}>Выполнено</Button>
      )}
    </div>
  );
}
