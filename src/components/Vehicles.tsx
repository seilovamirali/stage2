import type { ReactNode } from "react";
import type { VehicleId } from "@/lib/atomic";

function Wheel({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-foreground" />
      <circle cx={cx} cy={cy} r={r * 0.46} className="fill-background" />
      <circle cx={cx} cy={cy} r={r * 0.16} className="fill-gold" />
    </g>
  );
}

function Head({ cx, cy, r = 4.6 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-foreground" />
      <circle cx={cx + r * 0.32} cy={cy - r * 0.08} r={r * 0.2} className="fill-background" />
    </g>
  );
}

function Walker() {
  return (
    <g strokeLinejoin="round">
      <Head cx={60} cy={13} r={5.6} />
      <path d="M54 19 h12 l2 15 h-16 Z" className="fill-foreground" />
      <path d="M55 24 L40 34 L43 38 L58 28 Z" className="fill-foreground" />
      <path d="M65 22 L80 15 L82 19 L67 27 Z" className="fill-foreground" />
      <path d="M56 33 L42 50 L47 53 L61 38 Z" className="fill-foreground" />
      <path d="M64 33 L80 47 L76 51 L60 38 Z" className="fill-foreground" />
    </g>
  );
}

function Scooter() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <Wheel cx={30} cy={51} r={5.6} />
      <Wheel cx={90} cy={51} r={5.6} />
      <path d="M32 44 H88 v4 H32 Z" className="fill-foreground" />
      <path d="M78 44 L92 22" className="stroke-foreground" strokeWidth="3.2" />
      <path d="M84 22 H106" className="stroke-foreground" strokeWidth="3.2" />
      <circle cx={106} cy={22} r={2.1} className="fill-gold" />
      <Head cx={62} cy={13} r={5.2} />
      <path d="M57 18 h10 l1 16 h-12 Z" className="fill-foreground" />
      <path d="M66 24 L88 22" className="stroke-foreground" strokeWidth="2.8" />
      <path d="M60 33 L50 44 L55 45 L66 35 Z" className="fill-foreground" />
      <path d="M66 33 L80 44 L76 45 L62 35 Z" className="fill-foreground" />
    </g>
  );
}

function Bicycle() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Wheel cx={26} cy={49} r={10} />
      <Wheel cx={96} cy={49} r={10} />
      <path d="M26 49 H48 L66 28 L96 49 M48 49 L40 30" className="stroke-foreground" strokeWidth="2.7" />
      <path d="M40 30 h16" className="stroke-gold" strokeWidth="2.8" />
      <path d="M66 28 L74 23 H92" className="stroke-foreground" strokeWidth="2.5" />
      <circle cx={48} cy={49} r={2.3} className="fill-gold stroke-none" />
      <Head cx={56} cy={12} r={5} />
      <path d="M51 17 L45 32 L54 34 L60 19 Z" className="fill-foreground stroke-none" />
      <path d="M56 22 L78 25" className="stroke-foreground" strokeWidth="2.7" />
      <path d="M47 32 L38 45 M51 33 L62 46" className="stroke-foreground" strokeWidth="2.8" />
    </g>
  );
}

function Horse() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M24 36 C12 30 12 48 26 46" fill="none" className="stroke-foreground" strokeWidth="2.5" />
      <ellipse cx="50" cy="40" rx="22" ry="10" className="fill-foreground" />
      <path d="M64 34 C74 30 80 22 86 16 L92 22 C84 28 78 34 70 38 Z" className="fill-foreground" />
      <path d="M84 18 C94 12 112 16 112 24 C110 28 102 26 98 30 C92 32 86 26 86 20 Z" className="fill-foreground" />
      <path d="M86 16 L88 7 L95 15 Z" className="fill-foreground" />
      <path d="M72 28 C78 22 84 18 90 18" fill="none" className="stroke-gold" strokeWidth="2" />
      <circle cx="100" cy="21" r="1.2" className="fill-background" />
      <path d="M36 46 h4 l1 10 h-4 Z M46 48 h4 v8 h-4 Z M58 48 h4 v8 h-4 Z M68 46 h4 l2 10 h-4 Z" className="fill-foreground" />
      <path d="M44 31 h16 v3.2 H44 Z" className="fill-gold" />
      <Head cx={52} cy={13} r={4.6} />
      <path d="M48 17 h8 l1 13 h-10 Z" className="fill-foreground" />
      <path d="M56 21 L68 18" className="stroke-foreground" strokeWidth="2.4" />
    </g>
  );
}

function Motorcycle() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <Wheel cx={26} cy={50} r={10} />
      <Wheel cx={98} cy={50} r={10} />
      <path d="M26 50 H48 L58 40 H80 L92 46" fill="none" className="stroke-foreground" strokeWidth="3" />
      <path d="M44 42 h20 a2 2 0 0 1 2 2 v7 H44 Z" className="fill-foreground" />
      <path d="M58 40 C68 28 86 28 96 36 L78 42 Z" className="fill-foreground" />
      <path d="M46 36 C56 32 66 32 72 40 L50 42 Z" className="fill-foreground" />
      <path d="M90 36 L98 42" fill="none" className="stroke-foreground" strokeWidth="2.8" />
      <path d="M86 33 H104" fill="none" className="stroke-foreground" strokeWidth="2.6" />
      <path d="M42 52 H68" fill="none" className="stroke-gold" strokeWidth="2.4" />
      <Head cx={62} cy={18} r={5.2} />
      <path d="M58 23 L50 36 L64 40 L74 26 Z" className="fill-foreground" />
      <path d="M70 26 L90 34" fill="none" className="stroke-foreground" strokeWidth="2.8" />
      <path d="M64 16 h8" fill="none" className="stroke-gold" strokeWidth="2.2" />
    </g>
  );
}

