import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Sparkles,
  TrendingUp, TrendingDown, Activity,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/critico")({ component: Critico });

// ── Types ────────────────────────────────────────────
interface Recommendation { action: string; priority: string; agent: string; deadline: string; rationale?: string }
interface AutoAnalysis {
  id: string;
  agentType: string;
  summary: string;
  fullAnalysis: string;
  recommendations: Recommendation[];
  humanReview: string | null;
  humanNotes: string | null;
  generatedAt: string;
}
interface DetectedEvent {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  platform: string;
  title: string;
  description: string;
  metricName: string;
  currentValue: number;
  baselineValue: number;
  changePct: number;
  status: "detected" | "analyzing" | "analyzed" | "actioned" | "dismissed";
  detectedAt: string;
  analysis: AutoAnalysis | null;
}
interface Dashboard {
  pendingReview: number;
  critical30d: number;
  events30d: number;
  lastMetric: { date: string; spotifyMonthlyListeners?: number | null } | null;
  lastAnalysis: { agentType: string; generatedAt: string } | null;
}

const SEVERITY: Record<string, { label: string; cls: string }> = {
  critical: { label: "Crítico",  cls: "bg-primary/25 text-primary border-primary/40" },
  high:     { label: "Alto",     cls: "bg-primary/15 text-primary border-primary/25" },
  medium:   { label: "Médio",    cls: "bg-[#8a6d1f]/30 text-[#cda84a] border-[#8a6d1f]/30" },
  low:      { label: "Baixo",    cls: "bg-white/8 text-white/65 border-white/10" },
};

const STATUS_LABEL: Record<string, string> = {
  detected: "Detectado", analyzing: "Analisando", analyzed: "Analisado",
  actioned: "Aprovado",  dismissed: "Descartado",
};

const fmt = (v?: number | null) => {
  if (v == null) return "—";
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + "k";
  return v.toLocaleString("pt-BR");
};

