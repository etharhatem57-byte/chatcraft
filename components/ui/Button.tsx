"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "border border-blush-400/60 bg-gradient-to-b from-blush-500 to-[#CF77A8] text-white shadow-soft hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0",
  secondary: "border border-blush-200 bg-white/80 text-ink shadow-soft hover:border-blush-300 hover:bg-blush-50",
  ghost: "border border-transparent bg-transparent text-muted hover:bg-blush-50 hover:text-ink",
  danger: "border border-[#E9BBC5] bg-[#FFF5F6] text-[#A8475D] hover:bg-[#FFECEF]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "size-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={twMerge(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});
