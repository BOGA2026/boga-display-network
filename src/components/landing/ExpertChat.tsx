import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import logoVisualia from "@/assets/simbolo-visualia.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ExpertChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpertChat = ({ open, onOpenChange }: ExpertChatProps) => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy tu asesor de Visualia. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || "Error de conexión");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e.message || "Lo siento, hubo un error. Intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[998] transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          background: "hsl(0 0% 0% / 0.4)",
          backdropFilter: "blur(2px)",
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Chat panel */}
      <div
        className="fixed bottom-4 right-4 z-[999] flex flex-col overflow-hidden rounded-2xl sm:bottom-6 sm:right-6"
        style={{
          width: "min(400px, calc(100vw - 32px))",
          height: "min(600px, calc(100vh - 100px))",
          background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 30% 6%) 100%)",
          border: "1px solid hsl(270 100% 60% / 0.3)",
          boxShadow: "0 0 40px 8px hsl(270 100% 50% / 0.15), 0 25px 50px -12px hsl(0 0% 0% / 0.5)",
          transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(270 20% 18%)" }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "hsl(270 100% 50% / 0.15)", border: "1px solid hsl(270 100% 60% / 0.3)" }}
          >
            <img src={logoVisualia} alt="" className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Experto Visualia</p>
            <p className="text-[11px]" style={{ color: "hsl(150 80% 55%)" }}>● En línea</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: "hsl(270 20% 15%)" }}
            aria-label="Cerrar chat"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: "hsl(270 80% 50%)",
                        color: "white",
                        borderBottomRightRadius: 6,
                      }
                    : {
                        background: "hsl(270 15% 16%)",
                        color: "hsl(0 0% 88%)",
                        borderBottomLeftRadius: 6,
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
                style={{ background: "hsl(270 15% 16%)", color: "hsl(0 0% 60%)" }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "hsl(270 100% 70%)" }} />
                Escribiendo...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ borderTop: "1px solid hsl(270 20% 15%)" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "hsl(260 20% 10%)", border: "1px solid hsl(270 30% 20%)" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-30"
              style={{ background: "hsl(270 80% 50%)" }}
              aria-label="Enviar"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ExpertChat;
