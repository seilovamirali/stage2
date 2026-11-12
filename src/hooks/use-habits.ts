
import { useEffect, useState } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { almatyToday, type Completion, type TaskDef } from "@/lib/habits";

export interface UserHabit extends TaskDef {
  userId: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_emoji: string;
  created_at: string;
}

export interface GroupData {
  profiles: Profile[];
  completions: Completion[];
}

async function fetchAllCompletions(): Promise<Completion[]> {
  const out: Completion[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("club_completions")
      .select("id,user_id,task_key,completed_on,times")
      .order("completed_on", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}

export const groupQuery = queryOptions({
  queryKey: ["group"],
  queryFn: async (): Promise<GroupData> => {
    const [p, completions] = await Promise.all([
      supabase.from("club_profiles").select("id,display_name,avatar_emoji,created_at").order("created_at"),
      fetchAllCompletions(),
    ]);
    if (p.error) throw p.error;
    return { profiles: p.data ?? [], completions };
  },
  staleTime: 15_000,
  refetchOnWindowFocus: true,
  refetchInterval: 30_000,
});

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  staleTime: Infinity,
});

export function errorText(err: unknown): string {
  const raw = err instanceof Error
    ? err.message
    : err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : "";
  return raw.replace(/^P0001:\s*/, "");
}

function isKnownRule(message: string): boolean {
  return /Недельная|Можно|Отменить|привыч|Ключ|прогресс|имя|присоединиться/.test(message);
}

export function habitFromRow(row: {
  user_id: string;
  key: string;
  title: string;
  description: string;
  emoji: string;
  kind: string;
  weekly_target: number | null;
  points: number;
  sort_order: number;
  archived: boolean;
}): UserHabit {
  return {
    userId: row.user_id,
    key: row.key,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    kind: row.kind === "weekly" ? "weekly" : "daily",
    target: row.kind === "weekly" ? row.weekly_target ?? 1 : 1,
    points: row.points,
    sortOrder: row.sort_order,
    archived: row.archived,
  };
}

export function useUserHabits() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`user-habits-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "club_user_habits" }, () => {
        qc.invalidateQueries({ queryKey: ["user-habits"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
  return useQuery({
    queryKey: ["user-habits"],
    queryFn: async (): Promise<UserHabit[]> => {
      const { data, error } = await supabase.from("club_user_habits").select("user_id,key,title,description,emoji,kind,weekly_target,points,sort_order,archived").order("sort_order");
      if (error) throw error;
      return (data ?? []).map(habitFromRow);
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useHabits() {
  const me = useQuery(meQuery);
  const all = useUserHabits();
  const data = me.data?.id ? all.data?.filter((habit) => habit.userId === me.data?.id) : undefined;
  return { ...all, data, isLoading: me.isLoading || all.isLoading, isError: me.isError || all.isError };
}

export function useGroup() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`group-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "club_completions" }, () => {
        qc.invalidateQueries({ queryKey: ["group"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "club_profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["group"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
  return useQuery(groupQuery);
}

/** Today's Almaty date, refreshed every minute so midnight rollovers apply. */
export function useToday() {
  const [today, setToday] = useState(() => almatyToday());
  useEffect(() => {
    const id = setInterval(() => setToday(almatyToday()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

export type MarkAction = "mark" | "double" | "undo-double" | "clear";

export function useToggleTask(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, action }: { key: string; action: MarkAction }) => {
      if (!userId) throw new Error("no user");
      const today = almatyToday();
      if (action === "clear") {
        const { error } = await supabase.from("club_completions").delete().eq("user_id", userId).eq("task_key", key).eq("completed_on", today);
        if (error) throw error;
        return;
      }
      if (action === "mark") {
        const { error } = await supabase.from("club_completions").insert({ user_id: userId, task_key: key, completed_on: today, times: 1 });
        if (error) throw error;
        return;
      }
      const times = action === "double" ? 2 : 1;
      const { error } = await supabase.from("club_completions").update({ times }).eq("user_id", userId).eq("task_key", key).eq("completed_on", today);
      if (error) throw error;
    },
    onMutate: async ({ key, action }) => {
      await qc.cancelQueries({ queryKey: ["group"] });
      const prev = qc.getQueryData<GroupData>(["group"]);
      const today = almatyToday();
      if (prev && userId) {
        const rest = prev.completions.filter((c) => !(c.user_id === userId && c.task_key === key && c.completed_on === today));
        const times = action === "double" ? 2 : 1;
        qc.setQueryData<GroupData>(["group"], {
          ...prev,
          completions: action === "clear" ? rest : [...rest, { user_id: userId, task_key: key, completed_on: today, times }],
        });
      }
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["group"], ctx.prev);
      const msg = errorText(err);
      toast.error(isKnownRule(msg) ? msg : "Не удалось сохранить. Попробуйте ещё раз.");
    },
    onSuccess: (_d, { key, action }) => {
      const t = qc.getQueryData<UserHabit[]>(["user-habits"])?.find((task) => task.userId === userId && task.key === key);
      if (action === "clear") toast(t ? `${t.title}: отметка отменена` : "Отметка отменена");
      else if (action === "double") toast.success(t ? `${t.emoji} ${t.title} — x2` : "x2");
      else if (action === "undo-double") toast(t ? `${t.title}: снова одна отметка` : "Снова одна отметка");
      else toast.success(t ? `${t.emoji} ${t.title} — +${t.points} очков!` : "Сохранено");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["group"] }),
  });
}


