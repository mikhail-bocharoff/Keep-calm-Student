export default function RestShardProgress({ restShards, progress }: { restShards: number; progress: number }) {
  return (
    <div className="rounded-[8px] bg-white/80 p-5 shadow-soft">
      <div className="mb-2 flex justify-between font-semibold text-graphite"><span>Осколки отдыха</span><span>{restShards}</span></div>
      <div className="h-3 rounded-full bg-cream"><div className="h-3 rounded-full bg-peach" style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 text-sm text-graphite/70">До следующего уровня котёнка: {100 - progress}%</p>
    </div>
  );
}

