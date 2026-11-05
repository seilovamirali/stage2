import { useMemo } from "react";

export function Confetti() {
  const items = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dx: `${(Math.random() - 0.5) * 140}px`,
        size: 6 + (i % 4) * 2,
        amber: i % 3 !== 0,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {items.map((piece, index) => (
        <span
          key={index}
          className={`animate-confetti absolute top-0 rounded-full ${piece.amber ? "bg-gold" : "bg-foreground"}`}
          style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}s`, width: piece.size, height: piece.size, ["--dx" as string]: piece.dx }}
        />
      ))}
    </div>
  );
}
