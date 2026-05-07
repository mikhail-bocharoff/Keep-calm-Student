import {
  Check,
  Flame,
  Heart,
  Leaf,
  MessageCircle,
  Music,
  PawPrint,
  Send,
  Sparkles,
  Star,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

type MusicKey = keyof typeof focusMusicLinks;

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Привет. Напиши, что сейчас происходит: усталость, дедлайн, тревога или ступор. Я помогу выбрать самый мягкий следующий шаг.",
  },
];

const moodChips = [
  { label: "Устал", text: "Мне сейчас устало" },
  { label: "Тревожно", text: "Мне сейчас тревожно" },
  { label: "Тупик", text: "Я застрял и не понимаю, с чего начать" },
  { label: "Не успеваю", text: "Я не успеваю и начинаю паниковать" },
  { label: "Спасибо", text: "Спасибо, мне стало чуть спокойнее" },
];

const focusMusicLinks = {
  rap: {
    label: "РЭП",
    icon: "🎤",
    url: "https://music.yandex.ru/playlists/ge.2fc9567f-30ed-4a7e-8c22-63570cdce155",
  },
  aiMusic: {
    label: "ИИмузыка",
    icon: "🤖",
    url: "https://music.yandex.ru/artist/19339609",
  },
  rock: {
    label: "Рок",
    icon: "🎸",
    url: "https://music.yandex.ru/playlists/433927e7-9455-ac34-f0d2-8385d274f7b0",
  },
  relaxCats: {
    label: "Релакс котики",
    icon: "🐾",
    url: "https://music.yandex.ru/playlists/13bc0378-46d8-7ac0-b70c-72235db98969",
  },
} as const;

