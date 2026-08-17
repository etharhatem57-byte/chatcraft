import { CircleAlert } from "lucide-react";

export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#F0C5CE] bg-[#FFF6F7] px-3.5 py-3 text-sm text-[#98485A]">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
