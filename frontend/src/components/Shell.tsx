import { type ReactNode } from "react";
import { TabBar } from "./TabBar";
import { MotionLogo } from "./MotionLogo";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <TabBar />
      <main className="mx-auto max-w-[1280px] px-8 py-16">{children}</main>
      {/* Watermark bottom-right — autoPlay, not interactive */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-6 right-8"
        style={{ opacity: 0.14 }}
      >
        <MotionLogo size={44} autoPlay={true} interactive={false} />
      </div>
    </div>
  );
}