function RhythmLine({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rhythm-line">
      <span className="rhythm-icon">{icon}</span>
      <strong>{label}</strong>
      <span className="rhythm-track">
        <span style={{ width: `${value}%`, background: color }} />
      </span>
      <b>{value}%</b>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem("otdohnii_user_id") || localStorage.getItem("focusfloat_user_id") || "");
  const [appName, setAppName] = useState(import.meta.env.VITE_APP_NAME || "ОтдохнИИ");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [emotionalState, setEmotionalState] = useState<any>(null);
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
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const musicButtonRef = useRef<HTMLButtonElement | null>(null);
  const musicModalRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isMusicModalOpen) return;
    musicModalRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMusicModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMusicModalOpen]);

  const energy = emotionalState ? Math.max(18, Math.min(96, 100 - emotionalState.overload_score * 8)) : 68;
  const focusPercent = progress ? Math.min(96, 48 + progress.completed_focus_rounds * 8) : 56;
  const restPercent = progress ? Math.min(96, 42 + progress.completed_rituals * 9) : 45;
  const microPercent = progress ? Math.min(96, 50 + progress.rest_shards * 4) : 68;

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
      setEmotionalState(response.emotional_state);
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
    if (!userId || !activeRest) return;
    setBusyAction("rest-complete");
    setError("");
    try {
      if (activeRest.ritualId) {
        const response = await api.completeRitual(userId, activeRest.ritualId);
        showNote(response.message);
        await refreshProgress();
      } else {
        showNote("Отдых засчитан. Теперь можно выбрать один маленький шаг.");
      }
      setActiveRest(null);
    } catch {
      setError("Не получилось завершить ритуал. Попробуй ещё раз.");
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
      setError("Не получилось создать фокус-раунд. Проверь backend.");
    } finally {
      setBusyAction("");
    }
  }

  async function completeFocus() {
    if (!userId || !focusRound) return;
    setBusyAction("focus-complete");
    setError("");
    try {
      const response = await api.completeFocus(userId, focusRound.focus_round_id, focusResult || "Сделал один маленький шаг");
      showNote(response.message);
      setMicroStepDone(true);
      await refreshProgress();
    } catch {
      setError("Не получилось завершить фокус-раунд. Попробуй ещё раз.");
    } finally {
      setBusyAction("");
    }
  }

  async function feedAnxiety() {
    if (!userId) return;
    if (!anxietyText.trim()) {
      showNote("Напиши тревожную мысль. Одной фразы достаточно.");
      return;
    }
    setBusyAction("anxiety");
    setError("");
    try {
      const response = await api.anxietyEater(userId, anxietyText);
      setAnxietyResult(response.rewritten_text);
      showNote(response.message);
    } catch {
      setError("Не получилось переписать тревогу. Попробуй ещё раз.");
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
      setError("Не получилось разбить задачу. Попробуй ещё раз.");
    } finally {
      setBusyAction("");
    }
  }

  function openMusicModal() {
    setIsMusicModalOpen(true);
  }

  function closeMusicModal() {
    setIsMusicModalOpen(false);
    window.setTimeout(() => musicButtonRef.current?.focus(), 0);
  }

  function openFocusMusic(style: MusicKey) {
    const item = focusMusicLinks[style];
    try {
      const opened = window.open(item.url, "_blank", "noopener,noreferrer");
      if (!opened) {
        throw new Error("window.open returned null");
      }
      setIsMusicModalOpen(false);
      showNote("Плейлист открылся в браузере.");
      window.setTimeout(() => musicButtonRef.current?.focus(), 0);
    } catch (musicError) {
      console.error("Failed to open Yandex Music link", musicError);
      setIsMusicModalOpen(false);
      showNote("Не получилось открыть Яндекс Музыку. Попробуй ещё раз.");
      window.setTimeout(() => musicButtonRef.current?.focus(), 0);
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

  return (
    <main className="app-shell">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div className="brand">
            <div className="brand-mark">
              <PawPrint size={32} />
            </div>
            <div>
              <h1>{appName}</h1>
              <p>Отдых легален. Фокус возвращается мягко.</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              ref={musicButtonRef}
              className="music-trigger"
              onClick={openMusicModal}
              aria-haspopup="dialog"
              aria-expanded={isMusicModalOpen}
            >
              <Music size={28} /> Музыка
            </button>
            <span className="focus-pill">
              <span /> В фокусе
            </span>
          </div>
        </header>

        <div className="dashboard-grid">
          <section className="welcome-card">
            <div className="mode-pill">
              <Leaf size={24} />
              <span>бережный режим включён</span>
            </div>
            <h2>Привет. Я здесь, чтобы помочь тебе выдохнуть и не сдаваться.</h2>
            <p>Напиши, что ты сейчас. Всё принимается: усталость, дедлайн, тревога, тупик, “я опять ничего”.</p>
            <div className="mood-row">
              {moodChips.map((chip) => (
                <button key={chip.label} onClick={() => sendMessage(chip.text)}>
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="chat-card">
              <div className="message-stack">
                {messages.slice(-4).map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                    {message.role === "assistant" && (
                      <span className="bubble-icon">
                        <Heart size={18} />
                      </span>
                    )}
                    <p>{message.content}</p>
                  </div>
                ))}
                {isSending && (
                  <div className="bubble assistant">
                    <span className="bubble-icon">
                      <Heart size={18} />
                    </span>
                    <p>Собираю ответ. Уже думаю.</p>
                  </div>
                )}
              </div>
              <div className="composer">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                  placeholder="Напиши здесь, что чувствуешь, что мешает, что нужно"
                />
                <button onClick={() => sendMessage()} title="Отправить" disabled={isSending || !input.trim()}>
                  <Send size={24} />
                </button>
              </div>
            </div>
          </section>

          <section className="rhythm-card">
            <h3>Сегодняшний ритм</h3>
            <div className="energy-ring" style={{ "--energy": `${energy}%` } as CSSProperties}>
              <div>
                <strong>{energy}%</strong>
                <span>энергии</span>
              </div>
            </div>
            <div className="rhythm-list">
              <RhythmLine icon={<Leaf size={18} />} label="Фокус" value={focusPercent} color="#37c786" />
              <RhythmLine icon={<Leaf size={18} />} label="Отдых" value={restPercent} color="#795cf5" />
              <RhythmLine icon={<Star size={18} />} label="Микрошаги" value={microPercent} color="#f7a733" />
            </div>
            <p className="rhythm-note">Ты уже сделал(а) много. Маленькими шагами — к большому результату.</p>
          </section>

          <section className="action-card task-card">
            <div>
              <h3><Flame size={28} /> Сжечь страшную задачу</h3>
              <textarea value={taskText} onChange={(event) => setTaskText(event.target.value)} placeholder="Мне надо начать курсовую, но я не понимаю с чего..." />
              {taskSteps.length > 0 && (
                <ol>
                  {taskSteps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </div>
            <button onClick={burnTask} disabled={busyAction === "task"}>
              {busyAction === "task" ? "Разбиваю..." : "Разбить на микрошаги"}
              <Sparkles size={22} />
            </button>
          </section>

          <section className="action-card ritual-card">
            <div>
              <h3><MessageCircle size={28} /> Ритуалы</h3>
              <p>Мягкие практики для фокуса и спокойствия</p>
              {activeRest && (
                <div className="mini-timer">
                  <span>{activeRest.title}</span>
                  <FocusTimer minutes={activeRest.minutes} active />
                </div>
              )}
            </div>
            <button onClick={activeRest ? completeRest : startCatMode} disabled={busyAction === "cat" || busyAction === "rest-complete"}>
              {activeRest ? "Завершить ритуал" : "Кошачий режим"}
              <PawPrint size={24} />
            </button>
          </section>

          <aside className="kitten-panel">
            <img src={dreamscape} alt="Сонный котёнок рядом с учебником и чашкой" />
          </aside>

          <section className="bottom-card micro-card">
            <h3><Leaf size={28} /> Микрошаг дня</h3>
            <p>{focusRound?.task_text || "Открой конспект и выдели 1 главную мысль. Не идеально. Просто одну."}</p>
            <span className="duration-pill"><Timer size={18} /> 2-10 мин</span>
            <button onClick={startFocus} disabled={busyAction === "focus"}>
              {busyAction === "focus" ? "Готовлю..." : "Сделать шаг"} <Check size={28} />
            </button>
          </section>

          <section className="bottom-card focus-card">
            <span className="card-kicker">текущий фокус-раунд</span>
            <h3>{focusRound?.task_title || "Маленький шаг к диктанту"}</h3>
            <p>{focusRound?.task_text || "Напиши 5 слов из списка к диктанту 5 раз подряд, чтобы запомнить их лучше."}</p>
            <div className="focus-result-row">
              <input value={focusResult} onChange={(event) => setFocusResult(event.target.value)} placeholder="Что получилось? Даже 1 вопрос считается" />
              <MessageCircle size={24} />
            </div>
            <button onClick={focusRound ? completeFocus : startFocus} disabled={busyAction === "focus" || busyAction === "focus-complete"}>
              {focusRound ? (microStepDone ? "Засчитано" : "Завершить") : "Запустить"}
              <Sparkles size={24} />
            </button>
          </section>

          <section className="bottom-card anxiety-card">
            <h3><Heart size={28} /> Пожиратель тревоги</h3>
            <p>Выгрузи тревогу — пусть он её съест и станет легче</p>
            <textarea value={anxietyText} onChange={(event) => setAnxietyText(event.target.value)} placeholder="Я всё завалю..." />
            {anxietyResult && <p className="soft-result">{anxietyResult}</p>}
            <button onClick={feedAnxiety} disabled={busyAction === "anxiety"}>
              {busyAction === "anxiety" ? "Думаю..." : "Скормить"}
            </button>
          </section>
        </div>

        {error && <div className="inline-error">{error}</div>}

        {ritualNote && (
          <div className="toast-note" role="status">
            <Sparkles size={19} />
            <span>{ritualNote}</span>
          </div>
        )}

        {isMusicModalOpen && (
          <div className="music-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && closeMusicModal()}>
            <section
              ref={musicModalRef}
              className="music-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="music-modal-title"
              aria-describedby="music-modal-description"
              tabIndex={-1}
            >
              <button className="music-modal-close" onClick={closeMusicModal} aria-label="Закрыть выбор музыки">
                <X size={22} />
              </button>
              <div className="music-modal-copy">
                <h2 id="music-modal-title">Выбери музыку для фокуса</h2>
                <p id="music-modal-description">Откроем Яндекс Музыку в браузере. Выбирай настроение — приложение останется здесь.</p>
              </div>
              <div className="music-options">
                {Object.entries(focusMusicLinks).map(([key, item]) => (
                  <button key={key} onClick={() => openFocusMusic(key as MusicKey)} aria-label={`Открыть Яндекс Музыку: ${item.label}`}>
                    <span>{item.icon}</span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
              <button className="music-modal-cancel" onClick={closeMusicModal}>
                Отмена
              </button>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
