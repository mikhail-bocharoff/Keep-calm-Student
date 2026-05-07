import { Check, Edit3, Flame, Leaf, PawPrint, Play, Send, Sparkles, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { API_URL, api, ChatMessage as Message } from "./api/client";
import dreamscape from "./assets/otdohnii-dreamscape.png";
import FocusTimer from "./components/FocusTimer";

type Progress = {
  rest_shards: number;
  sleepy_kitten_level: number;
  sleepy_kitten_progress: number;
  completed_focus_rounds: number;
  completed_rituals: number;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Привет. Напиши, что сейчас происходит: усталость, апатия, тревога или ступор. Я помогу выбрать самый мягкий следующий шаг.",
  },
];

const moodChips = ["Устал", "Тревожно", "Туплю", "Не успеваю", "Спокойно"];

function StatLine({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rhythm-line">
      <div className="rhythm-icon">{icon}</div>
      <span>{label}</span>
      <div className="rhythm-track">
        <div style={{ width: value, background: color }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem("otdohnii_user_id") || localStorage.getItem("focusfloat_user_id") || "");
  const [appName, setAppName] = useState(import.meta.env.VITE_APP_NAME || "ОтдохнИИ");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [focusRound, setFocusRound] = useState<any>(null);
  const [focusResult, setFocusResult] = useState("");
  const [microStepDone, setMicroStepDone] = useState(false);
  const [ritualNote, setRitualNote] = useState("");
  const [anxietyText, setAnxietyText] = useState("");
  const [anxietyResult, setAnxietyResult] = useState("");
  const [taskText, setTaskText] = useState("");
  const [taskSteps, setTaskSteps] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [startupError, setStartupError] = useState("");
  const [activeRest, setActiveRest] = useState<{ ritualId?: string; title: string; minutes: number } | null>(null);

  useEffect(() => {
    api.health().then((data) => setAppName(data.app_name)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!userId) {
      api.createUser()
        .then((user) => {
          localStorage.setItem("otdohnii_user_id", user.user_id);
          setUserId(user.user_id);
          setStartupError("");
        })
        .catch(() => setStartupError(`Не получается подключиться к backend: ${API_URL}`));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    api.getProgress(userId).then(setProgress).catch(() => undefined);
  }, [userId]);

  async function retryStartup() {
    setStartupError("");
    try {
      const user = await api.createUser();
      localStorage.setItem("otdohnii_user_id", user.user_id);
      setUserId(user.user_id);
    } catch {
      setStartupError(`Backend всё ещё недоступен: ${API_URL}`);
    }
  }

  async function refreshProgress() {
    if (!userId) return;
    setProgress(await api.getProgress(userId));
  }

  function showNote(message: string) {
    setRitualNote(message);
    window.setTimeout(() => setRitualNote((current) => (current === message ? "" : current)), 6500);
  }

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean || !userId || isSending) return;
    setError("");
    setInput("");
    setMessages((items) => [...items, { role: "user", content: clean }]);
    setIsSending(true);
    try {
      const response = await api.sendMessage(userId, clean);
      setMessages((items) => [...items, { role: "assistant", content: response.reply }]);
    } catch {
      setError("Чат не смог получить ответ. Проверь backend и /api/health/llm.");
      setMessages((items) => [...items, { role: "assistant", content: "Я не смог получить ответ от сервера. Проверь, что backend запущен и нейросеть подключена." }]);
    } finally {
      setIsSending(false);
    }
  }

  async function startCatMode() {
    if (!userId) return;
    setBusyAction("cat");
    setError("");
    try {
      const ritual = await api.startRitual(userId, "cat_mode");
      setActiveRest({ ritualId: ritual.ritual_id, title: "Кошачий режим", minutes: ritual.duration_minutes });
      showNote(ritual.message);
    } catch {
      setError("Не получилось запустить ритуал. Проверь backend.");
    } finally {
      setBusyAction("");
    }
  }

  async function completeRest() {
    if (!userId || !activeRest?.ritualId) return;
    setBusyAction("rest-complete");
    try {
      const response = await api.completeRitual(userId, activeRest.ritualId);
      showNote(response.message);
      setActiveRest(null);
      await refreshProgress();
    } catch {
      setError("Не получилось завершить ритуал.");
    } finally {
      setBusyAction("");
    }
  }

  async function startFocus() {
    if (!userId) return;
    setBusyAction("focus");
    setError("");
    try {
      const round = await api.startFocus(userId);
      setFocusRound(round);
      setFocusResult("");
      setMicroStepDone(false);
      showNote("Фокус-раунд готов. Сделай любой маленький след за 10 минут.");
    } catch {
      setError("Не получилось создать фокус-раунд.");
    } finally {
      setBusyAction("");
    }
  }

  async function completeFocus() {
    if (!userId || !focusRound) return;
    setBusyAction("focus-complete");
    try {
      const response = await api.completeFocus(userId, focusRound.focus_round_id, focusResult || "Сделал один маленький шаг");
      setMicroStepDone(true);
      showNote(response.message);
      await refreshProgress();
    } catch {
      setError("Не получилось завершить фокус-раунд.");
    } finally {
      setBusyAction("");
    }
  }

  async function feedAnxiety() {
    if (!userId) return;
    if (!anxietyText.trim()) {
      showNote("Напиши тревожную мысль в поле. Одной фразы достаточно.");
      return;
    }
    setBusyAction("anxiety");
    setError("");
    try {
      const response = await api.anxietyEater(userId, anxietyText);
      setAnxietyResult(response.rewritten_text);
      showNote(response.message);
    } catch {
      setError("Не получилось переписать тревогу.");
    } finally {
      setBusyAction("");
    }
  }

  async function burnTask() {
    if (!userId) return;
    if (!taskText.trim()) {
      showNote("Напиши страшную задачу в поле. Можно совсем коротко.");
      return;
    }
    setBusyAction("task");
    setError("");
    try {
      const response = await api.taskBurner(userId, taskText);
      setTaskSteps(response.micro_steps);
      showNote(response.message);
    } catch {
      setError("Не получилось разбить задачу.");
    } finally {
      setBusyAction("");
    }
  }

  if (!userId) {
    return (
      <main className="loading-screen">
        <div className="orb-loader" />
        <p>{startupError ? "Старт пока не получился" : "Готовлю мягкий старт..."}</p>
        {startupError && (
          <div className="startup-error">
            <span>{startupError}</span>
            <small>Проверь, что backend отвечает на /api/health и пускает Vercel-домен.</small>
            <button onClick={retryStartup}>Повторить</button>
          </div>
        )}
      </main>
    );
  }

  const focusPercent = progress?.completed_focus_rounds ? Math.min(100, progress.completed_focus_rounds * 25) : 50;
  const restPercent = progress?.completed_rituals ? Math.min(100, progress.completed_rituals * 25) : 50;
  const microPercent = progress?.rest_shards ? Math.min(100, progress.rest_shards * 10) : 50;

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <PawPrint size={24} />
            </div>
            <div>
              <h1>{appName}</h1>
              <p>Отдых не лень: фокус возвращается мягко.</p>
            </div>
          </div>
          <div className="shard-pill">
            <Flame size={16} />
            <strong>{progress?.rest_shards ?? 0} осколков</strong>
          </div>
        </header>

        <div className="dashboard">
          <section className="hero-card chat-panel">
            <div className="hero-copy">
              <p className="eyebrow">бережный режим включён</p>
              <h2>Привет. Я здесь, чтобы помочь тебе выдохнуть и не сдаваться.</h2>
              <p>Напиши честно, как ты сейчас. Всё принимается: усталость, желание, тревога, тупик, «я опять ничего».</p>
              <div className="mood-row">
                {moodChips.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip === "Спокойно" ? "Я спокоен и могу попробовать маленький шаг" : `Мне сейчас ${chip.toLowerCase()}`)}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="chat-window">
              <div className="message-stack">
                {messages.slice(-4).map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                    <p>{message.content}</p>
                  </div>
                ))}
                {isSending && (
                  <div className="bubble assistant">
                    <p>Собираю ответ. Уже думаю.</p>
                  </div>
                )}
              </div>
              <div className="composer">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                  placeholder="Напиши, что у тебя на уме..."
                />
                <button onClick={() => sendMessage()} title="Отправить" disabled={isSending || !input.trim()}>
                  <Send size={21} />
                </button>
              </div>
              {error && <p className="inline-error">{error}</p>}
            </div>
          </section>

          <section className="rhythm-card">
            <h3>Сегодняшний ритм</h3>
            <div className="energy-ring" style={{ "--energy": `${focusPercent}%` } as CSSProperties}>
              <div>
                <strong>{focusPercent}%</strong>
                <span>нейтрально</span>
              </div>
            </div>
            <div className="rhythm-list">
              <StatLine icon={<Flame size={16} />} label="Фокус" value={`${focusPercent}%`} color="#43c991" />
              <StatLine icon={<Leaf size={16} />} label="Отдых" value={`${restPercent}%`} color="#4ba9ef" />
              <StatLine icon={<Sparkles size={16} />} label="Микрошаги" value={`${microPercent}%`} color="#f1a72f" />
            </div>
            <p>Ты уже двигаешься мягко. Маленькими шагами — к большому результату.</p>
          </section>

          <section className="task-burner-card top-task-card">
            <h3>Сжечь страшную задачу</h3>
            <div className="textarea-wrap">
              <textarea value={taskText} onChange={(event) => setTaskText(event.target.value)} placeholder="Мам, мааочь начать уродливую, но важную задачу..." />
              <Edit3 size={16} />
            </div>
            {taskSteps.length > 0 && (
              <ol>
                {taskSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            )}
            <button onClick={burnTask} disabled={busyAction === "task"}>
              {busyAction === "task" ? "Разбиваю..." : "Разбить на микрошаги"}
            </button>
          </section>

          <section className="mode-card rituals">
            <div>
              <h3>Ритуалы</h3>
              <p>Маленькие привычки для фокуса и спокойствия каждый день. Короткая пауза без учебной вины. После неё можно вернуться к одному микрошагу.</p>
            </div>
            {activeRest && (
              <div className="mini-timer">
                <span>{activeRest.title}</span>
                <FocusTimer minutes={activeRest.minutes} active />
              </div>
            )}
            <button onClick={activeRest ? completeRest : startCatMode} disabled={busyAction === "cat" || busyAction === "rest-complete"}>
              {activeRest ? "Завершить ритуал" : "Календарь ритуалов"}
            </button>
          </section>

          <aside className="art-panel">
            <img src={dreamscape} alt="Сонный котёнок рядом с учебником и чашкой" />
          </aside>

          <section className="step-card">
            <h3><Flame size={18} /> Микрошаг дня</h3>
            <p>Сосредоточься на текущей учебной задаче и попытайся выполнить как можно больше работы в течение 10 минут без отвлечений.</p>
            <span className="duration-pill"><Timer size={15} /> 2-10 мин</span>
            <button onClick={startFocus} className="primary-action" disabled={busyAction === "focus"}>
              {busyAction === "focus" ? "Готовлю..." : "Сделать шаг"} <Check size={19} />
            </button>
          </section>

          <section className="focus-card">
            <h3><Timer size={18} /> Текущий фокус-раунд</h3>
            <strong>{focusRound?.task_title || "Учебный раунд на 10 минут"}</strong>
            <p>{focusRound?.task_text || "Сосредоточься на текущей учебной задаче и попытайся выполнить как можно больше работы в течение 10 минут без отвлечений."}</p>
            {focusRound && (
              <input value={focusResult} onChange={(event) => setFocusResult(event.target.value)} placeholder="Что получилось?" />
            )}
            <button onClick={focusRound ? completeFocus : startFocus} disabled={busyAction === "focus" || busyAction === "focus-complete"}>
              {focusRound ? (microStepDone ? "Засчитано" : "Завершить") : "Запустить"}
            </button>
          </section>

          <section className="mode-card anxiety">
            <div>
              <h3>Пожиратель тревоги</h3>
              <p>Выгрузи тревогу — пусть она не съест силы и ночь.</p>
            </div>
            <div className="textarea-wrap">
              <textarea value={anxietyText} onChange={(event) => setAnxietyText(event.target.value)} placeholder="Я всё завалю..." />
              <Edit3 size={16} />
            </div>
            {anxietyResult && <p className="soft-result">{anxietyResult}</p>}
            <button onClick={feedAnxiety} disabled={busyAction === "anxiety"}>
              {busyAction === "anxiety" ? "Думаю..." : "Съесть тревогу"}
            </button>
          </section>
        </div>

        {ritualNote && (
          <div className="toast-note" role="status">
            <Sparkles size={18} />
            <span>{ritualNote}</span>
          </div>
        )}
      </section>
    </main>
  );
}
