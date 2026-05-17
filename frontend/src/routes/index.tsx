import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle,
  CheckCircle2, Clock, RefreshCw, Loader2,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard, Badge } from "@/components/GlassCard";
import { ArtistPhotos } from "@/components/ArtistPhotos";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

// ── Types ────────────────────────────────────────────────────────────────────
type Tone = "bad" | "warn" | "good";

interface CriticalItem  { message: string; status?: string }
interface MetricChange  { label: string; value?: number; current?: number; delta?: number }
interface PendingTask   { title: string; priority?: string }
interface Opportunity   { title: string; description?: string }

interface HomeReport {
  summary?: string;
  overallStatus?: string;
  criticalItems?: CriticalItem[];
  metricChanges?: MetricChange[];
  pendingTasks?: PendingTask[];
  opportunities?: Opportunity[];
  generatedAt?: string;
}

// ── Data fetch ────────────────────────────────────────────────────────────────
function useHomeReport() {
  return useQuery<HomeReport>({
    queryKey: ["home", "kyan"],
    queryFn: async () => {
      const r = await fetch("/api/home/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusToTone(status?: string): Tone {
  if (!status) return "warn";
  if (status === "critical" || status === "critico") return "bad";
  if (status === "warning"  || status === "alerta")  return "warn";
  return "good";
}

function formatValue(v?: number) {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + "k";
  return v.toLocaleString("pt-BR");
}

function formatDelta(d?: number) {
  if (d == null) return null;
  const sign = d > 0 ? "+" : "";
  return sign + d.toLocaleString("pt-BR");
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  }).replace(/^\w/, (c) => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────────────────
function Home() {
  const { data: report, isLoading, isError, refetch, isFetching } = useHomeReport();

  const criticos = (report?.criticalItems ?? []).slice(0, 5);
  const mudancas = (report?.metricChanges ?? []).slice(0, 6);
  const tarefas  = (report?.pendingTasks  ?? []).slice(0, 4);
  const oports   = (report?.opportunities ?? []).slice(0, 3);

  return (
    <Shell>
      {/* ── Header ── */}
      <section className="mb-16 flex items-start justify-between gap-4">
        <div>
          <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-4">{todayLabel()}</p>
          <h1 className="text-white max-w-3xl">
            {isLoading
              ? "Carregando seu painel..."
              : "Bom dia. Aqui está o que precisa da sua atenção hoje."}
          </h1>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-2 shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-[13px] text-text-dim hover:text-white glass transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </section>

      {/* ── Leitura estratégica FERB ── */}
      <section className="mb-16">
        <GlassCard
          className="relative overflow-hidden"
          style={{ backgroundColor: "rgba(250, 36, 60, 0.08)" }}
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              {isLoading || isFetching
                ? <Loader2 className="h-5 w-5 text-primary animate-spin" />
                : <Sparkles className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-primary text-[13px] font-semibold uppercase tracking-wider">
                  FERB acha que
                </span>
                {report?.generatedAt && (
                  <Badge>
                    {new Date(report.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-7 w-3/4 rounded-xl bg-white/10 animate-pulse" />
                  <div className="h-4 w-full rounded bg-white/6 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-white/6 animate-pulse" />
                </div>
              ) : isError ? (
                <p className="text-text-dim text-[15px]">
                  Não consegui gerar a análise agora. Backend offline?
                </p>
              ) : (
                <p className="text-white text-[17px] leading-relaxed font-medium max-w-3xl">
                  {report?.summary ?? "Análise indisponível."}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={() => refetch()} disabled={isFetching}>
                  {isFetching ? "Gerando..." : "↻ Nova análise"}
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ── Fotos Instagram ── */}
      <ArtistPhotos username="kyanmaloka" artistName="Kyan Maloka" />

      {/* ── Crítico hoje ── */}
      {(criticos.length > 0 || isLoading) && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-white">Crítico hoje</h2>
          </div>
          <GlassCard className="p-0 overflow-hidden">
            {isLoading ? (
              <SkeletonList rows={3} />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {criticos.map((c, i) => {
                  const tone = statusToTone(c.status);
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-4 px-6 py-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            tone === "bad" ? "var(--bad)" :
                            tone === "warn" ? "var(--warn)" : "var(--good)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[15px] font-medium truncate">{c.message}</p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-text-dim shrink-0" />
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>
        </section>
      )}

      {/* ── Métricas ── */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-white">Métricas</h2>
          <span className="text-text-dim text-[13px]">Chartmetric</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <GlassCard key={i} className="flex flex-col gap-6">
                  <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                  <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
                </GlassCard>
              ))
            : mudancas.map((m, i) => {
                const val = m.current ?? m.value;
                const up  = (m.delta ?? 0) >= 0;
                return (
                  <GlassCard key={i} className="flex flex-col gap-4">
                    <span className="text-text-dim text-[13px] uppercase tracking-wider">{m.label}</span>
                    <div>
                      <p className="text-white text-[32px] font-semibold tracking-tight leading-none">
                        {formatValue(val)}
                      </p>
                      {m.delta != null && (
                        <div
                          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium"
                          style={{ color: up ? "var(--good)" : "var(--bad)" }}
                        >
                          {up
                            ? <ArrowUpRight className="h-4 w-4" />
                            : <ArrowDownRight className="h-4 w-4" />}
                          {formatDelta(m.delta)}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
        </div>
      </section>

      {/* ── Tarefas + Oportunidades ── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tarefas */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-white text-[22px] font-semibold">Tarefas</h2>
              </div>
              {tarefas.length > 0 && <Badge>{tarefas.length} abertas</Badge>}
            </div>
            {isLoading ? (
              <SkeletonList rows={3} compact />
            ) : (
              <ul className="space-y-4">
                {tarefas.map((t, i) => {
                  const high = t.priority === "high" || t.priority === "critica" || t.priority === "alta";
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border border-white/20 flex items-center justify-center shrink-0" />
                      <span className="flex-1 text-[15px] text-white">{t.title}</span>
                      {high && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium uppercase tracking-wide">
                          <Clock className="h-3 w-3" /> urgente
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>

          {/* Oportunidades */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-white text-[22px] font-semibold">Oportunidades</h2>
              </div>
              <Badge>FERB detectou</Badge>
            </div>
            {isLoading ? (
              <SkeletonList rows={3} compact />
            ) : (
              <ul className="space-y-5">
                {oports.map((o, i) => (
                  <li key={i} className="group cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white text-[15px] font-medium group-hover:text-primary transition-colors">
                          {o.title}
                        </p>
                        {o.description && (
                          <p className="text-text-dim text-[13px] mt-1">{o.description}</p>
                        )}
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-text-dim group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </section>
    </Shell>
  );
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────
function SkeletonList({ rows = 3, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-4" : ""}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-3 ${compact ? "" : "px-6 py-5"}`}>
          <div className="h-2 w-2 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="flex-1 h-4 rounded bg-white/10 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
