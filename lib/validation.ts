import { z } from "zod";

export const languageSchema = z.enum(["en", "ar"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  language: languageSchema.default("en"),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const createChatSchema = z.object({ language: languageSchema.default("en") });
export const renameChatSchema = z.object({ title: z.string().trim().min(1).max(80) });
export const messageSchema = z.object({ content: z.string().trim().min(1).max(8000) });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(50),
  language: languageSchema,
});
