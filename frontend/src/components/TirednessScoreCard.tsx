export default function TirednessScoreCard({ state }: { state: any }) {
  if (!state) return null;
  const rows = [
    ["Усталость", state.tiredness_score],
    ["Тревога", state.anxiety_score],
    ["Дедлайн", state.deadline_pressure],
    ["Готовность", state.study_readiness],
    ["Перегруз", state.overload_score]
  ];
  return (
    <div className="rounded-[8px] bg-white/80 p-4 shadow-soft">
      <div className="mb-3 font-semibold text-graphite">Tiredness Score</div>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label as string}>
            <div className="mb-1 flex justify-between text-xs text-graphite/70"><span>{label}</span><span>{value}/10</span></div>
            <div className="h-2 rounded-full bg-cream"><div className="h-2 rounded-full bg-mint" style={{ width: `${Number(value) * 10}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

