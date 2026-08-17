import mongoose from "mongoose";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { connectMongoDB, isDemoMode } from "@/lib/mongodb";
import { appendDemoMessage, createDemoChat, createDemoUser, demoStore } from "@/lib/demo-store";
import type { ChatDTO, ChatSummary, Language, MessageRole, PublicUser } from "@/types";

interface RawUser {
  _id?: unknown;
  id?: string;
  name: string;
  email: string;
  language: Language;
  createdAt: Date | string;
}

interface RawMessage {
  _id?: unknown;
  id?: string;
  role: MessageRole;
  content: string;
  timestamp: Date | string;
}

interface RawChat {
  _id?: unknown;
  id?: string;
  userId: unknown;
  title: string;
  language: Language;
  messages?: RawMessage[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UserWithPassword extends PublicUser {
  passwordHash: string;
}

function iso(value: unknown): string {
  return new Date(value as string | number | Date).toISOString();
}

function publicUser(document: unknown): PublicUser {
  const doc = document as RawUser;
  return {
    id: String(doc._id ?? doc.id),
    name: doc.name,
    email: doc.email,
    language: doc.language,
    createdAt: iso(doc.createdAt),
  };
}

function chatDTO(document: unknown): ChatDTO {
  const doc = document as RawChat;
  return {
    id: String(doc._id ?? doc.id),
    userId: String(doc.userId),
    title: doc.title,
    language: doc.language,
    messages: (doc.messages ?? []).map((message) => ({
      id: String(message._id ?? message.id),
      role: message.role,
      content: message.content,
      timestamp: iso(message.timestamp),
    })),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  language: Language;
}): Promise<PublicUser> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const preparedInput = { ...input, email: normalizedEmail };
  if (isDemoMode()) {
    if ([...demoStore.users.values()].some((user) => user.email.trim().toLowerCase() === normalizedEmail)) {
      const error = new Error("Email exists") as Error & { code: number };
      error.code = 11000;
      throw error;
    }
    return publicUser(createDemoUser(preparedInput));
  }

  await connectMongoDB();
  const user = await User.create(preparedInput);
  return publicUser(user);
}

export async function findUserByEmailForAuth(email: string): Promise<UserWithPassword | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (isDemoMode()) {
    const user = [...demoStore.users.values()].find(
      (item) => item.email.trim().toLowerCase() === normalizedEmail
    );
    return user ? clone(user) : null;
  }

  await connectMongoDB();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash").lean();
  if (!user) return null;
  return { ...publicUser(user), passwordHash: user.passwordHash };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  if (isDemoMode()) {
    const user = demoStore.users.get(id);
    return user ? publicUser(user) : null;
  }

  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoDB();
  const user = await User.findById(id).lean();
  return user ? publicUser(user) : null;
}

export async function updateUserProfile(
  id: string,
  input: { name: string; language: Language }
): Promise<PublicUser | null> {
  if (isDemoMode()) {
    const user = demoStore.users.get(id);
    if (!user) return null;
    Object.assign(user, input);
    demoStore.users.set(id, user);
    return publicUser(user);
  }

  if (!mongoose.isValidObjectId(id)) return null;
  await connectMongoDB();
  const user = await User.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean();
  return user ? publicUser(user) : null;
}

export async function countUserChats(userId: string): Promise<number> {
  if (isDemoMode()) {
    return [...demoStore.chats.values()].filter((chat) => chat.userId === userId).length;
  }
  await connectMongoDB();
  return Chat.countDocuments({ userId });
}

