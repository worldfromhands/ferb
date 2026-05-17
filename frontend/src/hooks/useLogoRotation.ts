import { useState, useEffect, useCallback, useRef } from "react";
import { LOGOS, LOGO_DURATION, getTransition } from "@/lib/logoAnimations";
import type { TransitionType } from "@/lib/logoAnimations";

interface LogoRotationState {
  index: number;
  transition: TransitionType;
  isPaused: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
}

export function useLogoRotation(autoPlay = true): LogoRotationState {
  const [index, setIndex]       = useState(0);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [transition, setTransition] = useState<TransitionType>(getTransition(0));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = (prev + 1) % LOGOS.length;
      setTransition(getTransition(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(advance, LOGO_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, advance]);

  const toggle = useCallback(() => setIsPaused((p) => !p), []);

  const next = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    advance();
    if (!isPaused) {
      timerRef.current = setInterval(advance, LOGO_DURATION);
    }
  }, [advance, isPaused]);

  const prev = useCallback(() => {
    setIndex((prev) => {
      const prevIdx = (prev - 1 + LOGOS.length) % LOGOS.length;
      setTransition(getTransition(prevIdx));
      return prevIdx;
    });
  }, []);

  return { index, transition, isPaused, toggle, next, prev };
}
