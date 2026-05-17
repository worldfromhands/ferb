import type { Variants } from "framer-motion";

export type TransitionType = "soft" | "glitch" | "flip3d" | "blur" | "slide" | "morph";

export interface LogoEntry {
  variant: string;
  src: string;
  label: string;
}

export const LOGOS: LogoEntry[] = [
  { variant: "white",               src: "/logos/white/ehxis-white-512.png",                             label: "White" },
  { variant: "black",               src: "/logos/black/ehxis-black-512.png",                             label: "Black" },
  { variant: "chrome",              src: "/logos/chrome/ehxis-chrome-512.png",                           label: "Chrome" },
  { variant: "gold",                src: "/logos/gold/ehxis-gold-512.png",                               label: "Gold" },
  { variant: "outline",             src: "/logos/outline/ehxis-outline-512.png",                         label: "Outline" },
  { variant: "bape-camo",           src: "/logos/bape-camo/ehxis-bape-camo-512.png",                     label: "Bape" },
  { variant: "adidas-stripes",      src: "/logos/adidas-stripes/ehxis-adidas-stripes-512.png",           label: "Adidas" },
  { variant: "gucci-stripes",       src: "/logos/gucci-stripes/ehxis-gucci-stripes-512.png",             label: "Gucci" },
  { variant: "louisvuitton-monogram", src: "/logos/louisvuitton-monogram/ehxis-louisvuitton-monogram-512.png", label: "LV" },
  { variant: "burberry-check",      src: "/logos/burberry-check/ehxis-burberry-check-512.png",           label: "Burberry" },
];

// How long each logo stays visible (ms)
export const LOGO_DURATION = 3000;

// Cycle of transition types — one per logo change
const TRANSITIONS: TransitionType[] = ["soft", "blur", "flip3d", "slide", "glitch", "morph", "soft", "blur", "flip3d", "slide"];

export function getTransition(index: number): TransitionType {
  return TRANSITIONS[index % TRANSITIONS.length];
}

// ── Framer Motion variants per transition type ────────────────────────────────

export const variantsMap: Record<TransitionType, { variants: Variants; transition: object }> = {
  soft: {
    variants: {
      enter:  { opacity: 0, scale: 0.92 },
      center: { opacity: 1, scale: 1 },
      exit:   { opacity: 0, scale: 1.08 },
    },
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  },
  blur: {
    variants: {
      enter:  { opacity: 0, filter: "blur(12px)", scale: 0.95 },
      center: { opacity: 1, filter: "blur(0px)",  scale: 1 },
      exit:   { opacity: 0, filter: "blur(12px)", scale: 1.05 },
    },
    transition: { duration: 0.8, ease: "easeInOut" },
  },
  flip3d: {
    variants: {
      enter:  { opacity: 0, rotateY: -90, scale: 0.8 },
      center: { opacity: 1, rotateY: 0,   scale: 1   },
      exit:   { opacity: 0, rotateY: 90,  scale: 0.8 },
    },
    transition: { duration: 0.65, ease: [0.34, 1.56, 0.64, 1] },
  },
  slide: {
    variants: {
      enter:  { opacity: 0, y: 20, scale: 0.9 },
      center: { opacity: 1, y: 0,  scale: 1   },
      exit:   { opacity: 0, y: -20, scale: 0.9 },
    },
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
  },
  glitch: {
    variants: {
      enter:  { opacity: 0, x: -8,  skewX: -5, scale: 0.95 },
      center: { opacity: 1, x: 0,   skewX: 0,  scale: 1    },
      exit:   { opacity: 0, x: 8,   skewX: 5,  scale: 0.95 },
    },
    transition: { duration: 0.45, ease: "easeOut" },
  },
  morph: {
    variants: {
      enter:  { opacity: 0, scale: 0.6, rotate: -10 },
      center: { opacity: 1, scale: 1,   rotate: 0   },
      exit:   { opacity: 0, scale: 1.4, rotate: 10  },
    },
    transition: { duration: 0.75, ease: [0.34, 1.56, 0.64, 1] },
  },
};
