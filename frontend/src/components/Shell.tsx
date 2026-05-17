import { type ReactNode } from "react";
import { TabBar } from "./TabBar";
import { EhxisLogo } from "./EhxisLogo";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <TabBar />
      <main className="mx-auto max-w-[1280px] px-8 py-16">{children}</main>
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-6 right-8 opacity-[0.12]"
      >
        <EhxisLogo className="h-8 w-[88px]" color="#fa243c" />
      </div>
    </div>
  );
}
