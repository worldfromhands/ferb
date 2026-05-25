import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

import stadiumEntry from "@/assets/stadium-entry.webp";
import { TrophyBento } from "@/components/TrophyBento";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EHXIS — Trophy Room" },
      {
        name: "description",
        content:
          "Sala de troféus da EHXIS — label brasileira de rap e trap. Artistas, marcos e números reais.",
      },
      { property: "og:title", content: "EHXIS — Trophy Room" },
      {
        property: "og:description",
        content: "Artistas, marcos e números reais da EHXIS.",
      },
    ],
  }),
  component: Index,
});

// ---------------- LOADER ----------------
function Loader({ onEnter }: { onEnter: () => void }) {
  const [opening, setOpening] = useState(false);
  const handleClick = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(onEnter, 1600);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black font-mono text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${stadiumEntry})`,
          transform: opening ? "scale(1.35)" : "scale(1.02)",
          filter: opening ? "brightness(1.1)" : "brightness(0.9)",
          transition:
            "transform 1600ms cubic-bezier(0.65,0,0.35,1), filter 1600ms ease-out",
          willChange: "transform, filter",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
          opacity: opening ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.75) 0%, transparent 55%)",
          opacity: opening ? 0.85 : 0,
        }}
      />
      <div className="absolute top-8 left-8 text-[10px] tracking-[0.3em] uppercase opacity-85">
        V—004 · matchday
      </div>
      <div className="absolute bottom-8 right-8 text-[10px] tracking-[0.3em] uppercase opacity-85">
        {opening ? "ENTRANDO" : "↳ toque na logo pra entrar"}
      </div>
      <div className="absolute bottom-8 left-8 text-[10px] tracking-[0.3em] uppercase opacity-60">
        ehxis · trophy room
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={handleClick}
          aria-label="entrar na ehxis"
          className="group relative cursor-pointer focus:outline-none bg-transparent border-0 p-0"
          style={{
            transform: opening ? "scale(1.25)" : "scale(1)",
            opacity: opening ? 0 : 1,
            transition:
              "transform 1500ms cubic-bezier(0.65,0,0.35,1), opacity 800ms ease-out",
          }}
        >
          <span
            aria-label="ehxis"
            className="block select-none text-white transition-transform duration-500 group-hover:scale-105"
            style={{
              fontFamily: "'Archivo Black', system-ui, sans-serif",
              fontSize: "clamp(1rem, 2.4vw, 2rem)",
              letterSpacing: "0.04em",
              filter:
                "drop-shadow(0 0 18px rgba(255,255,255,0.6)) drop-shadow(0 0 40px rgba(212,175,55,0.45))",
            }}
          >
            EHXIS
          </span>
        </button>
      </div>
    </div>
  );
}

// ---------------- STARFIELD ----------------
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 1 + 0.2,
      r: Math.random() * 1.4 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.tw += 0.015 * s.z;
        const a = 0.4 + Math.abs(Math.sin(s.tw)) * 0.6;
        ctx.fillStyle = `rgba(220,230,255,${a * s.z})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

// ---------------- HUD CIRCLE ----------------
const PILARES = [
  "RAP",
  "TRAP",
  "QUEBRADA INTELIGENTE",
  "STREAMING",
  "BOOKING",
  "AUDIOVISUAL",
  "PERFORMANCE",
  "MARCA",
  "DADOS",
  "FERB",
  "TURNÊ",
  "CASTING",
];

