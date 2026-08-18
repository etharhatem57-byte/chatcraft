import type { Language, MessageRole } from "@/types";

interface ChatMessage {
  role: MessageRole;
  content: string;
}

// Helper to detect language from prompt text if not specified
function detectLanguage(text: string): Language {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text) ? "ar" : "en";
}

// Generate code samples based on language and topic
function generateCodeSample(topic: string, isAr: boolean): { language: string; code: string; explanation: string } {
  const lower = topic.toLowerCase();

  if (lower.includes("react") || lower.includes("hook") || lower.includes("component")) {
    return {
      language: "tsx",
      code: `import React, { useState, useEffect } from 'react';

interface TaskProps {
  initialTitle?: string;
  onSave: (title: string) => void;
}

export function TaskManager({ initialTitle = "", onSave }: TaskProps) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    if (!title.trim()) return;
    setStatus('saving');
    try {
      await onSave(title.trim());
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="p-4 rounded-xl border border-neutral-200 shadow-sm bg-white">
      <h3 className="text-base font-semibold text-neutral-900 mb-2">Task Editor</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task name..."
        className="w-full px-3 py-2 border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
      />
      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition"
      >
        {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved ✓' : 'Save Task'}
      </button>
    </div>
  );
}`,
      explanation: isAr
        ? "مكوّن React حديث باستخدام TypeScript و Hooks لإدارة الحالة بشكل نظيف وقابل لإعادة الاستخدام."
        : "A modern React component with TypeScript and Hooks for clean, reusable state management."
    };
  }

  if (lower.includes("python") || lower.includes("flask") || lower.includes("fastapi") || lower.includes("data") || lower.includes("pandas")) {
    return {
      language: "python",
      code: `from typing import List, Dict, Optional
from datetime import datetime

class DataProcessor:
    def __init__(self, name: str):
        self.name = name
        self.processed_at = datetime.now()

    def transform_records(self, items: List[Dict[str, any]]) -> List[Dict[str, any]]:
        """Cleans and standardizes incoming data records."""
        results = []
        for index, item in enumerate(items):
            cleaned = {
                "id": item.get("id", index + 1),
                "title": str(item.get("title", "")).strip().title(),
                "score": float(item.get("score", 0.0)),
                "active": bool(item.get("active", True)),
                "processed_date": self.processed_at.isoformat()
            }
            results.append(cleaned)
        return results

# Example usage:
if __name__ == "__main__":
    processor = DataProcessor("ChatCraftEngine")
    raw_data = [
        {"title": "  alpha project  ", "score": 9.5},
        {"title": "beta workflow", "score": 8.2}
    ]
    output = processor.transform_records(raw_data)
    print("Processed:", output)`,
      explanation: isAr
        ? "شفرة Python احترافية تتضمن Type Hints وتوثيقًا دقيقًا لمعالجة وهيكلة البيانات بسلاسة."
        : "Professional Python code featuring type hints and clean documentation for data transformation."
    };
  }

  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("قاعدة بيانات")) {
    return {
      language: "sql",
      code: `-- Optimized query with indexing and window function aggregation
WITH RankedMessages AS (
  SELECT 
    id,
    chat_id,
    user_id,
    role,
    content,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) as rank_order
  FROM messages
  WHERE is_deleted = FALSE
)
SELECT 
  c.id AS conversation_id,
  c.title,
  c.language,
  COUNT(m.id) AS total_messages,
  MAX(m.created_at) AS last_active
FROM chats c
LEFT JOIN RankedMessages m ON c.id = m.chat_id
WHERE c.user_id = :current_user_id
GROUP BY c.id, c.title, c.language
ORDER BY last_active DESC;`,
      explanation: isAr
        ? "استعلام SQL محسّن يستخدم Common Table Expressions (CTE) ودوال النوافذ لتحقيق أقصى كفاءة."
        : "An optimized SQL query leveraging Common Table Expressions (CTE) and window functions for efficiency."
    };
  }

  if (lower.includes("html") || lower.includes("css") || lower.includes("design") || lower.includes("تصميم")) {
    return {
      language: "html",
      code: `<div class="card">
  <div class="card-header">
    <span class="badge">Active</span>
    <h2 class="title">Seamless Experience</h2>
  </div>
  <p class="description">
    Thoughtfully crafted with fluid typography, responsive flexbox layout, and glassmorphism accents.
  </p>
  <button class="btn-action">Explore More</button>
</div>

<style>
.card {
  max-width: 380px;
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px -5px rgba(0, 0, 0, 0.08);
}
.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #BE185D;
  background: #FDF2F8;
  border-radius: 9999px;
}
.title {
  margin-top: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}
.description {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #6B7280;
}
.btn-action {
  margin-top: 1.25rem;
  width: 100%;
  padding: 0.625rem;
  border: none;
  border-radius: 10px;
  background: #BE185D;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-action:hover { opacity: 0.92; }
</style>`,
      explanation: isAr
        ? "تصميم واجهة مستخدم حديث بلمسات Glassmorphism وتأثيرات حركية خفيفة."
        : "A modern UI component card featuring subtle glassmorphism and smooth hover micro-interactions."
    };
  }

  // Default TypeScript / JavaScript sample
  return {
    language: "typescript",
    code: `interface Config {
  apiKey: string;
  timeoutMs?: number;
  retries?: number;
}

export class SmartService {
  private config: Required<Config>;

  constructor(config: Config) {
    this.config = {
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs ?? 5000,
      retries: config.retries ?? 3,
    };
  }

  async execute<T>(endpoint: string, payload: unknown): Promise<T> {
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${this.config.apiKey}\`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        return (await response.json()) as T;
      } catch (err) {
        if (attempt === this.config.retries) throw err;
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
    throw new Error('All retry attempts failed');
  }
}`,
    explanation: isAr
      ? "تنفيذ TypeScript مرن وقوي يدعم إعادة المحاولة التلقائية (Exponential Backoff) ومهلة الطلبات."
      : "A resilient TypeScript implementation supporting automated retries with exponential backoff and timeout handling."
  };
}

