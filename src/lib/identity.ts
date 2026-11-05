import { defaultIdentity } from "@/lib/atomic";

const KEY = "stage2-identity";

type Store = Record<string, Record<string, string>>;

function readStore(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Store;
  } catch {
    return {};
  }
}

export function loadIdentity(userId: string | undefined, habitKey: string, habitTitle: string): string {
  const fallback = defaultIdentity({ key: habitKey, title: habitTitle });
  if (!userId) return fallback;
  const saved = readStore()[userId]?.[habitKey];
  return saved?.trim() ? saved : fallback;
}

export function saveIdentity(userId: string | undefined, habitKey: string, habitTitle: string, value: string): string {
  const text = value.trim().slice(0, 120) || defaultIdentity({ key: habitKey, title: habitTitle });
  if (!userId || typeof localStorage === "undefined") return text;
  const store = readStore();
  store[userId] = { ...store[userId], [habitKey]: text };
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("stage2-identity"));
  return text;
}
