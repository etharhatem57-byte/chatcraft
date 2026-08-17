import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge("rounded-[20px] border border-blush-200/80 bg-white/80 shadow-soft backdrop-blur-md", className)} {...props} />;
}
