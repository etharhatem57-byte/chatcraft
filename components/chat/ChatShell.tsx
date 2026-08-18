"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ellipsis, FileDown, LogOut, Menu, MessageSquareText, Pencil, Plus, Search,
  Trash2, X,
} from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { downloadConversation } from "@/lib/download";
import type { ChatDTO, ChatSummary, PublicUser } from "@/types";

interface ChatShellContextValue {
  createNewChat: (draft?: string) => Promise<void>;
  refreshChats: () => Promise<void>;
}

const ChatShellContext = createContext<ChatShellContextValue | null>(null);

export function useChatShell() {
  const value = useContext(ChatShellContext);
  if (!value) throw new Error("useChatShell must be used inside ChatShell");
  return value;
}

function summary(chat: ChatDTO): ChatSummary {
  return {
    id: chat.id,
    title: chat.title,
    language: chat.language,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    preview: chat.messages.at(-1)?.content,
  };
}

export function ChatShell({ user, demo, children }: { user: PublicUser; demo: boolean; children: React.ReactNode }) {
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const activeId = pathname.match(/^\/chat\/([^/]+)/)?.[1];
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ChatSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mutating, setMutating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshChats = useCallback(async () => {
    try {
      const response = await fetch("/api/chats", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setChats(data.chats);
    } catch {
      showToast(t("chat.errorLoad"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => { void refreshChats(); }, [refreshChats]);
  useEffect(() => { setSidebarOpen(false); setMenuId(null); }, [pathname]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const createNewChat = useCallback(async (draft?: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json() as { chat: ChatDTO };
      setChats((current) => [summary(data.chat), ...current]);
      setSidebarOpen(false);
      const query = draft ? `?draft=${encodeURIComponent(draft)}` : "";
      router.push(`/chat/${data.chat.id}${query}`);
    } catch {
      showToast(t("common.error"), "error");
    } finally {
      setCreating(false);
    }
  }, [creating, language, router, showToast, t]);

  async function submitRename() {
    if (!renameTarget || !renameValue.trim()) return;
    setMutating(true);
    try {
      const response = await fetch(`/api/chats/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      if (!response.ok) throw new Error();
      setChats((current) => current.map((chat) => chat.id === renameTarget.id ? { ...chat, title: renameValue.trim() } : chat));
      setRenameTarget(null);
      showToast(t("common.success"));
    } catch {
      showToast(t("common.error"), "error");
    } finally {
      setMutating(false);
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setMutating(true);
    try {
      const response = await fetch(`/api/chats/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setChats((current) => current.filter((chat) => chat.id !== deleteTarget.id));
      if (activeId === deleteTarget.id) router.push("/chat");
      setDeleteTarget(null);
      showToast(t("common.success"));
    } catch {
      showToast(t("common.error"), "error");
    } finally {
      setMutating(false);
    }
  }

  async function downloadChatById(id: string) {
    try {
      const response = await fetch(`/api/chats/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json() as { chat: ChatDTO };
      downloadConversation(data.chat);
      showToast(t("chat.downloaded"));
    } catch {
      showToast(t("common.error"), "error");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/chat");
    router.refresh();
  }

  const filtered = chats.filter((chat) => chat.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const groups = useMemo(() => groupChats(filtered), [filtered]);
  const contextValue = useMemo(() => ({ createNewChat, refreshChats }), [createNewChat, refreshChats]);

  const sidebar = (
    <aside className="flex h-full w-[300px] flex-col border-e border-blush-100 bg-[#FFF9FB]/90 backdrop-blur-md">
      <div className="flex h-[72px] shrink-0 items-center justify-between px-4">
        <Logo href="/chat" />
        <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-muted hover:bg-white lg:hidden" aria-label={t("chat.closeSidebar")}><X className="size-5" /></button>
      </div>
      <div className="px-3 pb-3">
        <Button className="w-full" onClick={() => void createNewChat()} loading={creating}>
          <Plus className="size-4" /> {t("chat.newChat")}
        </Button>
        <label className="relative mt-3 block">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[#AAA]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("chat.search")} className="min-h-11 w-full rounded-xl border border-blush-100 bg-white/70 pe-3 ps-10 text-sm text-ink outline-none transition placeholder:text-[#AAA] focus:border-blush-300 focus:bg-white focus:ring-4 focus:ring-blush-100" />
        </label>
      </div>

      <div className="scrollbar-soft min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="grid place-items-center py-12 text-blush-500"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="mx-3 mt-6 rounded-2xl border border-dashed border-blush-200 bg-white/50 px-4 py-7 text-center">
            <MessageSquareText className="mx-auto size-5 text-blush-400" />
            <p className="mt-3 text-sm font-medium text-ink">{t("chat.noChats")}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{t("chat.noChatsText")}</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-4">
              <h2 className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#AAA]">{t(`chat.${group.label}`)}</h2>
              <div className="space-y-0.5">
                {group.items.map((chat) => (
                  <div key={chat.id} className="group relative" ref={menuId === chat.id ? menuRef : undefined}>
                    <Link href={`/chat/${chat.id}`} className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 pe-10 text-sm transition ${activeId === chat.id ? "border-blush-200 bg-white text-ink shadow-soft" : "border-transparent text-muted hover:bg-white/65 hover:text-ink"}`}>
                      <MessageSquareText className={`size-4 shrink-0 ${activeId === chat.id ? "text-blush-600" : "text-[#AAA]"}`} />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                    <button onClick={() => setMenuId(menuId === chat.id ? null : chat.id)} className={`absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-blush-50 ${menuId === chat.id ? "opacity-100" : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"}`} aria-label={t("chat.menu")}>
                      <Ellipsis className="size-4" />
                    </button>
                    {menuId === chat.id && (
                      <div className="absolute end-2 top-10 z-30 w-36 animate-fade-in rounded-xl border border-blush-100 bg-white p-1.5 shadow-lift">
                        <button onClick={() => { void downloadChatById(chat.id); setMenuId(null); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-blush-50 hover:text-ink"><FileDown className="size-3.5 text-blush-600" />{t("chat.download")}</button>
                        <button onClick={() => { setRenameTarget(chat); setRenameValue(chat.title); setMenuId(null); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-blush-50 hover:text-ink"><Pencil className="size-3.5" />{t("chat.rename")}</button>
                        <button onClick={() => { setDeleteTarget(chat); setMenuId(null); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-sm text-[#A8475D] hover:bg-[#FFF2F4]"><Trash2 className="size-3.5" />{t("chat.delete")}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-blush-100 p-3">
        {demo && <div className="mb-2 flex items-center gap-2 rounded-xl bg-blush-50 px-3 py-2 text-[11px] font-medium text-blush-700"><span className="size-1.5 rounded-full bg-blush-500" />{t("common.demo")}</div>}
        <div className="flex items-center gap-2 rounded-2xl border border-transparent p-1.5 transition hover:border-blush-100 hover:bg-white/60">
          <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blush-100 text-sm font-semibold text-blush-700">{user.name.slice(0, 1).toLocaleUpperCase()}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-medium text-ink">{user.name}</span><span className="block truncate text-[11px] text-muted">{user.email}</span></span>
          </Link>
          <button onClick={logout} className="grid size-9 shrink-0 place-items-center rounded-xl text-muted hover:bg-blush-50 hover:text-ink" aria-label={t("nav.logout")}><LogOut className="size-4" /></button>
        </div>
      </div>
    </aside>
  );

  return (
    <ChatShellContext.Provider value={contextValue}>
      <div className="flex h-dvh overflow-hidden bg-[#FCFBFB]">
        <div className="hidden shrink-0 lg:block">{sidebar}</div>
        {sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-[#4B3440]/15 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} aria-label={t("chat.closeSidebar")} /><div className="relative h-full w-[min(88vw,320px)] animate-fade-in shadow-lift">{sidebar}</div></div>}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-blush-100 bg-white/70 px-3 backdrop-blur-md lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-blush-50" aria-label={t("chat.openSidebar")}><Menu className="size-5" /></button>
            <Logo compact href="/chat" />
            <LanguageSwitcher compact />
          </header>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </div>

      <Modal open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} title={t("chat.renameTitle")} description={t("chat.renameDescription")}>
        <Input autoFocus label={t("chat.chatTitle")} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={80} onKeyDown={(event) => event.key === "Enter" && void submitRename()} />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRenameTarget(null)}>{t("chat.cancel")}</Button>
          <Button onClick={() => void submitRename()} loading={mutating}>{t(mutating ? "chat.saving" : "chat.save")}</Button>
        </div>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={t("chat.deleteTitle")} description={t("chat.deleteDescription")}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t("chat.cancel")}</Button>
          <Button variant="danger" onClick={() => void submitDelete()} loading={mutating}>{t(mutating ? "chat.deleting" : "chat.deleteConfirm")}</Button>
        </div>
      </Modal>
    </ChatShellContext.Provider>
  );
}

function groupChats(chats: ChatSummary[]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const result: Array<{ label: "today" | "yesterday" | "older"; items: ChatSummary[] }> = [
    { label: "today", items: [] }, { label: "yesterday", items: [] }, { label: "older", items: [] },
  ];
  chats.forEach((chat) => {
    const time = new Date(chat.updatedAt).getTime();
    const index = time >= startToday ? 0 : time >= startToday - 86_400_000 ? 1 : 2;
    result[index].items.push(chat);
  });
  return result.filter((group) => group.items.length > 0);
}
