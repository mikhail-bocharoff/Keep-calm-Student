import type { ReactNode } from "react";

export default function RitualCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[8px] bg-white/80 p-5 shadow-soft">
      <h2 className="mb-3 text-lg font-semibold text-graphite">{title}</h2>
      {children}
    </section>
  );
}

