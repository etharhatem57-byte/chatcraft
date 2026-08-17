import { LoaderCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={twMerge("size-5 animate-spin text-current", className)} aria-hidden="true" />;
}
