import { useState } from "react";
import { api } from "../api/client";
import FocusTimer from "../components/FocusTimer";

export default function FocusRoundPage({ userId }: { userId: string }) {
  const [round, setRound] = useState<any>(null);
  const [result, setResult] = useState("");
  const [reward, setReward] = useState("");

  async function start() {
    setRound(await api.startFocus(userId));
    setReward("");
  }

  async function complete() {
    if (!round) return;
    const response = await api.completeFocus(userId, round.focus_round_id, result);
    setReward(response.message);
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[8px] bg-white/70 p-6 shadow-soft">
      <button onClick={start} className="rounded-[8px] bg-graphite px-5 py-3 font-semibold text-white">Запустить 10 минут</button>
      {round && (
        <div className="mt-6 space-y-4">
          <FocusTimer minutes={round.duration_minutes} active />
          <h2 className="text-2xl font-black text-graphite">{round.task_title}</h2>
          <p className="rounded-[8px] bg-cream p-4 text-graphite">{round.task_text}</p>
          <p className="text-sm text-graphite/70">Условие победы: {round.success_condition}</p>
          <textarea value={result} onChange={(event) => setResult(event.target.value)} placeholder="Что получилось? Даже один вопрос считается." className="h-28 w-full resize-none rounded-[8px] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-mint" />
          <button onClick={complete} className="rounded-[8px] bg-mint px-5 py-3 font-semibold text-graphite">Завершить</button>
        </div>
      )}
      {reward && <p className="mt-4 rounded-[8px] bg-cream p-4 text-graphite">{reward}</p>}
    </div>
  );
}

