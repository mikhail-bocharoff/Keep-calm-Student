import {
  Check,
  Flame,
  Heart,
  Home,
  Leaf,
  MessageCircle,
  Music,
  PawPrint,
  Play,
  Send,
  Settings,
  Sparkles,
  Star,
  Timer,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    content: "Привет. Напиши, что сейчас происходит: усталость, дедлайн, тревога или ступор. Я помогу выбрать самый мягкий следующий шаг.",
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

function GlassButton({ children, onClick, tone = "violet" }: { children: ReactNode; onClick?: () => void; tone?: string }) {
  return (
    <button className={`glass-button ${tone}`} onClick={onClick}>
      {children}
    </button>
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
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<{ context: AudioContext; oscillator: OscillatorNode; gain: GainNode } | null>(null);
  const [settings, setSettings] = useState({
    current_topic: "Макроэкономика: инфляция",
    current_task: "Подготовиться к семинару",
    deadline_text: "через 2 дня",
    energy_score: 4,
  });

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
        .catch(() => {
          setStartupError(`Не получается подключиться к backend: ${API_URL}`);
        });
    }
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

  useEffect(() => {
    if (!userId) return;
    api.getProgress(userId).then(setProgress).catch(() => undefined);
    api.getState(userId)
      .then((state) =>
        setSettings({
          current_topic: state.current_topic || "Макроэкономика: инфляция",
          current_task: state.current_task || "Подготовиться к семинару",
          deadline_text: state.deadline_text || "через 2 дня",
          energy_score: state.energy_score ?? 4,
        }),
      )
      .catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.oscillator.stop();
        audioRef.current.context.close();
      }
    };
  }, []);

  const energy = emotionalState ? Math.max(8, 100 - emotionalState.overload_score * 9) : 68;
  const restMinutes = progress ? Math.min(60, progress.completed_rituals * 15) : 45;
  const microActions = progress ? Math.max(1, progress.completed_focus_rounds) : 2;

  const lastAssistant = useMemo(() => [...messages].reverse().find((message) => message.role === "assistant"), [messages]);

  async function refreshProgress() {
    if (!userId) return;
    setProgress(await api.getProgress(userId));
  }

  function showNote(message: string) {
    setRitualNote(message);
    window.setTimeout(() => setRitualNote((current) => (current === message ? "" : current)), 7000);
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
      setError("Чат не смог получить ответ. Проверь backend и LLM-настройки в /api/health.");
      setMessages((items) => [...items, { role: "assistant", content: "Я не смог получить ответ от сервера. Проверь, что backend запущен и нейросеть подключена." }]);
    } finally {
      setIsSending(false);
    }
  }

  async function saveSettings() {
    if (!userId) return;
    setBusyAction("settings");
    setError("");
    try {
      await api.saveState({ user_id: userId, ...settings, energy_score: Number(settings.energy_score) });
      showNote("Контекст сохранён. Теперь чат и фокус-раунды будут точнее попадать в твою реальную задачу.");
    } catch {
      setError("Не получилось сохранить настройки. Проверь, что backend запущен.");
    } finally {
      setBusyAction("");
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

  async function startShortRest(minutes = 10, title = "Короткий отдых") {
    setActiveRest({ title, minutes });
    showNote(`${title} запущен. Сейчас задача простая: ${minutes} минут без учебной вины.`);
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
        showNote("Отдых засчитан для тебя, даже если в прогресс он не записан. Теперь можно выбрать один маленький шаг.");
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
      showNote("Фокус-раунд готов. Победа считается маленькой, даже если получилось неидеально.");
    } catch {
      setError("Не получилось создать фокус-раунд. Проверь, что нейросеть и backend доступны.");
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
      showNote("Напиши тревожную мысль в поле. Даже грубо и с ошибками можно.");
      return;
    }
    setBusyAction("anxiety");
    setError("");
    try {
      const response = await api.anxietyEater(userId, anxietyText);
      setAnxietyResult(response.rewritten_text);
      showNote(response.message);
    } catch {
      setError("Не получилось переписать тревогу. Проверь LLM-настройки.");
    } finally {
      setBusyAction("");
    }
  }

  async function burnTask() {
    if (!userId) return;
    if (!taskText.trim()) {
      showNote("Сначала напиши страшную задачу в поле ниже. Одной фразы достаточно.");
      window.location.hash = "task-burner";
      return;
    }
    setBusyAction("task");
    setError("");
    try {
      const response = await api.taskBurner(userId, taskText);
      setTaskSteps(response.micro_steps);
      showNote(response.message);
    } catch {
      setError("Не получилось разбить задачу. Проверь LLM-настройки и backend.");
    } finally {
      setBusyAction("");
    }
  }

  function toggleAmbientFocus() {
    if (audioRef.current) {
      audioRef.current.oscillator.stop();
      audioRef.current.context.close();
      audioRef.current = null;
      setMusicEnabled(false);
      showNote("Фоновый звук выключен.");
      return;
    }

    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) {
      showNote("Браузер не поддерживает встроенный фоновый звук.");
      return;
    }

    const context = new AudioCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 174;
    gain.gain.value = 0.035;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    audioRef.current = { context, oscillator, gain };
    setMusicEnabled(true);
    showNote("Включил тихий фоновый тон для фокуса. Его можно выключить той же кнопкой.");
  }

  if (!userId) {
    return (
      <main className="loading-screen">
        <div className="orb-loader" />
        <p>{startupError ? "Старт пока не получился" : "Готовлю мягкий старт..."}</p>
        {startupError && (
          <div className="startup-error">
            <span>{startupError}</span>
            <small>Проверь, что backend на Render задеплоен, отвечает на /api/health и пускает Vercel-домен.</small>
            <button onClick={retryStartup}>Повторить</button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <section className="workspace">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <PawPrint size={30} />
            </div>
            <div>
              <h1>{appName}</h1>
              <p>Отдых легален. Фокус возвращается мягко.</p>
            </div>
          </div>
          <nav className="soft-nav" aria-label="Разделы приложения">
            <a href="#home"><Home size={19} /> Главная</a>
            <a href="#chat"><MessageCircle size={19} /> Чат</a>
            <a href="#rituals"><Heart size={19} /> Ритуалы</a>
            <a href="#progress"><Trophy size={19} /> Прогресс</a>
            <a href="#settings"><Settings size={19} /> Настройки</a>
          </nav>
          <div className="top-pills">
            <span><Star size={17} /> Сегодня ты молодец</span>
            <span><Flame size={17} /> {progress?.rest_shards ?? 0} осколков</span>
          </div>
        </header>

        <div className="dashboard" id="home">
          <section className="hero-card" id="chat">
            <div className="hero-copy">
              <p className="eyebrow">бережный режим включён</p>
              <h2>Привет. Я здесь, чтобы помочь тебе выдохнуть и не сдаваться.</h2>
              <p>Напиши честно, как ты сейчас. Всё принимается: усталость, дедлайн, тревога, тупняк, “я опять ничего”.</p>
              <div className="mood-row">
                {moodChips.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip === "Спокойно" ? "Я чуть спокойнее и могу попробовать 10 минут" : `Мне сейчас ${chip.toLowerCase()}`)}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="chat-window">
              <div className="message-stack">
                {messages.slice(-4).map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                    {message.role === "assistant" && <span className="bubble-avatar">♡</span>}
                    <p>{message.content}</p>
                  </div>
                ))}
                {isSending && (
                  <div className="bubble assistant">
                    <span className="bubble-avatar">♡</span>
                    <p>Собираю ответ. Без спешки, но уже думаю.</p>
                  </div>
                )}
              </div>
              <div className="composer">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                  placeholder="Напиши честно: что чувствуешь, что мешает, что нужно сейчас?"
                />
                <button onClick={() => sendMessage()} title="Отправить" disabled={isSending || !input.trim()}>
                  <Send size={22} />
                </button>
              </div>
              {error && <p className="inline-error">{error}</p>}
            </div>

            <div className="tiny-note">
              <Star size={18} />
              <span>{lastAssistant?.content || "Здесь нет оценок и правил. Только мягкий следующий шаг."}</span>
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
              <StatLine icon={<Timer size={18} />} label="Фокус" value={`${Math.min(95, microActions * 28)}%`} color="#51c88b" />
              <StatLine icon={<Leaf size={18} />} label="Отдых" value={`${Math.min(95, restMinutes)}%`} color="#8b7cf6" />
              <StatLine icon={<Star size={18} />} label="Микрошаги" value={`${Math.min(95, microActions * 34)}%`} color="#ffb454" />
            </div>
            <p>Ты уже сделал(а) много. Маленькими шагами — к большому результату.</p>
          </section>

          <section className="step-card">
            <h3><Flame size={22} /> Микрошаг дня</h3>
            <p>{focusRound?.task_text || "Открой конспект и выдели 1 главную мысль. Не идеально. Просто одну."}</p>
            <span className="duration-pill"><Timer size={16} /> 2-10 мин</span>
            <button onClick={startFocus} className="primary-action">
              {busyAction === "focus" ? "Готовлю шаг..." : "Сделать шаг"} <Check size={24} />
            </button>
          </section>

          <aside className="art-panel">
            <img src={dreamscape} alt="Студентка у окна делает мягкий учебный шаг рядом с сонным котёнком" />
          </aside>

          <section className="mode-card rituals" id="rituals">
            <div>
              <h3>Ритуалы</h3>
              <p>Мягкие практики для фокуса и спокойствия</p>
            </div>
            <GlassButton onClick={startCatMode}>{busyAction === "cat" ? "Запускаю..." : "Кошачий режим"}</GlassButton>
            {activeRest && (
              <div className="mini-timer">
                <span>{activeRest.title}</span>
                <FocusTimer minutes={activeRest.minutes} active />
                <button onClick={completeRest} disabled={busyAction === "rest-complete"}>
                  {busyAction === "rest-complete" ? "Засчитываю..." : "Завершить отдых"}
                </button>
              </div>
            )}
          </section>

          <section className="mode-card rest">
            <div>
              <h3>10 минут отдыха</h3>
              <p>Короткая пауза без учебной вины. После неё можно вернуться к одному микрошагу.</p>
            </div>
            <button onClick={() => startShortRest(10, "10 минут отдыха")} className="round-play" title="Начать отдых"><Play size={24} fill="currentColor" /></button>
          </section>

          <section className="mode-card anxiety">
            <div>
              <h3>Пожиратель тревоги</h3>
              <p>Выгрузи тревогу — пусть он её съест и станет легче</p>
            </div>
            <textarea value={anxietyText} onChange={(event) => setAnxietyText(event.target.value)} placeholder="Я всё завалю..." />
            <GlassButton tone="coral" onClick={feedAnxiety}>{busyAction === "anxiety" ? "Переписываю..." : "Скормить"}</GlassButton>
            {anxietyResult && <p className="soft-result">{anxietyResult}</p>}
          </section>

          <section className="how-card">
            <h3>Как пользоваться</h3>
            {["Напиши честно, как ты себя чувствуешь", "Выбери мягкий режим: чат, ритуал или 10 минут", "Сделай один микрошаг", "Возвращайся без чувства вины"].map((item, index) => (
              <div className="how-line" key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </section>

          <section className="quick-strip">
            <h3>Быстрые действия</h3>
            <button onClick={startCatMode}><PawPrint /> Кошачий режим <small>мягкая поддержка</small></button>
            <button onClick={burnTask}><Flame /> Сжечь задачу <small>выплесни напряжение</small></button>
            <button onClick={() => startShortRest(3, "Короткая медитация")}><Leaf /> Короткая медитация <small>3 минуты тишины</small></button>
            <button onClick={startFocus}><Star /> Правило 1% <small>сделай чуть-чуть</small></button>
            <button onClick={toggleAmbientFocus}><Music /> Музыка для фокуса <small>{musicEnabled ? "выключить фон" : "включить тихий фон"}</small></button>
          </section>

          <section className="focus-card">
            <h3><Timer size={22} /> Таймер отдыха</h3>
            {activeRest ? <FocusTimer minutes={activeRest.minutes} active /> : <strong>10:00</strong>}
            <p>{activeRest ? activeRest.title : "без чувства вины"}</p>
            <button onClick={() => startShortRest(10, "Таймер отдыха")}><Play size={28} fill="currentColor" /></button>
          </section>

          <section className="progress-card" id="progress">
            <h3>Сонный котёнок сопит рядом с прогрессом</h3>
            <div className="kitten-row">
              <div className="kitten-orb">♡</div>
              <div>
                <strong>Уровень {progress?.sleepy_kitten_level ?? 0}</strong>
                <p>{progress?.rest_shards ?? 0} осколков отдыха, {progress?.sleepy_kitten_progress ?? 0}% до следующего уровня</p>
              </div>
            </div>
          </section>

          <section className="task-burner-card" id="task-burner">
            <h3>Сжечь страшную задачу</h3>
            <textarea value={taskText} onChange={(event) => setTaskText(event.target.value)} placeholder="Мне надо начать курсовую, но я не понимаю с чего..." />
            <button onClick={burnTask} disabled={busyAction === "task"}>{busyAction === "task" ? "Разбираю..." : "Разбить на микрошаги"}</button>
            {taskSteps.length > 0 && (
              <ol>
                {taskSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            )}
          </section>

          <section className="settings-card" id="settings">
            <h3>Настройки учебного контекста</h3>
            <div className="settings-grid">
              <label>Тема<input value={settings.current_topic} onChange={(event) => setSettings({ ...settings, current_topic: event.target.value })} /></label>
              <label>Задача<input value={settings.current_task} onChange={(event) => setSettings({ ...settings, current_task: event.target.value })} /></label>
              <label>Дедлайн<input value={settings.deadline_text} onChange={(event) => setSettings({ ...settings, deadline_text: event.target.value })} /></label>
              <label>Энергия: {settings.energy_score}/10<input type="range" min="0" max="10" value={settings.energy_score} onChange={(event) => setSettings({ ...settings, energy_score: Number(event.target.value) })} /></label>
            </div>
            <button onClick={saveSettings} disabled={busyAction === "settings"}>{busyAction === "settings" ? "Сохраняю..." : "Сохранить"}</button>
          </section>
        </div>

        {focusRound && (
          <section className="floating-focus">
            <div>
              <span>Текущий фокус-раунд</span>
              <strong>{focusRound.task_title}</strong>
              <p>{focusRound.task_text}</p>
            </div>
            <input value={focusResult} onChange={(event) => setFocusResult(event.target.value)} placeholder="Что получилось? Даже 1 вопрос считается." />
            <button onClick={completeFocus}>{microStepDone ? "Засчитано" : "Завершить"}</button>
          </section>
        )}

        {ritualNote && (
          <div className="toast-note" role="status">
            <Sparkles size={19} />
            <span>{ritualNote}</span>
          </div>
        )}

        <footer>Ты важен. Ты справишься. Один день за раз.</footer>
      </section>
    </main>
  );
}
