export default function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] whitespace-pre-wrap rounded-[8px] px-4 py-3 text-sm leading-relaxed shadow-soft ${role === "user" ? "bg-graphite text-white" : "bg-cream text-graphite"}`}>
        {content}
      </div>
    </div>
  );
}

