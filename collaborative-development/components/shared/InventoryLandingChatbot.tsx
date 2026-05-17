"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getInventoryAssistantReply,
  SIGN_IN_FOR_DETAILS,
} from "@/lib/chatbot/inventoryAssistant";
import Link from "next/link";
import { Loader2, MessageCircle, RotateCcw, X } from "lucide-react";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

const STORAGE_KEY = "inventory_landing_chat_v1";

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "hello",
    role: "assistant",
    text: "Hi! Ask me about the inventory & logistics system (features, roles, inventory, orders, suppliers, login, or navigation).",
  },
];

function loadInitialMessages(): ChatMessage[] {
  if (typeof window === "undefined") return DEFAULT_MESSAGES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MESSAGES;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_MESSAGES;
    const safe = parsed
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          "id" in m &&
          "role" in m &&
          "text" in m &&
          typeof (m as Record<string, unknown>).id === "string" &&
          (((m as Record<string, unknown>).role as unknown) === "user" ||
            ((m as Record<string, unknown>).role as unknown) === "assistant") &&
          typeof (m as Record<string, unknown>).text === "string",
      )
      .slice(-30);
    return safe.length > 0 ? safe : DEFAULT_MESSAGES;
  } catch {
    return DEFAULT_MESSAGES;
  }
}

export default function InventoryLandingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(loadInitialMessages);
  const [isReplying, setIsReplying] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  function makeId() {
    idRef.current += 1;
    return `m_${idRef.current}`;
  }

  function pushMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isReplying) return;

    setLastError(null);
    pushMessage({ id: makeId(), role: "user", text: trimmed });
    setIsReplying(true);

    try {
      const res = await fetch("/api/landing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.text }))
            .slice(-10),
        }),
      });

      const data = (await res.json()) as unknown;
      const answer =
        typeof (data as Record<string, unknown>)?.answer === "string"
          ? ((data as Record<string, unknown>).answer as string)
          : SIGN_IN_FOR_DETAILS;
      pushMessage({ id: makeId(), role: "assistant", text: answer });
    } catch {
      const fallback = getInventoryAssistantReply(trimmed).answer;
      setLastError("Network error — showing a basic answer.");
      pushMessage({ id: makeId(), role: "assistant", text: fallback });
    } finally {
      setIsReplying(false);
    }

    setInput("");
  }

  function resetChat() {
    setMessages(DEFAULT_MESSAGES);
    setInput("");
    setLastError(null);
    setIsReplying(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {open ? (
        <div className="w-[340px] sm:w-[380px] h-[520px] rounded-3xl border border-zinc-200 bg-white shadow-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold leading-tight">Help Assistant</p>
              <p className="text-xs text-zinc-500">Inventory & logistics questions</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetChat}
                className="rounded-full p-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                aria-label="Reset chat"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-primary text-white"
                    : "mr-auto bg-zinc-100 text-zinc-900",
                ].join(" ")}
              >
                {m.text}
              </div>
            ))}
            {isReplying ? (
              <div className="mr-auto inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm bg-zinc-100 text-zinc-700">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Thinking…
              </div>
            ) : null}
          </div>

          <div className="px-4 py-3 border-t border-zinc-100 bg-white">
            {lastError ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 mb-2">
                {lastError}
              </p>
            ) : null}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question…"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                className="flex-1 resize-none rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary max-h-24"
                aria-label="Chat message"
              />
              <button
                type="submit"
                disabled={!canSend || isReplying}
                className="rounded-2xl bg-primary text-white px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed min-w-[76px] flex items-center justify-center gap-2"
              >
                {isReplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Sending
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </form>
            <p className="pt-2 text-[11px] text-zinc-500">
              Press Enter to send • Shift+Enter for a new line
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-shadow flex items-center justify-center"
          aria-label="Open help chat"
        >
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
          <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow">
            Help assistant
          </span>
        </button>
      )}
    </div>
  );
}
