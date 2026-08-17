import type { ChatDTO, MessageDTO } from "@/types";

export type ExportFormat = "md" | "txt" | "json";

export function sanitizeFilename(name: string): string {
  const sanitized = name
    .trim()
    .replace(/[\\/*?:"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
  return sanitized || "chatcraft_export";
}

export function downloadFile(filename: string, content: string, mimeType = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function formatConversationMarkdown(chat: Pick<ChatDTO, "title" | "language" | "messages">): string {
  const header = `# ${chat.title}\n\n*Language: ${chat.language === "ar" ? "العربية (Arabic)" : "English"}*\n*Exported from ChatCraft on ${new Date().toLocaleString()}*\n\n---\n\n`;
  const body = chat.messages
    .map((msg) => {
      const sender = msg.role === "user" ? "User" : "ChatCraft";
      const time = new Date(msg.timestamp).toLocaleString();
      return `### ${sender} (${time})\n\n${msg.content}\n`;
    })
    .join("\n---\n\n");
  return header + body;
}

export function formatConversationPlainText(chat: Pick<ChatDTO, "title" | "language" | "messages">): string {
  const header = `${chat.title.toUpperCase()}\nLanguage: ${chat.language === "ar" ? "العربية" : "English"}\nExported: ${new Date().toLocaleString()}\n${"=".repeat(40)}\n\n`;
  const body = chat.messages
    .map((msg) => {
      const sender = msg.role === "user" ? "User" : "ChatCraft";
      const time = new Date(msg.timestamp).toLocaleString();
      return `[${sender} - ${time}]\n${msg.content}\n`;
    })
    .join(`\n${"-".repeat(30)}\n\n`);
  return header + body;
}

export function formatConversationJson(chat: Pick<ChatDTO, "title" | "language" | "messages">): string {
  return JSON.stringify(
    {
      title: chat.title,
      language: chat.language,
      exportedAt: new Date().toISOString(),
      messages: chat.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    },
    null,
    2
  );
}

export function downloadConversation(
  chat: Pick<ChatDTO, "title" | "language" | "messages">,
  format: ExportFormat = "md"
) {
  const baseName = sanitizeFilename(chat.title);
  if (format === "json") {
    downloadFile(`${baseName}.json`, formatConversationJson(chat), "application/json;charset=utf-8");
  } else if (format === "txt") {
    downloadFile(`${baseName}.txt`, formatConversationPlainText(chat), "text/plain;charset=utf-8");
  } else {
    downloadFile(`${baseName}.md`, formatConversationMarkdown(chat), "text/markdown;charset=utf-8");
  }
}

export function downloadSingleMessage(
  message: MessageDTO,
  chatTitle?: string,
  format: "md" | "txt" = "md"
) {
  const roleLabel = message.role === "user" ? "user" : "assistant";
  const prefix = chatTitle ? sanitizeFilename(chatTitle) : "message";
  const time = new Date(message.timestamp).toLocaleString();
  const baseName = `${prefix}_${roleLabel}_${message.id.slice(-6)}`;

  if (format === "txt") {
    const content = `Message from ${message.role === "user" ? "User" : "ChatCraft"}\nDate: ${time}\n\n${message.content}\n`;
    downloadFile(`${baseName}.txt`, content, "text/plain;charset=utf-8");
  } else {
    const content = `# Message from ${message.role === "user" ? "User" : "ChatCraft"}\n\n*Date: ${time}*\n\n---\n\n${message.content}\n`;
    downloadFile(`${baseName}.md`, content, "text/markdown;charset=utf-8");
  }
}
