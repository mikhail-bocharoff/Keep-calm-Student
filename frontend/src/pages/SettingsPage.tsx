import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function SettingsPage({ userId }: { userId: string }) {
  const [form, setForm] = useState({ current_topic: "", current_task: "", deadline_text: "", energy_score: 3 });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api.getState(userId).then((state) => setForm({
      current_topic: state.current_topic || "",
      current_task: state.current_task || "",
      deadline_text: state.deadline_text || "",
      energy_score: state.energy_score ?? 3
    }));
  }, [userId]);
  async function save() {
    await api.saveState({ user_id: userId, ...form, energy_score: Number(form.energy_score) });
    setSaved(true);
  }
  return (
    <div className="mx-auto max-w-2xl rounded-[8px] bg-white/70 p-6 shadow-soft">
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-semibold text-graphite">Тема<input value={form.current_topic} onChange={(event) => setForm({ ...form, current_topic: event.target.value })} placeholder="Макроэкономика: инфляция" className="rounded-[8px] bg-cream p-3 font-normal outline-none focus:ring-2 focus:ring-mint" /></label>
        <label className="grid gap-1 text-sm font-semibold text-graphite">Задача<input value={form.current_task} onChange={(event) => setForm({ ...form, current_task: event.target.value })} placeholder="Подготовиться к семинару" className="rounded-[8px] bg-cream p-3 font-normal outline-none focus:ring-2 focus:ring-mint" /></label>
        <label className="grid gap-1 text-sm font-semibold text-graphite">Дедлайн<input value={form.deadline_text} onChange={(event) => setForm({ ...form, deadline_text: event.target.value })} placeholder="через 2 дня" className="rounded-[8px] bg-cream p-3 font-normal outline-none focus:ring-2 focus:ring-mint" /></label>
        <label className="grid gap-2 text-sm font-semibold text-graphite">Энергия: {form.energy_score}/10<input type="range" min="0" max="10" value={form.energy_score} onChange={(event) => setForm({ ...form, energy_score: Number(event.target.value) })} /></label>
        <button onClick={save} className="rounded-[8px] bg-graphite px-5 py-3 font-semibold text-white">Сохранить</button>
        {saved && <p className="text-sm text-graphite/70">Контекст сохранён. Теперь фокус-раунды будут мягче попадать в тему.</p>}
      </div>
    </div>
  );
}

