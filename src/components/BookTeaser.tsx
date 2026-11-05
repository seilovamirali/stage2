import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookProgress } from "@/hooks/use-book";
import { bookPercent, pagePhrase } from "@/lib/book";

export function BookTeaser({ userId }: { userId: string | undefined }) {
  const { data } = useBookProgress();
  const mine = data?.find((row) => row.user_id === userId);
  const title = mine?.book_title?.trim() || "Укажите свою книгу";
  const page = mine?.current_page ?? 0;
  return (
    <section className="flex items-center gap-4 border border-border bg-card p-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-2xl" aria-hidden>📚</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-bold">Моя книга</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold text-primary">
          {mine ? pagePhrase(page) : "Я на странице …"}
          {mine ? <span className="font-bold"> · {bookPercent(page, mine.total_pages)}%</span> : null}
        </p>
        <Button asChild variant="link" className="mt-1 h-10 px-0"><Link to="/book">К книге <ArrowRight /></Link></Button>
      </div>
    </section>
  );
}