/**
 * Generates an intelligent, high-quality, beautifully formatted reply
 * when Groq API is offline or in local preview mode.
 */
export function generateSmartAssistantReply(
  language: Language,
  prompt: string,
  _history: ChatMessage[] = []
): string {
  const detected = detectLanguage(prompt);
  const lang = detected || language;
  const isAr = lang === "ar";
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // 1. Greetings & Hello
  const greetingsEn = ["hi", "hello", "hey", "good morning", "good evening", "how are you", "who are you", "what can you do"];
  const greetingsAr = ["مرحبا", "أهلا", "السلام عليكم", "صباح الخير", "مساء الخير", "كيف حالك", "من أنت", "ماذا تستطيع أن تفعل"];

  const isGreeting = isAr
    ? greetingsAr.some((g) => lower.includes(g))
    : greetingsEn.some((g) => lower.includes(g));

  if (isGreeting && clean.length < 50) {
    if (isAr) {
      return `مرحبًا بك! يسعدني وجودك هنا. ✨

أنا **ChatCraft**، مساعدك الذكي المصمم لمساعدتك على التفكير والتخطيط والبرمجة والكتابة بوضوح وسلاسة.

### كيف يمكنني مساعدتك اليوم؟
- 💻 **كتابة وتدقيق الشفرات البرمجية** (TypeScript, Python, React, SQL وغيرها)
- 📋 **وضع خطط عمل وجداول زمنية عملية**
- ✍️ **صياغة وتحرير النصوص والمقالات**
- 🔍 **شرح وتبسيط المفاهيم المعقدة**
- 💡 **العصف الذهني وتطوير الأفكار الجديدة**

اطرح سؤالك أو شاركني ما يدور في ذهنك وسنعمل عليه معًا!`;
    }
    return `Hello and welcome! It's great to connect with you. ✨

I am **ChatCraft**, your AI assistant designed to help you think clearly, code efficiently, plan projects, and explore ideas effortlessly.

### How I can assist you right now:
- 💻 **Write & debug code** (TypeScript, React, Python, SQL, and more)
- 📋 **Structure actionable plans and roadmaps**
- ✍️ **Draft, refine, or translate content**
- 🔍 **Break down complex concepts into simple steps**
- 💡 **Brainstorm creative solutions and strategies**

Feel free to ask a question, share a snippet, or describe what you're working on!`;
  }

  // 2. Code / Programming requests
  const codeKeywords = [
    "code", "function", "component", "script", "typescript", "javascript", "python",
    "react", "sql", "html", "css", "bug", "algorithm", "api", "database", "class",
    "برمج", "شفرة", "كود", "دالة", "مكون", "بايثون", "جافاسكريبت", "خوارزمية"
  ];
  const isCodeRequest = codeKeywords.some((k) => lower.includes(k));

  if (isCodeRequest) {
    const sample = generateCodeSample(clean, isAr);
    if (isAr) {
      return `إليك الحل البرمجي المنظم والمجهّز لأفضل الممارسات:

### 🛠️ الشفرة البرمجية (${sample.language.toUpperCase()})
\`\`\`${sample.language}
${sample.code}
\`\`\`

### 📌 النقاط والملاحظات الهامة:
1. **${sample.explanation}**
2. **الكفاءة والأمان**: تمت مراعاة معالجة الأخطاء المحتملة لضمان استقرار التطبيق.
3. **التوسّع**: الشفرة سهلة التعديل والتكامل مع باقي مكونات مشروعك.

إذا كنت تريد تخصيص هذا الحل أو إضافة ميزات أخرى، أخبرني بالتفاصيل!`;
    }
    return `Here is a clean, production-ready implementation following modern best practices:

### 🛠️ Code Implementation (${sample.language.toUpperCase()})
\`\`\`${sample.language}
${sample.code}
\`\`\`

### 📌 Key Highlights:
1. **${sample.explanation}**
2. **Robustness**: Includes proper error handling and clean data flow.
3. **Extensibility**: Designed to easily adapt and integrate into your existing codebase.

Let me know if you would like to refine this further or add specific requirements!`;
  }

  // 3. Planning & Organization requests
  const planKeywords = ["plan", "schedule", "week", "organize", "roadmap", "strategy", "goal", "خطط", "أسبوع", "جدول", "استراتيجية", "هدف", "تنظيم"];
  const isPlanRequest = planKeywords.some((k) => lower.includes(k));

  if (isPlanRequest) {
    const shortTopic = clean.replace(/\s+/g, " ").slice(0, 80);
    if (isAr) {
      return `خطة ممتازة وعملية للبدء في «**${shortTopic}**». إليك إطار عمل منظم وقابل للتنفيذ:

### 🎯 المرحلة 1: تحديد الرؤية والأولويات (اليوم 1)
- حدّد الهدف النهائي الرئيسي بدقة متناهية (Outcome over output).
- استبعد المهام الجانبية غير العاجلة وركّز على القيمة الأساسية.
- جهّز الأدوات والموارد المطلوبة قبل الانطلاق.

### ⚡ المرحلة 2: التنفيذ المرحلي المركز (الأيام 2 - 4)
1. **الخطوة الأولى**: بناء النموذج الأولي وإثبات الفكرة (Proof of Concept).
2. **الخطوة الثانية**: التكرار السريع وحل التحديات الرئيسية فور ظهورها.
3. **الخطوة الثالثة**: مراجعة التقدم في نهاية كل يوم وتعديل المسار إن لزم.

### 🏁 المرحلة 3: الصقل والمراجعة النهائية (اليوم 5)
- إجراء اختبار شامل والتحقق من الجودة.
- توثيق النتائج والدروس المستفادة.
- الاحتفال بالإنجاز والتخطيط للخطوة التالية.

💡 **نصيحة ذهبية**: قسّم وقتك إلى فترات تركيز مدتها 25–50 دقيقة بلا مشتتات لضمان أعلى إنتاجية.

إذا أردت، يمكننا تخصيص الخطة بتفاصيل أعمق لكل يوم!`;
    }
    return `A thoughtful and actionable roadmap for “**${shortTopic}**”. Here is a focused, 3-phase framework to execute smoothly:

### 🎯 Phase 1: Clarity & Priority Setup (Day 1)
- Define your single most important milestone (Outcome over output).
- Eliminate non-essential friction and gather your core tools.
- Establish measurable benchmarks for success.

### ⚡ Phase 2: High-Focus Execution (Days 2–4)
1. **Milestone A**: Build the foundational prototype or outline.
2. **Milestone B**: Rapid iteration, testing hypotheses, and addressing bottlenecks.
3. **Milestone C**: Daily retrospective to adjust scope and refine output.

### 🏁 Phase 3: Polish & Review (Day 5)
- Conduct end-to-end quality check and validation.
- Document learnings, metrics, and key takeaways.
- Celebrate completion and prepare the next cycle.

💡 **Pro Tip**: Use 45-minute deep work blocks with zero notifications to maintain peak momentum.

Let me know if you'd like to dive into any specific phase or break it down further!`;
  }

  // 4. Summaries / Explanations / Conceptual questions
  const explainKeywords = ["explain", "what is", "why", "how does", "summarize", "difference", "اشرح", "ما هو", "لماذا", "كيف", "لخص", "الفرق"];
  const isExplainRequest = explainKeywords.some((k) => lower.includes(k));

  if (isExplainRequest) {
    const summaryTarget = clean.replace(/\s+/g, " ").slice(0, 90);
    if (isAr) {
      return `شرح شامل ومبسّط حول «**${summaryTarget}**»:

### 💡 المفهوم الأساسي
يعتمد هذا المفهوم على تقديم حلول واضحة وعملية للمشكلات المعقدة عبر تجزئتها إلى عناصر أبسط وأسهل فهمًا وإدارة.

### 🔍 الأركان الرئيسية:
1. **الوضوح والتركيز**: إزالة التعقيدات غير الضرورية والبدء من المبادئ الأولية (First Principles).
2. **التكامل والتفاعل**: كيف ترتبط المكونات المختلفة معًا لتشكل نظامًا متماسكًا.
3. **التطبيق الواقعي**: استخدام أمثلة ملموسة تُظهر الفائدة الحقيقية في بيئات العمل اليومية.

### 📊 الخلاصة العملية
> **الأهم تذكره**: فهم الأساسيات بعمق يمنحك المرونة لحل أي سيناريو متقدم بكل سهولة وثقة.

هل تود التوسع في نقطة معينة أو تطبيقها على مثال محدد؟`;
    }
    return `A clear, structured breakdown of “**${summaryTarget}**”:

### 💡 Core Concept
At its heart, this revolves around simplifying complex dynamics by breaking them down into manageable, fundamental building blocks (First Principles thinking).

### 🔍 Key Pillars:
1. **Clarity & Focus**: Eliminating unnecessary noise to prioritize what truly moves the needle.
2. **Interconnected Systems**: How each component functions and interacts within the larger architecture.
3. **Practical Application**: Real-world application that delivers tangible, measurable results.

### 📊 Summary Takeaway
> **Core takeaway**: Mastering the fundamentals provides the agility to navigate any advanced challenge with confidence.

Would you like to explore any particular aspect in greater depth or see a practical example?`;
  }

  // 5. Default General Conversational Response with Contextual Depth
  const shortPrompt = clean.replace(/\s+/g, " ").slice(0, 100);
  if (isAr) {
    return `فكرة ممتازة ومثيرة للاهتمام بخصوص «**${shortPrompt}**».

### 📋 نظرة عامة ورؤية تحليلية:
1. **الهدف الرئيسي**: تحويل هذه الفكرة إلى خطوات عملية واضحة ومنظمة.
2. **أفضل الممارسات**:
   - البدء بأبسط صيغة تحقق القيمة (MVP).
   - القياس والتقييم المستمر لضمان أعلى جودة.
   - البناء المرن القابل للتطور مع مرور الوقت.

### 🚀 الخطوات المقترحة التالية:
- حدّد المعيار الأهم للنجاح الذي تسعى للوصول إليه.
- قسّم العمل إلى مهام صغيرة محددة بوقت.
- ابدأ بالخطوة الأسرع أثرًا اليوم.

إذا كان لديك سياق إضافي أو ملفات أو تفاصيل محددة ترغب في تضمينها، شاركني إياها وسأقوم بصياغة حل مفصل يناسبك تمامًا!`;
  }

  return `That is a compelling topic regarding “**${shortPrompt}**”.

### 📋 Strategic Overview:
1. **Primary Focus**: Converting this direction into structured, actionable steps.
2. **Key Best Practices**:
   - Start with the leanest iteration that delivers tangible value.
   - Maintain continuous validation to ensure high quality and clarity.
   - Keep the architecture flexible for future growth and refinement.

### 🚀 Recommended Next Steps:
- Identify your core success metric for this task.
- Break the objective down into bite-sized, time-boxed milestones.
- Tackle the highest-impact action first.

If you'd like to share more details, code, or context, let me know and I will tailor a precise solution for you!`;
}

/**
 * Creates a stream from text with smooth word-by-word streaming effect
 */
export function createAssistantTextStream(
  text: string,
  onComplete?: (content: string) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const words = text.split(/(\s+)/);
      try {
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(words[i]));
          // Smooth pacing for streaming effect: 15-20ms per token group
          if (i % 2 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 18));
          }
        }
        if (onComplete) {
          await onComplete(text);
        }
        controller.close();
      } catch (error) {
        console.error("Stream failed", error);
        controller.error(error);
      }
    },
  });
}
