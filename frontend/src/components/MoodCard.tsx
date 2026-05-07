export default function MoodCard({ state }: { state: any }) {
  if (!state) return null;
  return (
    <div className="grid gap-2 rounded-[8px] bg-white/80 p-4 text-sm text-graphite shadow-soft">
      <div className="font-semibold">Состояние: {state.detected_intent}</div>
      <div className="text-graphite/70">{state.short_reason}</div>
    </div>
  );
}

