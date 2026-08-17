"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  Copy,
  FileCode,
  FileDown,
  FileText,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useChatShell } from "@/components/chat/ChatShell";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Spinner } from "@/components/ui/Spinner";
import {
  type ExportFormat,
  downloadConversation,
  downloadSingleMessage,
} from "@/lib/download";
import type { ChatDTO, MessageDTO } from "@/types";

export function ChatPanel({ chatId }: { chatId: string }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { refreshChats } = useChatShell();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chat, setChat] = useState<ChatDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const appliedDraft = useRef(false);

  async function loadChat() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/chats/${chatId}`, { cache: "no-store" });
      if (response.status === 401) return router.push("/login");
      if (!response.ok) throw new Error(response.status === 404 ? "NOT_FOUND" : "LOAD_ERROR");
      const data = await response.json();
      setChat(data.chat);
      setMessages(data.chat.messages);
    } catch (loadError) {
      setError(loadError instanceof Error && loadError.message === "NOT_FOUND" ? t("chat.notFound") : t("chat.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadChat(); }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (appliedDraft.current) return;
    const draft = searchParams.get("draft");
    if (draft) {
      appliedDraft.current = true;
      setInput(draft.slice(0, 8000));
      window.setTimeout(() => textareaRef.current?.focus(), 50);
      router.replace(`/chat/${chatId}`);
    }
  }, [chatId, router, searchParams]);
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: sending ? "smooth" : "auto" });
  }, [messages, sending]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setDownloadMenuOpen(false);
      }
    }
    if (downloadMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [downloadMenuOpen]);

  async function sendMessage(event?: FormEvent, directText?: string) {
    event?.preventDefault();
    const content = (directText ?? input).trim();
    if (!content || sending || content.length > 8000) return;

    const now = new Date().toISOString();
    const userMessage: MessageDTO = { id: `local-user-${Date.now()}`, role: "user", content, timestamp: now };
    const assistantId = `local-assistant-${Date.now()}`;
    const assistantMessage: MessageDTO = { id: assistantId, role: "assistant", content: "", timestamp: now };
    const wasEmpty = messages.length === 0;

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setSending(true);
    setError("");
    if (wasEmpty) {
      const title = content.length > 46 ? `${content.slice(0, 46).trim()}…` : content;
      setChat((current) => current ? { ...current, title } : current);
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok || !response.body) {
        throw new Error("SEND_ERROR");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let complete = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        complete += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: complete } : message));
      }
      if (!complete.trim()) throw new Error("EMPTY_RESPONSE");
      await refreshChats();
    } catch {
      setMessages((current) => current.filter((message) => message.id !== assistantId));
      setError(t("chat.errorSend"));
      showToast(t("chat.errorSend"), "error");
    } finally {
      setSending(false);
      window.setTimeout(() => textareaRef.current?.focus(), 30);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function handleDownloadChat(format: ExportFormat = "md") {
    if (!chat || messages.length === 0) return;
    downloadConversation({ ...chat, messages }, format);
    setDownloadMenuOpen(false);
    showToast(t("chat.downloaded"));
  }

  if (loading) {
    return <div className="grid h-full place-items-center"><div className="flex items-center gap-3 text-sm text-muted"><Spinner className="text-blush-500" />{t("common.loading")}</div></div>;
  }

  if (!chat || (error && messages.length === 0)) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blush-100 text-blush-600"><RefreshCw className="size-5" /></div>
          <p className="mt-4 text-sm text-muted">{error || t("chat.errorLoad")}</p>
          <Button className="mt-5" variant="secondary" onClick={() => void loadChat()}>{t("chat.retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white/35">
      {/* Desktop Header */}
      <header className="hidden h-[72px] shrink-0 items-center justify-between border-b border-blush-100 bg-white/65 px-6 backdrop-blur-md lg:flex">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-ink">{chat.title}</h1>
          <p className="mt-0.5 text-[11px] text-muted">{chat.language === "ar" ? "العربية" : "English"}</p>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <div className="relative" ref={downloadMenuRef}>
              <div className="inline-flex items-center rounded-xl border border-blush-100 bg-white/80 shadow-soft transition hover:border-blush-300 hover:bg-white focus-within:border-blush-300 focus-within:ring-2 focus-within:ring-blush-200">
                <button
                  type="button"
                  onClick={() => handleDownloadChat("md")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-ink focus:outline-none"
                  aria-label={t("chat.downloadChat")}
                  title={t("chat.downloadChat")}
                >
                  <FileDown className="size-3.5 text-blush-600" />
                  <span>{t("chat.downloadChat")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadMenuOpen((prev) => !prev)}
                  className="border-s border-blush-100 px-1.5 py-1.5 text-muted transition hover:text-ink focus:outline-none"
                  aria-label={t("chat.exportOptions")}
                  title={t("chat.exportOptions")}
                >
                  <ChevronDown className="size-3 text-blush-600" />
                </button>
              </div>

              {downloadMenuOpen && (
                <div className="absolute end-0 top-10 z-40 w-44 animate-fade-in rounded-xl border border-blush-100 bg-white p-1.5 shadow-lift">
                  <button
                    type="button"
                    onClick={() => handleDownloadChat("md")}
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-muted transition hover:bg-blush-50 hover:text-ink"
                  >
                    <FileText className="size-3.5 text-blush-600" />
                    <span>{t("chat.downloadAsMarkdown")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadChat("txt")}
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-muted transition hover:bg-blush-50 hover:text-ink"
                  >
                    <FileDown className="size-3.5 text-blush-600" />
                    <span>{t("chat.downloadAsText")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadChat("json")}
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-muted transition hover:bg-blush-50 hover:text-ink"
                  >
                    <FileCode className="size-3.5 text-blush-600" />
                    <span>{t("chat.downloadAsJson")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px] text-[#999]"><span className="size-1.5 rounded-full bg-[#93C5A2]" />{t("chat.assistant")}</div>
        </div>
      </header>

      {/* Mobile Subheader */}
      <div className="flex items-center justify-between border-b border-blush-100 bg-white/50 px-4 py-2.5 backdrop-blur-sm lg:hidden">
        <div className="min-w-0 flex-1 pe-2">
          <h1 className="truncate text-xs font-semibold text-ink">{chat.title}</h1>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => handleDownloadChat("md")}
            className="flex items-center gap-1 rounded-lg border border-blush-100 bg-white px-2.5 py-1 text-[11px] font-medium text-muted shadow-soft transition hover:border-blush-300 hover:text-ink"
            aria-label={t("chat.downloadChat")}
            title={t("chat.downloadChat")}
          >
            <FileDown className="size-3.5 text-blush-600" />
            <span>{t("chat.download")}</span>
          </button>
        )}
      </div>

      <div ref={scrollRef} className="scrollbar-soft min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6">
        {messages.length === 0 ? (
          <EmptyConversation onSuggestion={(prompt) => void sendMessage(undefined, prompt)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-7 py-7 sm:py-10">
            {messages.map((message, index) => (
              <ChatBubble
                key={message.id}
                message={message}
                chatTitle={chat.title}
                streaming={sending && index === messages.length - 1 && message.role === "assistant"}
              />
            ))}
            {error && <div className="mx-auto max-w-xl"><ErrorMessage>{error}</ErrorMessage></div>}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-gradient-to-t from-[#FCFBFB] via-[#FCFBFB]/95 to-transparent px-3 pb-3 pt-4 sm:px-6 sm:pb-5">
        <form onSubmit={sendMessage} className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-[18px] border border-blush-200 bg-white p-2 shadow-[0_8px_30px_rgba(204,118,165,0.09)] transition focus-within:border-blush-400 focus-within:ring-4 focus-within:ring-blush-100/80">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 8000))}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              rows={1}
              className="scrollbar-soft max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-[15px] leading-5 text-ink outline-none placeholder:text-[#AAA]"
              aria-label={t("chat.placeholder")}
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={!input.trim() || sending} aria-label={t("chat.send")}>
              {sending ? <Spinner className="size-4" /> : <Send className="size-4" />}
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#AAA] sm:text-[11px]">{t("chat.disclaimer")}</p>
        </form>
      </div>
    </section>
  );
}

function EmptyConversation({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
  const { t } = useTranslation();
  const suggestions = [t("chat.suggestion1"), t("chat.suggestion2"), t("chat.suggestion3")];
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-12 text-center">
      <span className="grid size-14 place-items-center rounded-[18px] border border-blush-200 bg-white text-blush-600 shadow-soft"><Sparkles className="size-6" /></span>
      <h2 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t("chat.welcome")}</h2>
      <p className="mt-2 text-sm text-muted">{t("chat.welcomeSubtitle")}</p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
        {suggestions.map((suggestion) => <button key={suggestion} onClick={() => onSuggestion(suggestion)} className="min-h-20 rounded-2xl border border-blush-100 bg-white/70 p-3 text-start text-xs leading-5 text-muted shadow-soft transition hover:-translate-y-0.5 hover:border-blush-300 hover:bg-white hover:text-ink">{suggestion}</button>)}
      </div>
    </div>
  );
}

function ChatBubble({ message, streaming, chatTitle }: { message: MessageDTO; streaming: boolean; chatTitle?: string }) {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const time = new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(message.timestamp));

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    showToast(t("chat.copied"));
    window.setTimeout(() => setCopied(false), 2000);
  }

  function downloadMsg() {
    if (!message.content) return;
    downloadSingleMessage(message, chatTitle, "md");
    showToast(t("chat.downloaded"));
  }

  return (
    <article className={`group flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-blush-200 bg-white text-blush-600 shadow-soft"><Sparkles className="size-3.5" /></span>}
      <div className={`max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-7 ${isUser ? "rounded-ee-md bg-blush-100 text-ink" : "rounded-es-md border border-blush-100 bg-white text-[#454545] shadow-soft"}`}>
          {message.content || (streaming && <span className="inline-flex items-center gap-1 py-1" aria-label={t("chat.thinking")}><i className="size-1.5 animate-soft-pulse rounded-full bg-blush-400" /><i className="size-1.5 animate-soft-pulse rounded-full bg-blush-400 [animation-delay:180ms]" /><i className="size-1.5 animate-soft-pulse rounded-full bg-blush-400 [animation-delay:360ms]" /></span>)}
        </div>
        <div className="mt-1.5 flex items-center gap-2 px-1 text-[10px] text-[#AAA]">
          <span>{isUser ? t("chat.you") : t("chat.assistant")}</span><span>·</span><time>{time}</time>
          {!streaming && message.content && (
            <div className="ms-1 flex items-center gap-1 opacity-0 transition duration-150 group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1 rounded-md p-1 text-muted transition hover:bg-blush-50 hover:text-blush-700"
                aria-label={t("chat.copy")}
                title={t("chat.copy")}
              >
                {copied ? <Check className="size-3 text-blush-600" /> : <Copy className="size-3" />}
              </button>
              <button
                type="button"
                onClick={downloadMsg}
                className="flex items-center gap-1 rounded-md p-1 text-muted transition hover:bg-blush-50 hover:text-blush-700"
                aria-label={t("chat.downloadMessage")}
                title={t("chat.downloadMessage")}
              >
                <FileDown className="size-3 text-blush-600" />
              </button>
            </div>
          )}
        </div>
      </div>
      {isUser && <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#F4EDF0] text-muted"><UserRound className="size-3.5" /></span>}
    </article>
  );
}
