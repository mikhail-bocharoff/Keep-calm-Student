import { useState } from "react";
import { api } from "../api/client";
import FocusTimer from "../components/FocusTimer";
import RitualCard from "../components/RitualCard";

export default function RitualPage({ userId }: { userId: string }) {
  const [cat, setCat] = useState<any>(null);
  const [reward, setReward] = useState("");
  const [anxiety, setAnxiety] = useState("");
  const [anxietyResult, setAnxietyResult] = useState<any>(null);
  const [task, setTask] = useState("");
  const [burned, setBurned] = useState<any>(null);

  async function startCat() {
    setCat(await api.startRitual(userId, "cat_mode"));
    setReward("");
  }

  async function completeCat() {
    if (!cat) return;
    const response = await api.completeRitual(userId, cat.ritual_id);
    setReward(response.message);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <RitualCard title="Кошачий режим">
        <div className={`rounded-[8px] p-5 ${cat ? "bg-graphite text-cream" : "bg-cream text-graphite"}`}>
          <p className="mb-4">Учёба подождёт. Мозг на зарядке.</p>
          {cat && <FocusTimer minutes={15} active />}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={startCat} className="rounded-[8px] bg-mint px-4 py-2 font-semibold text-graphite">Запустить</button>
          <button onClick={completeCat} disabled={!cat} className="rounded-[8px] bg-graphite px-4 py-2 font-semibold text-white disabled:opacity-40">Завершить</button>
        </div>
        {reward && <p className="mt-3 text-sm text-graphite/70">{reward}</p>}
      </RitualCard>

      <RitualCard title="Пожиратель тревоги">
        <textarea value={anxiety} onChange={(event) => setAnxiety(event.target.value)} placeholder="Я не успеваю, всё завалю..." className="h-28 w-full resize-none rounded-[8px] bg-cream p-3 text-sm outline-none focus:ring-2 focus:ring-lavender" />
        <button onClick={async () => setAnxietyResult(await api.anxietyEater(userId, anxiety))} className="mt-3 rounded-[8px] bg-lavender px-4 py-2 font-semibold text-graphite">Скормить тревогу</button>
        {anxietyResult && <div className="mt-3 rounded-[8px] bg-cream p-3 text-sm text-graphite">{anxietyResult.rewritten_text}</div>}
      </RitualCard>

      <RitualCard title="Сжигатель списка задач">
        <textarea value={task} onChange={(event) => setTask(event.target.value)} placeholder="Мне надо начать курсовую..." className="h-28 w-full resize-none rounded-[8px] bg-cream p-3 text-sm outline-none focus:ring-2 focus:ring-peach" />
        <button onClick={async () => setBurned(await api.taskBurner(userId, task))} className="mt-3 rounded-[8px] bg-peach px-4 py-2 font-semibold text-graphite">Сжечь задачу</button>
        {burned && <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-graphite">{burned.micro_steps.map((step: string) => <li key={step}>{step}</li>)}</ol>}
      </RitualCard>
    </div>
  );
}

