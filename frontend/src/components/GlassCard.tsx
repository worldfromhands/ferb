import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const GlassCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass rounded-[20px] p-6 transition-colors hover:glass-hover",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-dim",
        className,
      )}
    >
      {children}
    </span>
  );
}
