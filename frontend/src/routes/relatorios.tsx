import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Sparkles, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/relatorios")({ component: Relatorios });

// ── Types ────────────────────────────────────────────
interface ReportMetric { source: string; label: string; value: number; delta: number | null }
interface DailyReport {
  id: string;
  date: string;
  summary: string;
  status: string; // ok | good | warning | critical
  metrics: ReportMetric[];
}

const API = "/api/reports/kyan";

const STATUS_STYLE: Record<string, string> = {
  good:     "bg-emerald-500/15 text-emerald-400",
  ok:       "bg-emerald-500/15 text-emerald-400",
  warning:  "bg-amber-500/15 text-amber-400",
  critical: "bg-red-500/15 text-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  good: "No rumo", ok: "No rumo", warning: "Atenção", critical: "Crítico",
};

function fmt(v?: number | null) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1).replace(".", ",") + "k";
  return v.toLocaleString("pt-BR");
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, c => c.toUpperCase());
}

function ReportCard({ r, featured }: { r: DailyReport; featured?: boolean }) {
  return (
    <GlassCard className={featured ? "" : "p-5"}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-text-dim" />
          <span className="text-white text-[15px] font-medium">{fmtDate(r.date)}</span>
        </div>
        <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", STATUS_STYLE[r.status] ?? STATUS_STYLE.ok].join(" ")}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </div>

      <div className="flex items-start gap-2">
        <Sparkles size={15} className="text-primary shrink-0 mt-1" />
        <p className="text-white/90 text-[15px] leading-relaxed">{r.summary}</p>
      </div>

      {r.metrics?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {r.metrics.map((m, i) => {
            const up = (m.delta ?? 0) > 0, down = (m.delta ?? 0) < 0;
            return (
              <div key={i} className="bg-white/5 rounded-lg p-2.5">
                <p className="text-text-dim text-[11px] truncate" title={m.label}>{m.label}</p>
                <p className="text-white text-[15px] font-semibold">{fmt(m.value)}</p>
                {m.delta != null && m.delta !== 0 && (
                  <p className={["text-[11px] inline-flex items-center gap-0.5", up ? "text-emerald-400" : down ? "text-amber-400" : "text-text-dim"].join(" ")}>
                    {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {(m.delta > 0 ? "+" : "") + fmt(m.delta)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

function Relatorios() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<{ reports: DailyReport[] }>({
    queryKey: ["reports"],
    queryFn: async () => {
      const r = await fetch(API);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/run`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  const reports = data?.reports ?? [];
  const [latest, ...rest] = reports;

  return (
    <Shell>
      <section className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Relatórios</p>
          <h1 className="text-white">O histórico do FERB</h1>
          <p className="text-text-dim text-[15px] mt-2">
            Todo dia às 6:30 o FERB lê seus números e registra o relatório. Aqui fica o arquivo.
          </p>
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {generate.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Gerar agora
        </button>
      </section>

      {isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-sm py-16 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando relatórios…
        </div>
      ) : isError ? (
        <GlassCard className="text-center py-10">
          <p className="text-white mb-4">Não consegui carregar os relatórios.</p>
          <button onClick={() => refetch()} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </GlassCard>
      ) : reports.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText size={28} className="text-text-dim mx-auto mb-3" />
          <p className="text-white text-[15px]">Nenhum relatório ainda.</p>
          <p className="text-text-dim text-[14px] mt-1">
            O primeiro nasce amanhã às 6:30 — ou clique em "Gerar agora".
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Relatório mais recente — destacado */}
          <div>
            <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-3">Mais recente</p>
            <ReportCard r={latest} featured />
          </div>

          {/* Histórico */}
          {rest.length > 0 && (
            <div>
              <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-3">Histórico</p>
              <div className="space-y-3">
                {rest.map(r => <ReportCard key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
