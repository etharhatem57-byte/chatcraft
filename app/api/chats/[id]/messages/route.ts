import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { appendMessage, getChat, setAutomaticTitle } from "@/lib/data";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { cleanPlainText, forbiddenResponse, isSameOrigin } from "@/lib/security";
import { messageSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Context { params: Promise<{ id: string }> }

function demoReply(language: "en" | "ar", prompt: string) {
  const shortPrompt = prompt.replace(/\s+/g, " ").slice(0, 90);
  if (language === "ar") {
    return `فكرة رائعة. لنحوّل «${shortPrompt}» إلى خطوات واضحة وعملية.\n\n1. حدّد النتيجة الأهم التي تريد الوصول إليها.\n2. قسّمها إلى ثلاث مهام صغيرة قابلة للإنجاز.\n3. ابدأ بأبسط خطوة اليوم، ثم راجع ما تعلّمته.\n\nإذا شاركتني مزيدًا من السياق، يمكنني إعداد خطة أدق تناسب هدفك.`;
  }
  return `That’s a thoughtful direction. Let’s turn “${shortPrompt}” into a clear, practical path.\n\n1. Define the most important outcome you want.\n2. Break it into three small, achievable tasks.\n3. Start with the lightest step today, then review what you learned.\n\nShare a little more context and I can tailor the plan to your goal.`;
}

function createTextStream(text: string, onComplete: (content: string) => Promise<void>) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const words = text.split(/(\s+)/);
      try {
        for (let index = 0; index < words.length; index += 1) {
          controller.enqueue(encoder.encode(words[index]));
          if (index % 3 === 0) await new Promise((resolve) => setTimeout(resolve, 22));
        }
        await onComplete(text);
        controller.close();
      } catch (error) {
        console.error("Demo stream failed", error);
        controller.error(error);
      }
    },
  });
}

export async function POST(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();

  const limit = rateLimit(requestKey(request, "message", user.id), 20, 60_000);
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

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.includes("replace_me") || groqApiKey === "placeholder") {
    const reply = demoReply(chat.language, content);
    const stream = createTextStream(reply, async (complete) => {
      await appendMessage(user.id, id, "assistant", complete);
    });
    return new Response(stream, { headers });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const systemPrompt = chat.language === "ar"
      ? "أنت مساعد ذكي هادئ ومفيد. أجب بالعربية الواضحة ما لم يطلب المستخدم لغة أخرى. استخدم تنسيقًا بسيطًا وموجزًا، ولا تدّعِ اليقين عندما تكون غير متأكد."
      : "You are a calm, capable, and helpful AI assistant. Reply in clear English unless the user asks for another language. Use simple, concise formatting and acknowledge uncertainty.";

    const history = [...chat.messages, { ...saved, role: "user" as const, content }]
      .slice(-24)
      .map((message) => ({ role: message.role, content: message.content }));

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...history],
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
          if (complete.trim()) await appendMessage(user.id, id, "assistant", complete);
          controller.close();
        } catch (error) {
          console.error("Groq stream interrupted", error);
          if (complete.trim()) await appendMessage(user.id, id, "assistant", complete);
          controller.error(error);
        }
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error("Groq request failed", error);
    return NextResponse.json({ error: "AI service is temporarily unavailable.", code: "AI_UNAVAILABLE" }, { status: 502 });
  }
}
