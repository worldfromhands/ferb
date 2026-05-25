import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { getTrophy, TROPHIES } from "@/data/trophies";

export const Route = createFileRoute("/trofeu/$slug")({
  loader: ({ params }) => {
    const trophy = getTrophy(params.slug);
    if (!trophy) throw notFound();
    return { trophy };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.trophy;
    const title = t ? `${t.title} — EHXIS Trophy Room` : "Troféu — EHXIS";
    const desc = t?.hover ?? "Sala de troféus da EHXIS.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: TrophyPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-white/40 mb-4">
          troféu não encontrado
        </p>
        <Link to="/" className="underline text-white/80 hover:text-white">
          voltar para a sala
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-white/40 mb-3">erro</p>
          <p className="text-sm text-white/70 mb-6">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-4 py-2 rounded-full bg-white text-black text-xs tracking-[0.2em] uppercase"
          >
            tentar de novo
          </button>
        </div>
      </div>
    );
  },
});

function TrophyPage() {
  const { trophy: t } = Route.useLoaderData();
  const isAccent = t.accent === "#d4af37";
  const idx = TROPHIES.findIndex((x) => x.slug === t.slug);
  const next = TROPHIES[(idx + 1) % TROPHIES.length];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* top bar */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-[10px] tracking-[0.3em] uppercase text-white/60">
          <Link to="/" className="hover:text-white">← sala de troféus</Link>
          <span>№ {t.number} · {t.categoryLabel}</span>
        </div>
      </header>

      {/* hero */}
      <section
        className="relative px-6 py-24 md:py-32 overflow-hidden"
        style={{
          background: isAccent
            ? "linear-gradient(160deg, #d4af37 0%, #3d2f0a 100%)"
            : "linear-gradient(160deg, #141414 0%, #050505 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 1px, transparent 1px 3px)",
          }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-6">
            {t.period}
          </div>
          <h1
            className="text-white leading-none"
            style={{
              fontFamily: "'Archivo Black', system-ui, sans-serif",
              fontSize: "clamp(2.5rem,8vw,7rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {t.title}
          </h1>
          <div className="mt-10 flex flex-wrap items-end gap-8">
            <div>
              <div
                className="text-white leading-none"
                style={{
                  fontFamily: "'Archivo Black', system-ui, sans-serif",
                  fontSize: "clamp(3rem,9vw,8rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                {t.metric}
              </div>
              {t.sub && (
                <div className="mt-2 font-mono text-xs tracking-[0.3em] uppercase text-white/70">
                  {t.sub}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* body */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-lg md:text-xl leading-relaxed text-white/85">
            {t.body ?? t.hover}
          </p>
          {t.link && (
            <a
              href={t.link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-10 px-5 py-3 rounded-full bg-white text-black font-mono text-xs tracking-[0.25em] uppercase hover:bg-white/90 transition"
            >
              {t.link.label} ↗
            </a>
          )}
        </div>
      </section>

      {/* next */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto border-t border-white/10 pt-10 flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">
            próximo troféu
          </div>
          <Link
            to="/trofeu/$slug"
            params={{ slug: next.slug }}
            className="text-right group"
          >
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50">
              № {next.number}
            </div>
            <div
              className="text-2xl md:text-3xl text-white group-hover:text-[#d4af37] transition-colors"
              style={{ fontFamily: "'Archivo Black', system-ui, sans-serif" }}
            >
              {next.title} →
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
