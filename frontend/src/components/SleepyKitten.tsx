export default function SleepyKitten({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-4 rounded-[8px] bg-cream p-5">
      <div className="text-6xl" aria-label="sleepy kitten">🐱</div>
      <div>
        <div className="text-xl font-bold text-graphite">Сонный котёнок, уровень {level}</div>
        <p className="mt-1 text-sm text-graphite/70">Он ничего не требует. Просто напоминает: маленькие шаги тоже считаются.</p>
      </div>
    </div>
  );
}

