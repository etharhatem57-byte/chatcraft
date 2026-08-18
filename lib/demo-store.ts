import { randomUUID } from "crypto";
import type { ChatDTO, Language, MessageRole, PublicUser } from "@/types";

export interface DemoUser extends PublicUser {
  passwordHash: string;
}

interface DemoStore {
  users: Map<string, DemoUser>;
  chats: Map<string, ChatDTO>;
}

const globalForDemo = globalThis as typeof globalThis & {
  chatcraftDemoStore?: DemoStore;
};

const DEFAULT_DEMO_USER_ID = "demo-user-default-id";
const DEFAULT_DEMO_USER: DemoUser = {
  id: DEFAULT_DEMO_USER_ID,
  name: "Demo User",
  email: "demo@chatcraft.ai",
  passwordHash: "$2b$10$V8HkO6d8/R6sv2AKQ.raXulm0/6.ChJYtuqBCLIy9KoRIoUA5F8li", // "password123"
  language: "en",
  createdAt: new Date().toISOString(),
};

function initDemoStore(): DemoStore {
  const users = new Map<string, DemoUser>();
  const chats = new Map<string, ChatDTO>();
  users.set(DEFAULT_DEMO_USER.id, { ...DEFAULT_DEMO_USER });
  return { users, chats };
}

export const demoStore: DemoStore =
  globalForDemo.chatcraftDemoStore ?? initDemoStore();

globalForDemo.chatcraftDemoStore = demoStore;

export function createDemoUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  language: Language;
}): DemoUser {
  const now = new Date().toISOString();
  const user: DemoUser = { id: randomUUID(), createdAt: now, ...input };
  demoStore.users.set(user.id, user);
  return user;
}

export function createDemoChat(userId: string, language: Language): ChatDTO {
  const now = new Date().toISOString();
  const chat: ChatDTO = {
    id: randomUUID(),
    userId,
    title: language === "ar" ? "محادثة جديدة" : "New conversation",
    language,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  demoStore.chats.set(chat.id, chat);
  return chat;
}

export function appendDemoMessage(chatId: string, role: MessageRole, content: string) {
  const chat = demoStore.chats.get(chatId);
  if (!chat) return null;
  const message = {
    id: randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  chat.messages.push(message);
  chat.updatedAt = message.timestamp;
  demoStore.chats.set(chatId, chat);
  return message;
}
