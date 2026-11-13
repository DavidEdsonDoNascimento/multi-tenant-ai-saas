import { Bot, Loader2, SendHorizonal, Sparkles, TriangleAlert, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useChat, type ChatMessage } from "../lib/chat";
import type { ToolCallSummary } from "../types";

const SUGGESTIONS = [
  "Quais produtos vocês têm?",
  "Quais são os produtos mais baratos?",
  "Mostre produtos com preço entre R$ 200 e R$ 1.000",
  "Quais categorias existem no catálogo?",
];

function describeSearch(call: ToolCallSummary) {
  const a = call.arguments as Record<string, unknown>;
  const parts = [
    a.search && `“${a.search}”`,
    a.category && `categoria ${a.category}`,
    a.minPrice !== undefined && `≥ R$ ${a.minPrice}`,
    a.maxPrice !== undefined && `≤ R$ ${a.maxPrice}`,
  ].filter(Boolean);
  const result = call.resultCount === null ? "falhou" : `${call.resultCount} resultado${call.resultCount === 1 ? "" : "s"}`;
  return `${parts.join(" · ") || "todos os produtos"} — ${result}`;
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-slate-800 text-white" : isError ? "bg-red-100 text-red-600" : "bg-indigo-600 text-white"
        }`}
        aria-hidden
      >
        {isUser ? <User className="size-4" /> : isError ? <TriangleAlert className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={`flex max-w-[85%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-indigo-600 text-white"
              : isError
                ? "rounded-tl-sm border border-red-200 bg-red-50 text-red-800"
                : "rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-sm"
          }`}
        >
          {message.content}
        </div>
        {message.toolCalls?.map((call, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            <Sparkles className="size-3" aria-hidden /> Busca no catálogo: {describeSearch(call)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ChatPage() {
  const { messages, sending, send } = useChat();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setText("");
    void send(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Assistente IA</h1>
        <p className="mt-1 text-sm text-slate-500">Pergunte sobre os produtos da sua empresa. As respostas vêm de consultas reais ao catálogo.</p>
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Bot className="size-6" aria-hidden />
              </div>
              <p className="font-medium">Como posso ajudar?</p>
              <p className="mt-1 text-sm text-slate-500">Experimente uma destas perguntas:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => void send(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
          {sending && (
            <div className="flex items-center gap-3" role="status">
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white" aria-hidden>
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Consultando o catálogo…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={submit} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            aria-label="Mensagem"
            placeholder="Digite sua pergunta…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Enviar" className="flex size-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            <SendHorizonal className="size-4" />
          </button>
        </form>
      </div>
      <p className="mt-2 hidden text-center text-xs text-slate-400 sm:block">Enter envia · Shift+Enter quebra linha</p>
    </div>
  );
}
