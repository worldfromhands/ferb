import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Shell } from "./Shell";

interface EmBreveProps {
  /** Rótulo curto que aparece acima do título (nome da aba) */
  eyebrow: string;
  /** O que a aba vai ser, em uma frase */
  title: string;
  /** Parágrafo explicando o propósito da aba */
  description: string;
  /** Lista do que a aba vai trazer quando estiver pronta */
  features: string[];
  /** Fase planejada — ex.: "Fase 1", "Fase 2" */
  phase: string;
  /** Se o backend dessa aba já existe (muda o texto de status) */
  backendReady?: boolean;
  /** Ícone opcional (lucide-react) */
  icon?: ReactNode;
}

export function EmBreve({
  eyebrow,
  title,
  description,
  features,
  phase,
  backendReady = false,
  icon,
}: EmBreveProps) {
  return (
    <Shell>
      <section className="mb-10">
        <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">
          {eyebrow}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {icon && <span className="text-white/70">{icon}</span>}
          <h1 className="text-white">{title}</h1>
          <span className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-text-dim">
            Em breve
          </span>
        </div>
        <p className="text-text-dim text-[15px] mt-2 max-w-2xl">{description}</p>
      </section>

      <div className="glass rounded-2xl p-8 max-w-2xl">
        <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-5">
          O que essa aba vai trazer
        </p>
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[15px] text-white/80"
            >
              <span className="mt-[2px] text-primary shrink-0">→</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 pt-6 border-t border-white/8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-dim">Planejado para</span>
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
              {phase}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-dim">Backend</span>
            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                backendReady
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/8 text-text-dim",
              ].join(" ")}
            >
              {backendReady ? "pronto" : "a fazer"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/"
          className="text-sm text-text-dim hover:text-white transition-colors"
        >
          ← Voltar para a Home
        </Link>
      </div>
    </Shell>
  );
}
