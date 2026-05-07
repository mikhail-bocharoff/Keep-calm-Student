import { Flame, Hourglass, Moon, Sparkles } from "lucide-react";

const actions = [
  ["cat_mode", "Кошачий режим", Moon],
  ["anxiety_eater", "Пожиратель тревоги", Sparkles],
  ["task_burner", "Сжечь задачу", Flame],
  ["focus", "10 минут", Hourglass]
] as const;

export default function QuickActionButtons({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map(([id, label, Icon]) => (
        <button key={id} title={label} onClick={() => onAction(id)} className="flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-white/80 px-3 text-sm font-semibold text-graphite shadow-soft transition hover:-translate-y-0.5 hover:bg-cream">
          <Icon size={18} /> <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

