import { Sparkles } from "lucide-react";

export default function Loading() {
  return <div className="grid min-h-screen place-items-center bg-[#FCFBFB]"><div className="flex flex-col items-center gap-3 text-sm text-muted"><span className="grid size-12 animate-soft-pulse place-items-center rounded-2xl bg-blush-100 text-blush-600"><Sparkles className="size-5" /></span><span>ChatCraft</span></div></div>;
}