export async function listUserChats(userId: string): Promise<ChatSummary[]> {
  if (isDemoMode()) {
    return [...demoStore.chats.values()]
      .filter((chat) => chat.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((chat) => ({
        id: chat.id,
        title: chat.title,
        language: chat.language,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        preview: chat.messages.at(-1)?.content.slice(0, 90),
      }));
  }

  await connectMongoDB();
  const chats = await Chat.find({ userId })
    .select("title language createdAt updatedAt messages")
    .sort({ updatedAt: -1 })
    .lean();

  return chats.map((chat) => ({
    id: String(chat._id),
    title: chat.title,
    language: chat.language,
    createdAt: iso(chat.createdAt),
    updatedAt: iso(chat.updatedAt),
    preview: chat.messages?.at(-1)?.content?.slice(0, 90),
  }));
}

export async function createChat(userId: string, language: Language): Promise<ChatDTO> {
  if (isDemoMode()) return clone(createDemoChat(userId, language));

  await connectMongoDB();
  const chat = await Chat.create({
    userId,
    language,
    title: language === "ar" ? "محادثة جديدة" : "New conversation",
  });
  return chatDTO(chat);
}

export async function getChat(userId: string, chatId: string): Promise<ChatDTO | null> {
  if (isDemoMode()) {
    const chat = demoStore.chats.get(chatId);
    return chat && chat.userId === userId ? clone(chat) : null;
  }

  if (!mongoose.isValidObjectId(chatId)) return null;
  await connectMongoDB();
  const chat = await Chat.findOne({ _id: chatId, userId }).lean();
  return chat ? chatDTO(chat) : null;
}

export async function renameChat(userId: string, chatId: string, title: string): Promise<ChatDTO | null> {
  if (isDemoMode()) {
    const chat = demoStore.chats.get(chatId);
    if (!chat || chat.userId !== userId) return null;
    chat.title = title;
    chat.updatedAt = new Date().toISOString();
    demoStore.chats.set(chatId, chat);
    return clone(chat);
  }

  if (!mongoose.isValidObjectId(chatId)) return null;
  await connectMongoDB();
  const chat = await Chat.findOneAndUpdate(
    { _id: chatId, userId },
    { $set: { title } },
    { new: true, runValidators: true }
  ).lean();
  return chat ? chatDTO(chat) : null;
}

export async function deleteChat(userId: string, chatId: string): Promise<boolean> {
  if (isDemoMode()) {
    const chat = demoStore.chats.get(chatId);
    if (!chat || chat.userId !== userId) return false;
    return demoStore.chats.delete(chatId);
  }

  if (!mongoose.isValidObjectId(chatId)) return false;
  await connectMongoDB();
  const result = await Chat.deleteOne({ _id: chatId, userId });
  return result.deletedCount === 1;
}

export async function appendMessage(
  userId: string,
  chatId: string,
  role: MessageRole,
  content: string
) {
  if (isDemoMode()) {
    const chat = demoStore.chats.get(chatId);
    if (!chat || chat.userId !== userId) return null;
    return appendDemoMessage(chatId, role, content);
  }

  if (!mongoose.isValidObjectId(chatId)) return null;
  await connectMongoDB();
  const message = { _id: new mongoose.Types.ObjectId(), role, content, timestamp: new Date() };
  const result = await Chat.updateOne({ _id: chatId, userId }, { $push: { messages: message } });
  if (result.matchedCount !== 1) return null;
  return { id: String(message._id), role, content, timestamp: message.timestamp.toISOString() };
}

export async function setAutomaticTitle(userId: string, chatId: string, content: string, language: Language) {
  const compact = content.replace(/\s+/g, " ").trim();
  const title = compact.length > 46 ? `${compact.slice(0, 46).trim()}…` : compact;
  if (!title) return;

  if (isDemoMode()) {
    const chat = demoStore.chats.get(chatId);
    if (!chat || chat.userId !== userId || chat.messages.length > 1) return;
    chat.title = title;
    demoStore.chats.set(chatId, chat);
    return;
  }

  if (!mongoose.isValidObjectId(chatId)) return;
  await connectMongoDB();
  const defaultTitle = language === "ar" ? "محادثة جديدة" : "New conversation";
  await Chat.updateOne({ _id: chatId, userId, title: defaultTitle }, { $set: { title } });
}
