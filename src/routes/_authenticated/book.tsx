import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bar } from "@/components/ProgressRing";
import { meQuery, useGroup, useToday } from "@/hooks/use-habits";
import { useBookProgress, useSaveBookProgress } from "@/hooks/use-book";
import { bookPercent, clampPage, clampTotalPages, pagePhrase, pagesReadToday, shouldRemindBookTask, groupBookStats, rankReaders } from "@/lib/book";

export const Route = createFileRoute("/_authenticated/book")({
  component: BookPage,
});

function BookPage() {
  const { data: me } = useQuery(meQuery);
  const group = useGroup();
  const progress = useBookProgress();
  const save = useSaveBookProgress(me?.id);
  const today = useToday();
  const mine = progress.data?.find((row) => row.user_id === me?.id);
  const [title, setTitle] = useState<string | null>(null);
  const [totalDraft, setTotalDraft] = useState<string | null>(null);
  const [pageDraft, setPageDraft] = useState<string | null>(null);
  const titleValue = title ?? mine?.book_title ?? "";
  const totalValue = totalDraft ?? (mine ? String(mine.total_pages) : "");
  const pageValue = pageDraft ?? (mine ? String(mine.current_page) : "0");
  const total = clampTotalPages(Number(totalValue || mine?.total_pages || 1));
  const readToday = pagesReadToday(mine, today);
  const stats = groupBookStats(progress.data ?? []);
  const ranked = rankReaders(group.data?.profiles ?? [], progress.data ?? []);
  const busy = progress.isLoading || save.isPending || !me;

  return (
    <div>
      <header className="px-5 pb-2 pt-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Stage 2</p>
          <h1 className="font-display mt-2 text-3xl font-bold">Книга</h1>
          <p className="mt-2 text-sm text-muted-foreground">У каждого своя книга. Отметьте, где вы остановились.</p>
          {mine && (
            <p className="mt-4 text-lg font-semibold">{pagePhrase(mine.current_page)}</p>
          )}
        </div>
      </header>

      <div className="space-y-7 px-4 pt-6">
        <section aria-labelledby="my-book-progress">
          <h2 id="my-book-progress" className="font-display text-xl font-bold">Мой прогресс</h2>
          {progress.isError ? <div className="mt-3 text-sm"><p>Не удалось загрузить прогресс чтения.</p><Button variant="outline" className="mt-2" onClick={() => progress.refetch()}><RefreshCw /> Повторить</Button></div> : (
            <form className="mt-4 space-y-3" onSubmit={(event) => {
              event.preventDefault();
              const nextTotal = clampTotalPages(Number(totalValue));
              const nextPage = clampPage(Number(pageValue), nextTotal);
              if (!titleValue.trim()) return;
              setTotalDraft(String(nextTotal));
              setPageDraft(String(nextPage));
              save.mutate(
                { title: titleValue.trim(), totalPages: nextTotal, page: nextPage },
                { onSuccess: () => { setTitle(null); setTotalDraft(null); setPageDraft(null); } },
              );
            }}>
              <label htmlFor="book-title" className="text-sm font-medium">Название книги
                <Input id="book-title" value={titleValue} maxLength={120} required disabled={busy} className="mt-1 h-12 bg-card text-base"
                  onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label htmlFor="book-total" className="text-sm font-medium">Всего страниц
                <Input id="book-total" type="number" inputMode="numeric" min={1} max={20000} required disabled={busy} className="mt-1 h-12 bg-card text-base" value={totalValue}
                  onChange={(event) => setTotalDraft(event.target.value)} />
              </label>
              <label htmlFor="book-page" className="text-sm font-medium">Я на странице
                <Input id="book-page" type="number" inputMode="numeric" min={0} max={total} step={1} required disabled={busy} className="mt-1 h-12 bg-card text-base" value={pageValue}
                  onChange={(event) => setPageDraft(event.target.value)} />
              </label>
              <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy || !titleValue.trim()}><Save /> {save.isPending ? "Сохраняем…" : "Сохранить"}</Button>
            </form>
          )}
          {mine && (
            <>
              <p className="mt-4 text-base font-semibold text-primary">{pagePhrase(mine.current_page)}</p>
              <div className="mt-2 flex items-baseline justify-between"><span className="text-sm text-muted-foreground">{mine.current_page} / {mine.total_pages} стр.</span><span className="text-xl font-bold text-primary">{bookPercent(mine.current_page, mine.total_pages)}%</span></div>
              <Bar value={bookPercent(mine.current_page, mine.total_pages)} className="mt-2" />
              <p className="mt-3 text-sm font-semibold text-primary">Сегодня прочитано: {readToday} стр.</p>
              {shouldRemindBookTask(readToday) && (
                <div className="mt-3 rounded-xl bg-gold-soft p-3 text-sm leading-relaxed text-gold-foreground">
                  Вы прочитали 10+ страниц сегодня — не забудьте отметить «Книга» на странице «Сегодня»
                  <Button asChild variant="link" className="mt-1 h-10 px-0"><Link to="/today">Перейти к «Сегодня»</Link></Button>
                </div>
              )}
            </>
          )}
          <p className="mt-3 text-sm text-muted-foreground">Привычка «Книга» — 10 страниц или 30 минут аудиокниги. Аудиокнигу отмечайте на «Сегодня», даже если страница не сдвинулась.</p>
        </section>

        <section aria-labelledby="group-book-progress">
          <h2 id="group-book-progress" className="font-display text-xl font-bold">Книги группы</h2>
          <div className="mb-4 mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">Читателей: {stats.readers}</span><span className="font-bold text-primary">В среднем {stats.percent}%</span></div>
          {group.isError && <Button variant="outline" onClick={() => group.refetch()}><RefreshCw /> Обновить участников</Button>}
          <ol className="space-y-2">
            {ranked.map((reader, index) => {
              const isMe = reader.id === me?.id;
              return <li key={reader.id} className={`flex items-start gap-2.5 rounded-xl border p-3 ${isMe ? "border-gold/60 bg-gradient-done" : "bg-card"}`}>
                <span className="w-6 shrink-0 pt-1 text-center text-lg">{["🥇", "🥈", "🥉"][index] ?? index + 1}</span>
                <span className="shrink-0 pt-1 text-xl">{reader.avatar_emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{reader.display_name}{isMe && <span className="ml-2 text-xs text-primary">Вы</span>}</p>
                  <p className="mt-0.5 break-words text-sm">{reader.book_title.trim() || "Книга ещё не указана"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {reader.hasBook ? `${pagePhrase(reader.page)} · ${reader.page} / ${reader.total_pages} · ${reader.percent}%` : "Я на странице 0"}
                  </p>
                </div>
              </li>;
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