function Sedan() {
  return (
    <g>
      <path d="M16 42 H104 a3 3 0 0 0 3-3 v-6 H78 L66 22 H40 L28 33 H16 v6 a3 3 0 0 0 0 3 Z" className="fill-foreground" />
      <path d="M42 24 h16 l6 8 H36 Z" className="fill-background" />
      <path d="M66 24 h8 l6 8 H66 Z" className="fill-background" />
      <path d="M100 34 h6 v3 h-6 Z" className="fill-gold" />
      <Wheel cx={34} cy={44} r={6.4} />
      <Wheel cx={88} cy={44} r={6.4} />
    </g>
  );
}

function Crossover() {
  return (
    <g>
      <path d="M14 44 H106 a3 3 0 0 0 3-3 v-8 H80 L70 20 H38 L26 32 H14 v9 a3 3 0 0 0 0 3 Z" className="fill-foreground" />
      <path d="M40 22 h18 l7 9 H34 Z" className="fill-background" />
      <path d="M66 22 h12 l6 9 H66 Z" className="fill-background" />
      <path d="M42 16 h28" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" />
      <path d="M102 34 h6 v4 h-6 Z" className="fill-gold" />
      <Wheel cx={32} cy={46} r={7} />
      <Wheel cx={90} cy={46} r={7} />
    </g>
  );
}

function Jeep() {
  return (
    <g>
      <circle cx={22} cy={30} r={6.5} className="fill-foreground" />
      <circle cx={22} cy={30} r={2.4} className="fill-background" />
      <path d="M18 44 H108 V28 H86 V18 H36 V30 H18 Z" className="fill-foreground" />
      <path d="M38 20 h22 v10 H38 Z" className="fill-background" />
      <path d="M64 20 h16 v10 H64 Z" className="fill-background" />
      <path d="M100 30 h5 v8 h-5 Z" className="fill-gold" />
      <path d="M96 32 v6 M99 32 v6" className="stroke-background" strokeWidth="1" />
      <Wheel cx={40} cy={46} r={7.4} />
      <Wheel cx={92} cy={46} r={7.4} />
    </g>
  );
}

function SportCar() {
  return (
    <g>
      <path d="M8 44 H112 L104 34 H78 L68 26 H40 L30 34 H12 Z" className="fill-foreground" />
      <path d="M108 30 h8 v4 h-6 Z" className="fill-foreground" />
      <path d="M44 28 h16 l6 6 H40 Z" className="fill-gold" />
      <path d="M104 36 h6 v3 h-6 Z" className="fill-gold" />
      <Wheel cx={32} cy={45} r={6.2} />
      <Wheel cx={90} cy={45} r={6.2} />
    </g>
  );
}

function Plane() {
  return (
    <g>
      <path d="M34 28 L22 14 H30 L42 28 Z" className="fill-foreground" />
      <path d="M24 36 L8 42 H26 Z" className="fill-foreground" />
      <path d="M28 34 C28 28 40 26 58 26 H96 C106 26 112 30 112 34 C112 38 106 42 96 42 H58 C40 42 28 40 28 34 Z" className="fill-foreground" />
      <path d="M58 34 L92 40 L86 46 H52 Z" className="fill-foreground" />
      <path d="M70 40 h8 v5 h-6 Z" className="fill-gold" />
      <circle cx={78} cy={33} r={2.1} className="fill-background" />
      <circle cx={88} cy={33} r={2.1} className="fill-background" />
      <circle cx={98} cy={33} r={2.1} className="fill-background" />
      <path d="M108 32 h3" className="stroke-gold" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function Rocket() {
  return (
    <g>
      <path d="M36 30 C22 26 10 30 16 34 C10 38 22 42 36 38 Z" className="fill-gold" />
      <path d="M34 28 L24 16 L44 28 Z" className="fill-foreground" />
      <path d="M34 40 L24 52 L44 40 Z" className="fill-foreground" />
      <rect x="34" y="26" width="52" height="16" rx="2" className="fill-foreground" />
      <path d="M86 26 H92 L112 34 L92 42 H86 Z" className="fill-foreground" />
      <rect x="78" y="26" width="3.5" height="16" className="fill-gold" />
      <circle cx="62" cy="34" r="4.2" className="fill-background" />
      <circle cx="63.2" cy="33" r="1.2" className="fill-gold" />
    </g>
  );
}

const ART: Record<VehicleId, () => ReactNode> = {
  walk: Walker,
  scooter: Scooter,
  bike: Bicycle,
  horse: Horse,
  moto: Motorcycle,
  sedan: Sedan,
  crossover: Crossover,
  jeep: Jeep,
  sport: SportCar,
  plane: Plane,
  rocket: Rocket,
};

export function Vehicle({ kind, className = "h-12 w-[5.625rem]" }: { kind: VehicleId; className?: string }) {
  const Art = ART[kind];
  return (
    <svg viewBox="0 0 120 64" className={`block overflow-visible ${className}`} aria-hidden>
      <Art />
    </svg>
  );
}
