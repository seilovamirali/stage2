import { DAILY_TASKS, type TaskDef } from "@/lib/habits";

export interface PersonalHabit extends TaskDef {
  userId: string;
}

/** Starting set. This array is the template and must never be mutated. */
export function defaultHabitSet(): TaskDef[] {
  return DAILY_TASKS.map((task) => ({ ...task }));
}

export function seedAccount(userId: string): PersonalHabit[] {
  return defaultHabitSet().map((task) => ({ ...task, userId, archived: task.archived ?? false }));
}

export type HabitChange =
  | { type: "edit"; key: string; title: string; description: string; emoji: string; kind: "daily" | "weekly"; target: number; points: number }
  | { type: "archive"; key: string }
  | { type: "restore"; key: string }
  | { type: "add"; habit: TaskDef }
  | { type: "remove"; key: string };

/** Copy-on-write: only the named account's rows change. Other accounts and the template stay as they were. */
export function applyHabitChange(accounts: Readonly<Record<string, readonly PersonalHabit[]>>, userId: string, change: HabitChange): Record<string, PersonalHabit[]> {
  const next: Record<string, PersonalHabit[]> = {};
  for (const [id, habits] of Object.entries(accounts)) next[id] = habits.map((habit) => ({ ...habit }));
  const mine = (next[userId] ?? seedAccount(userId)).map((habit) => ({ ...habit }));
  if (change.type === "add") {
    mine.push({ ...change.habit, userId, archived: false });
  } else if (change.type === "remove") {
    const index = mine.findIndex((habit) => habit.key === change.key);
    if (index >= 0) mine.splice(index, 1);
  } else {
    const habit = mine.find((item) => item.key === change.key);
    if (habit) {
      if (change.type === "archive") habit.archived = true;
      if (change.type === "restore") habit.archived = false;
      if (change.type === "edit") {
        habit.title = change.title;
        habit.description = change.description;
        habit.emoji = change.emoji;
        habit.kind = change.kind;
        habit.target = change.kind === "weekly" ? change.target : 1;
        habit.points = change.points;
      }
    }
  }
  next[userId] = mine;
  return next;
}
