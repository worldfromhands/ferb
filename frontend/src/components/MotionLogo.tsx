import { AnimatePresence, motion } from "framer-motion";
import { useLogoRotation } from "@/hooks/useLogoRotation";
import { LOGOS, variantsMap } from "@/lib/logoAnimations";
import "@/styles/motionLogo.css";

interface MotionLogoProps {
  /** Height in px (width scales automatically from the square PNG) */
  size?: number;
  autoPlay?: boolean;
  /** Make it interactive (click to pause/resume) */
  interactive?: boolean;
  className?: string;
}

export function MotionLogo({
  size = 32,
  autoPlay = true,
  interactive = true,
  className = "",
}: MotionLogoProps) {
  const { index, transition, isPaused, toggle } = useLogoRotation(autoPlay);
  const logo = LOGOS[index];
  const { variants, transition: tConfig } = variantsMap[transition];

  return (
    <div
      className={`motion-logo-outer ${className}`}
      style={{ width: size, height: size }}
      onClick={interactive ? toggle : undefined}
      title={interactive ? (isPaused ? "Retomar" : "Pausar") : undefined}
      role={interactive ? "button" : undefined}
      aria-label={`EHXIS logo — ${logo.label}`}
    >
      <div
        className={`motion-logo-wrapper ${isPaused ? "paused" : ""}`}
        style={{ width: size, height: size }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${index}-${logo.variant}`}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={tConfig}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logo.src}
              alt={`EHXIS ${logo.label}`}
              width={size}
              height={size}
              className="motion-logo-img"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Pause indicator dot */}
        {interactive && isPaused && (
          <span className="motion-logo-pause-dot" aria-hidden />
        )}
      </div>
    </div>
  );
}
