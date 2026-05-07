import { useEffect, useState } from "react";

export default function FocusTimer({ minutes, active }: { minutes: number; active: boolean }) {
  const [seconds, setSeconds] = useState(minutes * 60);
  useEffect(() => {
    setSeconds(minutes * 60);
  }, [minutes]);
  useEffect(() => {
    if (!active || seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [active, seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <div className="tabular-nums text-4xl font-black text-graphite">{mm}:{ss}</div>;
}

