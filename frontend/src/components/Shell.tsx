import { type ReactNode } from "react";
import { TabBar } from "./TabBar";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <TabBar />
      <main className="mx-auto max-w-[1280px] px-8 py-16">{children}</main>
      {/* Marca d'água EHXIS — texto, glow dourado, discreta */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-5 right-7 select-none"
      >
        <span className="ehxis-mark text-[13px]" style={{ opacity: 0.28 }}>
          EHXIS
        </span>
      </div>
    </div>
  );
}
