import { NextResponse } from "next/server";
import {
  isInventoryQuestionInScope,
  isSensitiveOrTechnicalRequest,
  SIGN_IN_FOR_DETAILS,
  UNRELATED_MESSAGE,
  getInventoryAssistantReply,
} from "@/lib/chatbot/inventoryAssistant";
import { WEBSITE_INFO } from "@/lib/chatbot/websiteInfo";

type ChatTurn = { role: "user" | "assistant"; content: string };

function systemPrompt() {
  return [
    "Your role is to answer visitor questions about the platform and help users understand the website features.",
    "",
    "You can answer questions about:",
    "Inventory management",
    "Product tracking",
    "Supplier management",
    "Order management",
    "Stock updates",
    "User roles",
    "Login and account help",
    "Website navigation",
    "Platform features",
    "",
    "Rules:",
    "- Keep responses short, clear, and professional.",
    "- Only answer questions related to this website/platform (GoGodam).",
    `- If a question is unrelated, reply: "${UNRELATED_MESSAGE}"`,
    `- If information is unavailable, reply: "${SIGN_IN_FOR_DETAILS}"`,
    "- Never make up features.",
    "- Never expose sensitive user credentials, private keys, secrets, or raw database connection credentials.",
    "- You are allowed to explain our tech stack (Next.js, React, Supabase, Tailwind CSS) and our public pages (/login, /signup).",
    "- If the user asks for private/account-specific data, use the unavailable reply.",
    "",
    "Style:",
    "- Prefer 2–5 short sentences or bullets.",
    "- When helpful, suggest where to find it in the app (Inventory/Products/Orders/Suppliers/Deliveries) without assuming permissions.",
    "",
    "Examples:",
    `Q: "What is the weather today?"\nA: "${UNRELATED_MESSAGE}"`,
    `Q: "Can you show my organization's suppliers?"\nA: "${SIGN_IN_FOR_DETAILS}"`,
    "",
    "Website Information:",
    WEBSITE_INFO,
  ].join("\n");
}

function toTurns(history: unknown): ChatTurn[] {
  if (!Array.isArray(history)) return [];
  const turns: ChatTurn[] = [];
  for (const item of history.slice(-10)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;
    if ((role === "user" || role === "assistant") && typeof content === "string") {
      turns.push({ role, content: content.slice(0, 800) });
    }
  }
  return turns;
}

async function openRouterChat(args: { message: string; history: ChatTurn[] }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const messages = [
    { role: "system", content: systemPrompt() },
    ...args.history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: args.message },
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
        : {}),
      ...(process.env.OPENROUTER_APP_NAME
        ? { "X-Title": process.env.OPENROUTER_APP_NAME }
        : {}),
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct",
      temperature: 0.2,
      max_tokens: 180,
      messages,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  const record = data as Record<string, unknown>;
  const choices = record.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as Record<string, unknown>;
  const message = first.message as Record<string, unknown> | undefined;
  const text = message?.content;
  if (typeof text !== "string" || !text.trim()) return null;
  return text.trim();
}

function looksSensitive(answer: string) {
  return /\b(api|database|sql|token|key|credential|password|secret)\b/i.test(answer);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const record = body as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : "";
    const history = toTurns(record.history);

    if (!message.trim()) {
      return NextResponse.json({ answer: SIGN_IN_FOR_DETAILS });
    }

    if (!isInventoryQuestionInScope(message)) {
      return NextResponse.json({ answer: UNRELATED_MESSAGE });
    }

    if (isSensitiveOrTechnicalRequest(message)) {
      return NextResponse.json({ answer: SIGN_IN_FOR_DETAILS });
    }

    const ai = await openRouterChat({ message, history });
    if (ai && !looksSensitive(ai)) return NextResponse.json({ answer: ai });

    const fallback = getInventoryAssistantReply(message).answer;
    return NextResponse.json({ answer: fallback || SIGN_IN_FOR_DETAILS });
  } catch {
    return NextResponse.json({ answer: SIGN_IN_FOR_DETAILS });
  }
}
