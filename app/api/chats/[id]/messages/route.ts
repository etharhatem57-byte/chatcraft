import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { appendMessage, getChat, setAutomaticTitle } from "@/lib/data";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { cleanPlainText, forbiddenResponse, isSameOrigin } from "@/lib/security";
import { messageSchema } from "@/lib/validation";
import { createAssistantTextStream, generateSmartAssistantReply } from "@/lib/ai-assistant";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();

  const limit = rateLimit(requestKey(request, "message", user.id), 30, 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required.", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { id } = await context.params;
  const chat = await getChat(user.id, id);
  if (!chat) {
    return NextResponse.json({ error: "Conversation not found.", code: "NOT_FOUND" }, { status: 404 });
  }

  const content = cleanPlainText(parsed.data.content, 8000);
  if (!content) {
    return NextResponse.json({ error: "Message is required.", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const saved = await appendMessage(user.id, id, "user", content);
  if (!saved) {
    return NextResponse.json({ error: "Unable to save message.", code: "SERVER_ERROR" }, { status: 500 });
  }
  await setAutomaticTitle(user.id, id, content, chat.language);

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };

  const historyMessages = [...chat.messages, { ...saved, role: "user" as const, content }]
    .slice(-24)
    .map((msg) => ({ role: msg.role, content: msg.content }));

  const groqApiKey = process.env.GROQ_API_KEY;
  const isGroqConfigured =
    Boolean(groqApiKey) &&
    !groqApiKey?.includes("replace_me") &&
    groqApiKey !== "placeholder";

  if (!isGroqConfigured) {
    const reply = generateSmartAssistantReply(chat.language, content, historyMessages);
    const stream = createAssistantTextStream(reply, async (complete) => {
      await appendMessage(user.id, id, "assistant", complete);
    });
    return new Response(stream, { headers });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const systemPrompt =
      chat.language === "ar"
        ? "أنت مساعد ذكي هادئ ومفيد. أجب بالعربية الواضحة ما لم يطلب المستخدم لغة أخرى. استخدم تنسيقًا بسيطًا وموجزًا وعناصر Markdown جميلة للشفرات والتنسيقات."
        : "You are a calm, capable, and helpful AI assistant. Reply in clear English unless the user asks for another language. Use structured formatting and beautiful Markdown for code and explanations.";

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...historyMessages],
      temperature: 0.7,
      max_completion_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let complete = "";
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (!delta) continue;
            complete += delta;
            controller.enqueue(encoder.encode(delta));
          }
          if (complete.trim()) {
            await appendMessage(user.id, id, "assistant", complete);
          }
          controller.close();
        } catch (streamError) {
          console.error("Groq stream interrupted, falling back to smart reply", streamError);
          // If Groq stream broke midway with no content, generate fallback
          if (!complete.trim()) {
            const fallbackReply = generateSmartAssistantReply(chat.language, content, historyMessages);
            controller.enqueue(encoder.encode(fallbackReply));
            await appendMessage(user.id, id, "assistant", fallbackReply);
          } else {
            await appendMessage(user.id, id, "assistant", complete);
          }
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.warn("Groq request failed, using smart assistant engine fallback:", error);
    // Graceful fallback to rich intelligent assistant reply so message never fails!
    const reply = generateSmartAssistantReply(chat.language, content, historyMessages);
    const stream = createAssistantTextStream(reply, async (complete) => {
      await appendMessage(user.id, id, "assistant", complete);
    });
    return new Response(stream, { headers });
  }
}
