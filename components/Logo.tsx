import Link from "next/link";
import { Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function Logo({ compact = false, href = "/", className }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={twMerge("inline-flex items-center gap-2.5 rounded-xl", className)} aria-label="ChatCraft home">
      <span className="grid size-9 place-items-center rounded-xl border border-blush-300/70 bg-gradient-to-br from-white to-blush-200 text-blush-700 shadow-soft">
        <Sparkles className="size-[18px]" strokeWidth={1.8} />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-[-0.02em] text-ink">ChatCraft</span>}
    </Link>
  );
}