function Critico() {
  const qc = useQueryClient();

  const dashQ = useQuery<Dashboard>({
    queryKey: ["intel-dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/intelligence/dashboard");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 60_000,
  });

  const eventsQ = useQuery<DetectedEvent[]>({
    queryKey: ["intel-events"],
    queryFn: async () => {
      const r = await fetch("/api/intelligence/events?limit=30");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const trigger = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/intelligence/trigger", { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["intel-events"] });
        qc.invalidateQueries({ queryKey: ["intel-dashboard"] });
      }, 8000);
    },
  });

  const review = useMutation({
    mutationFn: async (vars: { id: string; decision: "approved" | "rejected"; notes?: string }) => {
      const r = await fetch(`/api/intelligence/events/${vars.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: vars.decision, notes: vars.notes || "" }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intel-events"] });
      qc.invalidateQueries({ queryKey: ["intel-dashboard"] });
    },
  });

  const dash   = dashQ.data;
  const events = eventsQ.data ?? [];

  return (
    <Shell>
      <section className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Crítico / Central de Inteligência</p>
          <h1 className="text-white">O que precisa da sua atenção</h1>
          <p className="text-text-dim text-[15px] mt-2 max-w-2xl">
            O FERB capta as métricas diariamente, detecta anomalias (spikes, quedas, viralizações)
            e os agentes geram análise + recomendação antes de você decidir.
          </p>
        </div>
        <button
          onClick={() => trigger.mutate()}
          disabled={trigger.isPending}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {trigger.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Rodar ciclo agora
        </button>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-1.5 text-text-dim text-[12px] uppercase tracking-wide mb-1">
            <AlertTriangle size={13} /> Aguardando review
          </div>
          <p className="text-white text-2xl font-semibold">{dash?.pendingReview ?? "—"}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-1.5 text-text-dim text-[12px] uppercase tracking-wide mb-1">
            <Activity size={13} /> Eventos 30d
          </div>
          <p className="text-white text-2xl font-semibold">{dash?.events30d ?? "—"}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-1.5 text-text-dim text-[12px] uppercase tracking-wide mb-1">
            <Sparkles size={13} /> Críticos / altos
          </div>
          <p className="text-white text-2xl font-semibold">{dash?.critical30d ?? "—"}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-1.5 text-text-dim text-[12px] uppercase tracking-wide mb-1">
            Última análise
          </div>
          <p className="text-white text-[14px] font-medium truncate">
            {dash?.lastAnalysis
              ? `${dash.lastAnalysis.agentType} · ${new Date(dash.lastAnalysis.generatedAt).toLocaleDateString("pt-BR")}`
              : "—"}
          </p>
        </GlassCard>
      </div>

      {/* Loading / empty / error */}
      {eventsQ.isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-sm py-16 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando eventos…
        </div>
      ) : eventsQ.isError ? (
        <GlassCard className="text-center py-10">
          <p className="text-white mb-4">Não consegui carregar os eventos.</p>
          <button onClick={() => eventsQ.refetch()} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </GlassCard>
      ) : events.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Sparkles size={28} className="text-primary mx-auto mb-3" />
          <p className="text-white text-[15px]">Nada acionou um alerta ainda.</p>
          <p className="text-text-dim text-[14px] mt-2 max-w-md mx-auto">
            O sistema precisa de cerca de 7 dias de métricas para estabelecer o baseline.
            A partir daí, qualquer spike, queda ou viralização vira um evento aqui — com a análise pronta.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {events.map(ev => <EventCard key={ev.id} event={ev} onReview={(d) => review.mutate({ id: ev.id, decision: d })} reviewing={review.isPending} />)}
        </div>
      )}
    </Shell>
  );
}

function EventCard({ event, onReview, reviewing }: {
  event: DetectedEvent;
  onReview: (d: "approved" | "rejected") => void;
  reviewing: boolean;
}) {
  const sev = SEVERITY[event.severity] ?? SEVERITY.medium;
  const up = event.changePct > 0;
  const a = event.analysis;

  return (
    <GlassCard className="p-0 overflow-hidden">
      {/* faixa de severidade no topo */}
      <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={["inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", sev.cls].join(" ")}>
            {sev.label}
          </span>
          <span className="text-text-dim text-[12px] uppercase tracking-[0.18em] font-mono">
            {event.platform} · {event.type}
          </span>
        </div>
        <span className="text-text-dim text-[12px] font-mono">
          {new Date(event.detectedAt).toLocaleString("pt-BR")} · {STATUS_LABEL[event.status]}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-white text-[17px] font-semibold leading-snug">{event.title}</h3>
        <p className="text-text-dim text-[14px] mt-2 leading-relaxed">{event.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px]">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-text-dim">métrica:</span>
            <span className="text-white font-mono">{event.metricName}</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="text-text-dim">hoje:</span>
            <span className="text-white font-medium">{fmt(event.currentValue)}</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="text-text-dim">baseline 7d:</span>
            <span className="text-white/80">{fmt(Math.round(event.baselineValue))}</span>
          </div>
          <div className={["inline-flex items-center gap-1", up ? "text-primary" : "text-white/55"].join(" ")}>
            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span className="font-medium">{(up ? "+" : "") + event.changePct.toFixed(1)}%</span>
          </div>
        </div>

        {a && (
          <div className="mt-5 pt-5 border-t border-white/8">
            <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-3">
              Análise · {a.agentType}
            </p>
            <p className="text-white/90 text-[14px] leading-relaxed">{a.summary}</p>

            {a.recommendations?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-text-dim text-xs uppercase tracking-[0.18em]">Recomendações</p>
                {a.recommendations.slice(0, 4).map((r, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/4 rounded-xl px-3 py-2.5">
                    <span className={[
                      "shrink-0 mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-medium tracking-wider",
                      r.priority === "critical" ? "bg-primary/25 text-primary"
                      : r.priority === "high"   ? "bg-primary/15 text-primary"
                      : r.priority === "medium" ? "bg-[#8a6d1f]/30 text-[#cda84a]"
                      : "bg-white/8 text-white/55",
                    ].join(" ")}>
                      {r.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px]">{r.action}</p>
                      <p className="text-text-dim text-[11px] mt-0.5 font-mono">
                        {r.agent} · {r.deadline}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Review buttons */}
            {event.status === "analyzed" && !a.humanReview && (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  disabled={reviewing}
                  onClick={() => onReview("approved")}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> Aprovar e virar tarefa
                </button>
                <button
                  disabled={reviewing}
                  onClick={() => onReview("rejected")}
                  className="inline-flex items-center gap-2 bg-white/8 text-text-dim hover:text-white rounded-xl px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} /> Descartar
                </button>
              </div>
            )}

            {a.humanReview && (
              <div className={[
                "mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium",
                a.humanReview === "approved" ? "bg-primary/15 text-primary" : "bg-white/8 text-text-dim",
              ].join(" ")}>
                {a.humanReview === "approved" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {a.humanReview === "approved" ? "Aprovado" : "Descartado"}
                {a.humanNotes && <span className="text-text-dim/80 ml-1">— {a.humanNotes}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
