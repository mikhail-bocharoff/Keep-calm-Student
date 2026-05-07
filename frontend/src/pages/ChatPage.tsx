import { Send } from "lucide-react";
import { useState } from "react";
import { api, ChatMessage as Message } from "../api/client";
import ChatBubble from "../components/ChatBubble";
import MoodCard from "../components/MoodCard";
import QuickActionButtons from "../components/QuickActionButtons";
import TirednessScoreCard from "../components/TirednessScoreCard";

export default function ChatPage({ userId, go }: { userId: string; go: (page: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Привет. Тут можно честно: устал, дедлайн, туплю, тревожно. Я не буду ругать." }]);
  const [text, setText] = useState("");
  const [state, setState] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!text.trim()) return;
    const current = text;
    setText("");
    setMessages((items) => [...items, { role: "user", content: current }]);
    setLoading(true);
    try {
      const response = await api.sendMessage(userId, current);
      setState(response.emotional_state);
      setActions(response.suggested_actions);
      setMessages((items) => [...items, { role: "assistant", content: response.reply }]);
    } finally {
      setLoading(false);
    }
  }

  function quick(id: string) {
    if (id === "focus") go("focus");
    else go("rituals");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="min-h-[64vh] rounded-[8px] bg-white/50 p-4 shadow-soft">
        <div className="mb-4 space-y-3">
          {messages.map((message, index) => <ChatBubble key={index} {...message} />)}
          {loading && <ChatBubble role="assistant" content="Думаю мягко, без секундомера над душой..." />}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Напиши честно: устал, дедлайн, туплю, тревожно — всё принимается." className="min-w-0 flex-1 rounded-[8px] border border-white bg-cream px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint" />
          <button title="Отправить" onClick={send} className="grid h-12 w-12 place-items-center rounded-[8px] bg-graphite text-white"><Send size={19} /></button>
        </div>
      </section>
      <aside className="space-y-4">
        <QuickActionButtons onAction={quick} />
        <TirednessScoreCard state={state} />
        <MoodCard state={state} />
        {actions.length > 0 && <div className="rounded-[8px] bg-white/80 p-4 shadow-soft"><div className="mb-2 font-semibold text-graphite">Можно сейчас</div>{actions.map((action) => <button key={action.id} onClick={() => quick(action.id)} className="mb-2 block w-full rounded-[8px] bg-cream px-3 py-2 text-left text-sm text-graphite">{action.title}</button>)}</div>}
      </aside>
    </div>
  );
}

