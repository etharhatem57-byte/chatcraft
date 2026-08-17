export type Language = "en" | "ar";
export type MessageRole = "user" | "assistant";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  language: Language;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  language: Language;
  updatedAt: string;
  createdAt: string;
  preview?: string;
}

export interface ChatDTO extends ChatSummary {
  userId: string;
  messages: MessageDTO[];
}

export interface ApiErrorBody {
  error: string;
  code?: string;
}
