import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ToolCallSummary } from "../types";
import { api } from "./api";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "error";
  content: string;
  toolCalls?: ToolCallSummary[];
}

interface ChatState {
  messages: ChatMessage[];
  sending: boolean;
  send: (text: string) => Promise<void>;
}

const ChatContext = createContext<ChatState | null>(null);

/** Mantém o histórico enquanto o usuário navega entre telas; é descartado no logout (Layout desmonta). */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const send = useCallback(
    async (text: string) => {
      const history = messages.filter((m) => m.role !== "error").slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const id = Date.now();
      setMessages((m) => [...m, { id, role: "user", content: text }]);
      setSending(true);
      try {
        const res = await api.chat(text, history);
        setMessages((m) => [...m, { id: id + 1, role: "assistant", content: res.reply, toolCalls: res.toolCalls }]);
      } catch (err) {
        setMessages((m) => [...m, { id: id + 1, role: "error", content: (err as Error).message }]);
      } finally {
        setSending(false);
      }
    },
    [messages],
  );

  const value = useMemo(() => ({ messages, sending, send }), [messages, sending, send]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat fora do ChatProvider");
  return ctx;
}
