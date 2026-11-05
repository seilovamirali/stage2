export interface BookProgress {
  user_id: string;
  book_title: string;
  total_pages: number;
  current_page: number;
  day_start_date: string;
  day_start_page: number;
  updated_at: string;
}

export function clampTotalPages(total: number): number {
  if (!Number.isFinite(total)) return 1;
  return Math.max(1, Math.min(20000, Math.trunc(total)));
}

export function clampPage(page: number, totalPages: number): number {
  const total = clampTotalPages(totalPages);
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.min(total, Math.trunc(page)));
}

export function bookPercent(page: number, totalPages: number): number {
  const total = clampTotalPages(totalPages);
  return Math.round((clampPage(page, total) / total) * 100);
}

export function pagePhrase(page: number): string {
  return `Я на странице ${clampPage(page, Number.MAX_SAFE_INTEGER)}`;
}

export function pagesReadToday(progress: BookProgress | undefined, today: string): number {
  return progress?.day_start_date === today ? Math.max(0, progress.current_page - progress.day_start_page) : 0;
}

export function shouldRemindBookTask(pages: number): boolean {
  return pages >= 10;
}

export function groupBookStats(rows: readonly BookProgress[]) {
  if (!rows.length) return { readers: 0, percent: 0 };
  const percent = Math.round(rows.reduce((sum, row) => sum + bookPercent(row.current_page, row.total_pages), 0) / rows.length);
  return { readers: rows.length, percent };
}

export function rankReaders<T extends { id: string; display_name: string; avatar_emoji?: string }>(
  profiles: readonly T[],
  rows: readonly BookProgress[],
) {
  const byUser = new Map(rows.map((row) => [row.user_id, row]));
  return profiles.map((profile) => {
    const row = byUser.get(profile.id);
    const total = row?.total_pages ?? 0;
    const page = row?.current_page ?? 0;
    return {
      ...profile,
      book_title: row?.book_title ?? "",
      total_pages: total,
      page,
      percent: row ? bookPercent(page, total || 1) : 0,
      hasBook: !!row,
    };
  }).sort((a, b) => b.percent - a.percent || b.page - a.page || a.display_name.localeCompare(b.display_name, "ru") || a.id.localeCompare(b.id));
}
