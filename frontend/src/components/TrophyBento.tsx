import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TROPHIES, type Trophy } from "@/data/trophies";

function spanClass(t: Trophy) {
  const col =
    t.span.col === 3
      ? "md:col-span-3"
      : t.span.col === 2
        ? "md:col-span-2"
        : "md:col-span-1";
  const row = t.span.row === 2 ? "md:row-span-2" : "md:row-span-1";
  return `${col} ${row}`;
}

function TrophyCard({ t }: { t: Trophy }) {
  const isAccent = t.accent === "#d4af37";
  return (
    <Link
      to="/trofeu/$slug"
      params={{ slug: t.slug }}
      className={`group relative overflow-hidden rounded-lg border border-white/10 ${spanClass(t)} ${t.placeholder ? "opacity-50" : ""}`}
      style={{
        background: isAccent
          ? "linear-gradient(160deg, #d4af37 0%, #8a6d1f 100%)"
          : "linear-gradient(160deg, #141414 0%, #0a0a0a 100%)",
        minHeight: t.span.row === 2 ? 420 : 200,
      }}
    >
      {/* grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 1px, transparent 1px 3px)",
        }}
      />
      {/* shine on hover */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 30% 0%, rgba(255,255,255,0.15), transparent 60%)",
        }}
      />

      {/* header */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between font-mono text-[10px] tracking-[0.25em] uppercase text-white/60">
        <span>№ {t.number}</span>
        <span className="text-right">{t.categoryLabel}</span>
      </div>

      {/* center metric */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="text-white leading-none"
          style={{
            fontFamily: "'Archivo Black', system-ui, sans-serif",
            fontSize: t.span.row === 2 ? "clamp(3rem,7vw,6rem)" : "clamp(2rem,4vw,3.5rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {t.metric}
        </div>
        {t.sub && (
          <div className="mt-2 font-mono text-[10px] tracking-[0.3em] uppercase text-white/60">
            {t.sub}
          </div>
        )}
      </div>

      {/* footer — title + period + hover desc */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-white text-base md:text-lg leading-tight truncate"
              style={{ fontFamily: "'Archivo Black', system-ui, sans-serif" }}
            >
              {t.title}
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">
              {t.period}
            </div>
          </div>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/60 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            abrir →
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-snug text-white/70 line-clamp-2">
          {t.hover}
        </p>
      </div>
    </Link>
  );
}

export function TrophyBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-3 md:gap-4">
      {TROPHIES.map((t) => (
        <TrophyCard key={t.slug} t={t} />
      ))}
    </div>
  );
}
