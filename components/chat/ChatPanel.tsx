"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AudioLines,
  Check,
  ChevronDown,
  Copy,
  File,
  FileCode,
  FileDown,
  FileText,
  Image as ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useChatShell } from "@/components/chat/ChatShell";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import {
  type ExportFormat,
  downloadConversation,
  downloadFile,
  downloadSingleMessage,
} from "@/lib/download";
import type { ChatDTO, MessageDTO } from "@/types";

const EXTENSION_MAP: Record<string, string> = {
  typescript: "ts",
  ts: "ts",
  javascript: "js",
  js: "js",
  jsx: "jsx",
  tsx: "tsx",
  python: "py",
  py: "py",
  json: "json",
  html: "html",
  css: "css",
  sql: "sql",
  markdown: "md",
  md: "md",
  sh: "sh",
  bash: "sh",
  shell: "sh",
  yaml: "yaml",
  yml: "yml",
  xml: "xml",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  cs: "cs",
  java: "java",
  rust: "rs",
  rs: "rs",
  go: "go",
  php: "php",
  ruby: "rb",
  rb: "rb",
};

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  isImage: boolean;
  dataUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

function detectTextLanguage(text: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicPattern.test(text) ? "ar" : "en";
}

// Web Speech API interface definitions
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    [index: number]: SpeechRecognitionResultLike;
    length: number;
  };
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export function ChatPanel({ chatId }: { chatId: string }) {
  const { t, language: activeLang } = useTranslation();
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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [detectedVoiceLang, setDetectedVoiceLang] = useState<"ar" | "en" | null>(null);
  const [micModalOpen, setMicModalOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
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

  // Clean up speech recognition when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  async function processFiles(files: FileList | File[]) {
    const newFiles: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(t("chat.fileTooLarge"), "error");
        continue;
      }
      const isImage = file.type.startsWith("image/");
      try {
        let content = "";
        let dataUrl: string | undefined;
        if (isImage) {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else {
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        }
        newFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          content,
          isImage,
          dataUrl,
        });
      } catch {
        showToast(t("common.error"), "error");
      }
    }
    if (newFiles.length > 0) {
      setAttachedFiles((current) => [...current, ...newFiles]);
      showToast(t("chat.fileAttached"));
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      void processFiles(event.target.files);
      event.target.value = "";
    }
  }

  function removeAttachedFile(id: string) {
    setAttachedFiles((current) => current.filter((f) => f.id !== id));
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void processFiles(event.dataTransfer.files);
    }
  }

  async function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText("");
      return;
    }

    const SpeechRec = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRec) {
      showToast(t("chat.micUnsupported"), "error");
      return;
    }

    // Explicitly request microphone stream to trigger native permission prompt if needed
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: unknown) {
        console.warn("Microphone permission denied via getUserMedia:", err);
        setMicModalOpen(true);
        showToast(t("chat.micPermissionDenied"), "error");
        return;
      }
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeLang === "ar" ? "ar-SA" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText("");
        setDetectedVoiceLang(activeLang === "ar" ? "ar" : "en");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = "";
        let finalTrans = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTrans += transcript;
          } else {
            interim += transcript;
          }
        }

        const combinedText = (finalTrans + interim).trim();
        if (combinedText) {
          const detected = detectTextLanguage(combinedText);
          setDetectedVoiceLang(detected);
        }

        if (finalTrans) {
          setInput((prev) => {
            const spacer = prev && !prev.endsWith(" ") ? " " : "";
            return (prev + spacer + finalTrans).slice(0, 8000);
          });
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: { error: string }) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicModalOpen(true);
          showToast(t("chat.micPermissionDenied"), "error");
        }
        setIsListening(false);
        setInterimText("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      showToast(t("chat.micUnsupported"), "error");
      setIsListening(false);
    }
  }

  async function sendMessage(event?: FormEvent, directText?: string) {
    event?.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    let textContent = (directText ?? input).trim();
    if ((!textContent && attachedFiles.length === 0) || sending) return;

    // Format attached files into content
    if (attachedFiles.length > 0) {
      const fileHeaders = attachedFiles.map((file) => {
        const ext = getFileExtension(file.name);
        if (file.isImage) {
          return `📎 [${file.name} - ${formatFileSize(file.size)}]`;
        }
        if (file.content) {
          return `📎 [${file.name} - ${formatFileSize(file.size)}]\n\`\`\`${ext || "text"}\n${file.content.slice(0, 8000)}\n\`\`\``;
        }
        return `📎 [${file.name} - ${formatFileSize(file.size)}]`;
      }).join("\n\n");

      textContent = textContent ? `${fileHeaders}\n\n${textContent}` : fileHeaders;
    }

    const content = textContent.slice(0, 8000);
    const now = new Date().toISOString();
    const userMessage: MessageDTO = { id: `local-user-${Date.now()}`, role: "user", content, timestamp: now };
    const assistantId = `local-assistant-${Date.now()}`;
    const assistantMessage: MessageDTO = { id: assistantId, role: "assistant", content: "", timestamp: now };
    const wasEmpty = messages.length === 0;

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setAttachedFiles([]);
    setSending(true);
    setError("");

    if (wasEmpty) {
      const displayTitle = attachedFiles[0] ? attachedFiles[0].name : content;
      const title = displayTitle.length > 46 ? `${displayTitle.slice(0, 46).trim()}…` : displayTitle;
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
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-full min-h-0 flex-col bg-white/35"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-blush-50/80 p-6 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-blush-400 bg-white/90 p-8 text-center shadow-lift">
            <Paperclip className="size-10 text-blush-600 animate-bounce" />
            <p className="mt-3 text-base font-semibold text-ink">{t("chat.dropFileHere")}</p>
          </div>
        </div>
      )}

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

      {/* Input Area */}
      <div className="shrink-0 bg-gradient-to-t from-[#FCFBFB] via-[#FCFBFB]/95 to-transparent px-3 pb-3 pt-4 sm:px-6 sm:pb-5">
        <form onSubmit={sendMessage} className="mx-auto max-w-3xl space-y-2">
          {/* Animated File Attachment Preview Chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="animate-pop-in flex items-center gap-2 rounded-xl border border-blush-200 bg-white/95 px-3 py-1.5 shadow-soft transition hover:border-blush-300"
                >
                  <span className="grid size-6 place-items-center rounded-lg bg-blush-100 text-blush-700">
                    {file.isImage ? <ImageIcon className="size-3.5" /> : <FileText className="size-3.5" />}
                  </span>
                  <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-[200px]">
                    <span className="truncate text-xs font-medium text-ink">{file.name}</span>
                    <span className="text-[10px] text-muted">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachedFile(file.id)}
                    className="ms-1 rounded-md p-1 text-muted transition hover:bg-blush-100 hover:text-blush-700"
                    title={t("chat.removeFile")}
                    aria-label={t("chat.removeFile")}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice Listening Bar Indicator with Soundwave Animation */}
          {isListening && (
            <div className="animate-pop-in flex items-center justify-between rounded-xl border border-blush-300 bg-blush-50/90 px-3.5 py-2 shadow-soft">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blush-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-blush-600" />
                </span>
                <span className="text-xs font-medium text-blush-800">{t("chat.listening")}</span>
                {detectedVoiceLang && (
                  <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blush-700 shadow-soft">
                    {detectedVoiceLang === "ar" ? "العربية (AR)" : "English (EN)"}
                  </span>
                )}
                {interimText && (
                  <span className="truncate text-xs italic text-muted max-w-[160px] sm:max-w-[280px]">
                    “{interimText}”
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* 5-bar animated audio soundwave */}
                <div className="flex items-center gap-0.5 h-4 px-1" aria-hidden="true">
                  <span className="w-0.5 rounded-full bg-blush-600 animate-wave-1" />
                  <span className="w-0.5 rounded-full bg-blush-500 animate-wave-2" />
                  <span className="w-0.5 rounded-full bg-blush-600 animate-wave-3" />
                  <span className="w-0.5 rounded-full bg-blush-500 animate-wave-4" />
                  <span className="w-0.5 rounded-full bg-blush-600 animate-wave-5" />
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-blush-700 shadow-soft transition hover:bg-blush-100"
                >
                  {t("chat.stopListening")}
                </button>
              </div>
            </div>
          )}

          {/* Main Input Bar */}
          <div className="flex items-end gap-1.5 rounded-[18px] border border-blush-200 bg-white p-2 shadow-[0_8px_30px_rgba(204,118,165,0.09)] transition focus-within:border-blush-400 focus-within:ring-4 focus-within:ring-blush-100/80">
            {/* File Upload Hidden Input & Button */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-blush-50 hover:text-blush-700 active:scale-95 focus:outline-none"
              aria-label={t("chat.attachFile")}
              title={t("chat.attachFile")}
            >
              <Paperclip className="size-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 8000))}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              rows={1}
              className="scrollbar-soft max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-[15px] leading-5 text-ink outline-none placeholder:text-[#AAA]"
              aria-label={t("chat.placeholder")}
            />

            {/* Microphone Voice-to-Text Button */}
            <button
              type="button"
              onClick={() => void toggleVoiceInput()}
              className={`relative grid size-9 shrink-0 place-items-center rounded-xl transition focus:outline-none ${
                isListening
                  ? "bg-blush-500 text-white shadow-mic-active scale-105"
                  : "text-muted hover:bg-blush-50 hover:text-blush-700"
              }`}
              aria-label={isListening ? t("chat.stopListening") : t("chat.voiceInput")}
              title={isListening ? t("chat.stopListening") : t("chat.voiceInput")}
            >
              {isListening && (
                <span className="pointer-events-none absolute -inset-1 rounded-xl bg-blush-400/40 animate-pulse-ring" />
              )}
              {isListening ? (
                <AudioLines className="size-4 animate-pulse" />
              ) : (
                <Mic className="size-4" />
              )}
            </button>

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-xl"
              disabled={(!input.trim() && attachedFiles.length === 0) || sending}
              aria-label={t("chat.send")}
            >
              {sending ? <Spinner className="size-4" /> : <Send className="size-4" />}
            </Button>
          </div>

          <p className="mt-2 text-center text-[10px] text-[#AAA] sm:text-[11px]">{t("chat.disclaimer")}</p>
        </form>
      </div>

      {/* Microphone Permission Guide Modal */}
      <Modal
        open={micModalOpen}
        onClose={() => setMicModalOpen(false)}
        title={t("chat.micModalTitle")}
        description={t("chat.micModalDesc")}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-blush-100 bg-blush-50/70 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blush-100 text-blush-700 shadow-soft">
                <MicOff className="size-5" />
              </span>
              <div className="space-y-2.5 text-xs leading-5 text-ink">
                <p className="flex items-start gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blush-200 text-[11px] font-bold text-blush-800">1</span>
                  <span>{t("chat.micStep1")}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blush-200 text-[11px] font-bold text-blush-800">2</span>
                  <span>{t("chat.micStep2")}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blush-200 text-[11px] font-bold text-blush-800">3</span>
                  <span>{t("chat.micStep3")}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setMicModalOpen(false)}>
              {t("chat.micGotIt")}
            </Button>
            <Button
              onClick={() => {
                setMicModalOpen(false);
                void toggleVoiceInput();
              }}
            >
              <Mic className="size-4" />
              <span>{t("chat.micTryAgain")}</span>
            </Button>
          </div>
        </div>
      </Modal>
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

function CodeBlock({ code, language }: { code: string; language: string }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    showToast(t("chat.copied"));
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const ext = EXTENSION_MAP[language.toLowerCase()] || "txt";
    const filename = `snippet_${Date.now().toString().slice(-4)}.${ext}`;
    downloadFile(filename, code, "text/plain;charset=utf-8");
    showToast(t("chat.downloaded"));
  }

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-blush-100/60 bg-[#1C1A1E] text-[#F3EDF1] shadow-soft">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70">
        <span className="font-mono text-[11px] font-medium tracking-wider text-blush-200">{language || "text"}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-white/80 transition hover:bg-white/10 hover:text-white"
            title={t("chat.copyCode")}
            aria-label={t("chat.copyCode")}
          >
            {copied ? <Check className="size-3 text-blush-400" /> : <Copy className="size-3" />}
            <span>{copied ? t("chat.copied") : t("chat.copy")}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-blush-600 hover:text-white"
            title={t("chat.downloadSnippet")}
            aria-label={t("chat.downloadSnippet")}
          >
            <FileDown className="size-3" />
            <span>{t("chat.download")}</span>
          </button>
        </div>
      </div>
      <pre className="scrollbar-soft overflow-x-auto p-3 font-mono text-[13px] leading-6 text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseMessageContent(content: string) {
  const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "code",
      language: match[1].trim() || "text",
      content: match[2].replace(/\n$/, ""),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts;
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

  const parts = parseMessageContent(message.content);

  return (
    <article className={`group flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-blush-200 bg-white text-blush-600 shadow-soft"><Sparkles className="size-3.5" /></span>}
      <div className={`max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`break-words rounded-2xl px-4 py-3 text-[15px] leading-7 ${isUser ? "rounded-ee-md bg-blush-100 text-ink whitespace-pre-wrap" : "rounded-es-md border border-blush-100 bg-white text-[#454545] shadow-soft"}`}>
          {isUser ? (
            message.content
          ) : message.content ? (
            parts.map((part, idx) => (
              part.type === "code" ? (
                <CodeBlock key={idx} code={part.content} language={part.language || "text"} />
              ) : (
                <span key={idx} className="whitespace-pre-wrap">{part.content}</span>
              )
            ))
          ) : (
            streaming && <span className="inline-flex items-center gap-1 py-1" aria-label={t("chat.thinking")}><i className="size-1.5 animate-soft-pulse rounded-full bg-blush-400" /><i className="size-1.5 animate-soft-pulse rounded-full bg-blush-400 [animation-delay:180ms]" /><i className="size-1.5 animate-soft-pulse rounded-full bg-blush-400 [animation-delay:360ms]" /></span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 px-1 text-[10px] text-[#AAA]">
          <span>{isUser ? t("chat.you") : t("chat.assistant")}</span><span>·</span><time>{time}</time>
          {!streaming && message.content && (
            <div className="ms-1 flex items-center gap-1 opacity-100 transition duration-150 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
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
