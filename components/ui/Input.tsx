"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props }, ref
) {
  const inputId = id || props.name;
  return (
    <label className="block w-full" htmlFor={inputId}>
      {label && <span className="mb-2 block text-sm font-medium text-ink">{label}</span>}
      <input
        ref={ref}
        id={inputId}
        className={twMerge(
          "min-h-12 w-full rounded-xl border border-blush-200 bg-white/80 px-4 text-[15px] text-ink shadow-soft transition placeholder:text-[#AAA] hover:border-blush-300 focus:border-blush-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blush-100 disabled:cursor-not-allowed disabled:bg-[#F8F8F8]",
          error && "border-[#D991A1] focus:border-[#C56C80] focus:ring-[#FBE3E8]",
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <span className="mt-1.5 block text-xs text-[#A8475D]">{error}</span>}
      {!error && hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
});
