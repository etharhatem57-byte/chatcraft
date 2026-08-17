"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message, type }]);
    window.setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto flex min-h-12 w-full max-w-sm animate-slide-up items-center gap-3 rounded-2xl border border-blush-200 bg-white/95 px-4 py-3 text-sm text-ink shadow-lift backdrop-blur-md">
            {toast.type === "success" ? <CheckCircle2 className="size-5 shrink-0 text-blush-600" /> : <CircleAlert className="size-5 shrink-0 text-[#B85B70]" />}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="rounded-lg p-1 text-muted hover:bg-blush-50" aria-label="Close"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
