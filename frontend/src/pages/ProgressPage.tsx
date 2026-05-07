import { useEffect, useState } from "react";
import { api } from "../api/client";
import RestShardProgress from "../components/RestShardProgress";
import SleepyKitten from "../components/SleepyKitten";

export default function ProgressPage({ userId }: { userId: string }) {
  const [progress, setProgress] = useState<any>(null);
  useEffect(() => {
    api.getProgress(userId).then(setProgress);
  }, [userId]);
  if (!progress) return <div className="text-graphite">Загружаю сопение прогресса...</div>;
  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <SleepyKitten level={progress.sleepy_kitten_level} />
      <RestShardProgress restShards={progress.rest_shards} progress={progress.sleepy_kitten_progress} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[8px] bg-white/80 p-5 shadow-soft"><div className="text-3xl font-black text-graphite">{progress.completed_focus_rounds}</div><div className="text-sm text-graphite/70">завершённых микросессий</div></div>
        <div className="rounded-[8px] bg-white/80 p-5 shadow-soft"><div className="text-3xl font-black text-graphite">{progress.completed_rituals}</div><div className="text-sm text-graphite/70">завершённых ритуалов</div></div>
      </div>
      <p className="text-sm text-graphite/70">Сонный котёнок сопит рядом с твоим прогрессом.</p>
    </div>
  );
}

