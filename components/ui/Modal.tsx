"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="absolute inset-0 cursor-default bg-[#5B3A48]/15 backdrop-blur-[2px]" onClick={onClose} aria-label={t("common.close")} />
      <div className="relative w-full max-w-md animate-slide-up rounded-[20px] border border-white bg-white p-5 shadow-lift sm:p-6">
        <button onClick={onClose} className="absolute end-4 top-4 rounded-xl p-2 text-muted transition hover:bg-blush-50 hover:text-ink" aria-label={t("common.close")}>
          <X className="size-5" />
        </button>
        <div className="pe-10">
          <h2 id="modal-title" className="text-lg font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