function HudCircle() {
  return (
    <div className="relative w-[min(720px,80vw)] aspect-square mx-auto">
      <motion.div
        aria-hidden
        className="absolute inset-[14%] rounded-full pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(212,175,55,0) 0deg, rgba(212,175,55,0) 320deg, rgba(212,175,55,0.18) 350deg, rgba(212,175,55,0.4) 360deg)",
          maskImage: "radial-gradient(circle, black 60%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle, black 60%, transparent 72%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.svg
        viewBox="0 0 600 600"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <path
            id="ring-outer"
            d="M 300,300 m -270,0 a 270,270 0 1,1 540,0 a 270,270 0 1,1 -540,0"
          />
        </defs>
        <circle cx="300" cy="300" r="270" fill="none" stroke="rgba(220,230,255,0.18)" strokeWidth="0.5" />
        <circle cx="300" cy="300" r="265" fill="none" stroke="rgba(220,230,255,0.08)" strokeWidth="0.5" strokeDasharray="2 4" />
        <text fill="rgba(220,230,255,0.55)" fontSize="11" fontFamily="ui-monospace, monospace" letterSpacing="3">
          <textPath href="#ring-outer" startOffset="0">
            {PILARES.join(" · ") + " · "}
          </textPath>
        </text>
      </motion.svg>

      <motion.svg
        viewBox="0 0 600 600"
        className="absolute inset-0 w-full h-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="300" cy="300" r="200" fill="none" stroke="rgba(220,230,255,0.22)" strokeWidth="0.7" />
        <circle cx="300" cy="300" r="195" fill="none" stroke="rgba(220,230,255,0.1)" strokeWidth="0.5" strokeDasharray="1 6" />
        {Array.from({ length: 60 }).map((_, i) => (
          <line
            key={i}
            x1={300 + Math.cos((i / 60) * Math.PI * 2) * 200}
            y1={300 + Math.sin((i / 60) * Math.PI * 2) * 200}
            x2={300 + Math.cos((i / 60) * Math.PI * 2) * (i % 5 === 0 ? 188 : 194)}
            y2={300 + Math.sin((i / 60) * Math.PI * 2) * (i % 5 === 0 ? 188 : 194)}
            stroke="rgba(220,230,255,0.4)"
            strokeWidth="0.6"
          />
        ))}
      </motion.svg>

      <svg viewBox="0 0 600 600" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="orb-grad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(40,12,20,0.95)" />
            <stop offset="60%" stopColor="rgba(8,4,6,1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,1)" />
          </radialGradient>
          <radialGradient id="orb-rim" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="rgba(212,175,55,0)" />
            <stop offset="95%" stopColor="rgba(212,175,55,0.4)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="148" fill="none" stroke="rgba(220,230,255,0.2)" strokeWidth="0.6" />
        <circle cx="300" cy="300" r="138" fill="none" stroke="rgba(220,230,255,0.1)" strokeWidth="0.5" strokeDasharray="2 5" />
        <circle cx="300" cy="300" r="118" fill="url(#orb-grad)" stroke="rgba(212,175,55,0.5)" strokeWidth="0.9" />
        <circle cx="300" cy="300" r="118" fill="url(#orb-rim)" />
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r1 = 128;
          const r2 = i % 4 === 0 ? 134 : 131;
          return (
            <line
              key={i}
              x1={300 + Math.cos(a) * r1}
              y1={300 + Math.sin(a) * r1}
              x2={300 + Math.cos(a) * r2}
              y2={300 + Math.sin(a) * r2}
              stroke="rgba(220,230,255,0.4)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.span
          className="select-none"
          style={{
            fontFamily: "'Archivo Black', system-ui, sans-serif",
            fontSize: "clamp(0.7rem, 1.7vw, 1.5rem)",
            letterSpacing: "0.06em",
            color: "#fff",
            filter:
              "drop-shadow(0 0 12px rgba(212,175,55,0.55)) drop-shadow(0 0 28px rgba(212,175,55,0.25))",
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          EHXIS
        </motion.span>
      </div>

      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[6%] h-px bg-white/20" />
        <div className="absolute top-1/2 right-0 w-[6%] h-px bg-white/20" />
        <div className="absolute left-1/2 top-0 h-[6%] w-px bg-white/20" />
        <div className="absolute left-1/2 bottom-0 h-[6%] w-px bg-white/20" />
      </div>
    </div>
  );
}

// ---------------- HUD FRAME ----------------
function HudFrame() {
  return (
    <div aria-hidden className="fixed inset-0 z-30 pointer-events-none">
      {[
        "top-2 left-2",
        "top-2 right-2",
        "bottom-2 left-2",
        "bottom-2 right-2",
        "top-2 left-1/2 -translate-x-1/2",
        "bottom-2 left-1/2 -translate-x-1/2",
        "top-1/2 left-2 -translate-y-1/2",
        "top-1/2 right-2 -translate-y-1/2",
      ].map((p) => (
        <div
          key={p}
          className={`absolute ${p} text-white/30 text-xs select-none`}
        >
          +
        </div>
      ))}
    </div>
  );
}

// ---------------- PAGE ----------------
function Index() {
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      setTime(`${hh}:${mm}:${ss} BRT`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const { scrollYProgress } = useScroll();
  const heroY = useSpring(useTransform(scrollYProgress, [0, 0.3], [0, -120]), {
    stiffness: 80,
    damping: 20,
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  // FERB: pill nav aponta para as abas reais do app (não /about /contato como na referência)
  const navLinks = [
    { label: "Sala",       to: "/" },
    { label: "Agência",    to: "/agencia" },
    { label: "Dados",      to: "/dados" },
    { label: "Catálogo",   to: "/catalogo" },
    { label: "Relatórios", to: "/relatorios" },
  ] as const;

  return (
    <>
      {loading && (
        <Loader
          onEnter={() => {
            setLoading(false);
            setEntered(true);
          }}
        />
      )}

      <div
        className={`relative min-h-screen w-full text-white transition-opacity duration-700 ${entered ? "opacity-100" : "opacity-0"}`}
        style={{
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
          backgroundColor: "#000",
        }}
      >
        <Starfield />
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: [
              "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(212,175,55,0.10), transparent 60%)",
              "radial-gradient(ellipse 50% 60% at 80% 70%, rgba(60,45,10,0.18), transparent 60%)",
              "radial-gradient(ellipse 80% 40% at 50% 110%, rgba(15,10,2,0.5), transparent 70%)",
              "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(0,0,0,0.6), transparent 70%)",
            ].join(", "),
          }}
        />
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0 1px, transparent 1px 3px)",
          }}
        />
        <HudFrame />

        {/* TOP NAV — pill flutuante (substitui a TabBar nesta tela) */}
        <header className="fixed top-0 left-1/2 -translate-x-1/2 z-40 pt-4 pointer-events-none">
          <div className="pointer-events-auto relative">
            <nav className="flex items-center gap-0 px-2 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  activeOptions={{ exact: true }}
                  className="relative px-4 py-1.5 text-[12px] tracking-[0.15em] uppercase font-medium transition-all rounded-full text-white/55 hover:text-white"
                  activeProps={{
                    className:
                      "relative px-4 py-1.5 text-[12px] tracking-[0.15em] uppercase font-medium transition-all rounded-full bg-white text-black",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTACT bubble — aponta pro CRM (Relações) */}
        <Link
          to="/relacoes"
          className="fixed bottom-6 right-6 z-40 size-24 rounded-full flex items-center justify-center font-mono text-[11px] tracking-[0.25em] text-white/90 hover:scale-105 transition-transform"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(212,175,55,0.9), rgba(45,32,8,0.95))",
            boxShadow:
              "inset -6px -6px 20px rgba(0,0,0,0.7), inset 4px 4px 18px rgba(255,225,150,0.2), 0 8px 30px rgba(212,175,55,0.4)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          CONTATO
        </Link>

        {/* ===== HERO ===== */}
        <motion.section
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 min-h-screen flex items-center justify-center px-6"
        >
          <div className="absolute top-20 left-8 font-mono text-[11px] tracking-[0.25em] text-white/70 leading-relaxed">
            <div className="flex gap-6">
              <span className="text-[#d4af37]">BRASIL</span>
              <span>label · rap · trap</span>
            </div>
          </div>
          <div className="absolute top-20 right-8 font-mono text-[11px] tracking-[0.2em] text-white/70">
            {time}
          </div>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 font-mono text-[11px] text-white/60">
            <div>desde</div>
            <div className="ml-8">2021 &lt;</div>
          </div>
          <div className="absolute right-12 top-1/2 -translate-y-1/2 font-mono text-[11px] tracking-[0.2em] text-white/70 text-right uppercase leading-relaxed">
            CASA<br />FERRAMENTA<br />PLANO<br />DE JOGO
          </div>

          <HudCircle />

          <h1
            className="absolute bottom-16 left-8 leading-[0.9] tracking-[-0.02em] uppercase"
            style={{
              fontFamily: "'Archivo Black', system-ui, sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
            }}
          >
            <span className="block text-white">EHXIS</span>
            <span
              className="block text-white/60 italic font-light normal-case"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              trophy room
            </span>
          </h1>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-white/40 uppercase">
            ↓ desça · entre na sala
          </div>
        </motion.section>

        {/* ===== TROPHIES BENTO ===== */}
        <section className="relative z-10 px-6 py-32">
          <div className="max-w-7xl mx-auto mb-12 flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">
                02 · sala de troféus
              </div>
              <h2
                className="leading-none"
                style={{
                  fontFamily: "'Archivo Black', system-ui, sans-serif",
                  fontSize: "clamp(2rem,5vw,4.5rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                números <span className="text-[#d4af37]">reais</span>,<br />
                expostos como troféu.
              </h2>
            </div>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 max-w-xs text-right">
              clique em cada troféu · ficha técnica completa
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <TrophyBento />
          </div>
        </section>

        {/* ===== ABOUT TEASER ===== */}
        <section className="relative z-10 px-6 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40 mb-6">
              03 · a casa
            </div>
            <h2
              className="leading-[0.9] mb-8"
              style={{
                fontFamily: "'Archivo Black', system-ui, sans-serif",
                fontSize: "clamp(2rem,5vw,4rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Hall da fama com a<br />
              frieza de um <span className="text-[#d4af37]">estádio</span>.
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Cada conquista da EHXIS exposta como troféu. Sem nostalgia, com
              precisão de dados — o rap brasileiro do jeito que o rap brasileiro
              merece.
            </p>
            {/* FERB: leva pra Agência, que é "a casa" operacional */}
            <Link
              to="/agencia"
              className="inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-full border border-white/15 text-white/90 hover:bg-white hover:text-black font-mono text-xs tracking-[0.25em] uppercase transition-all"
            >
              entrar na agência →
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-10 px-6 py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex items-end justify-between flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            <div className="flex items-center gap-3">
              <span
                className="text-white text-base"
                style={{
                  fontFamily: "'Archivo Black', system-ui, sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                EHXIS
              </span>
              <span>rap & trap</span>
            </div>
            <span>© {new Date().getFullYear()} · todos os troféus reservados</span>
          </div>
        </footer>
      </div>
    </>
  );
}
