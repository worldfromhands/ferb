import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, RefreshCw, MapPin, Globe, TrendingUp, TrendingDown, AlertCircle,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";
import { TikTokPanel } from "@/components/TikTokPanel";
import { PlatformsPanel } from "@/components/PlatformsPanel";
import { DNAPanel } from "@/components/DNAPanel";
import { EstadosPanel } from "@/components/EstadosPanel";

export const Route = createFileRoute("/dados")({ component: Dados });

// ── Types ────────────────────────────────────────────
interface AudienceMetric { group?: string; label: string; value: number; delta: number | null; status?: string }
interface MetricChange   { label: string; value?: number; current?: number; delta?: number }
interface City    { name: string; listeners: number; country?: string | null }
interface Country { name: string; code?: string | null; listeners: number }
interface AudienceData {
  available: boolean;
  metrics: AudienceMetric[];
  metricChanges: MetricChange[];
  topCities: City[];
  topCountries: Country[];
  identity: { name?: string } | null;
  updatedAt: string;
}

// ── Helpers ──────────────────────────────────────────
function fmt(v?: number | null) {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + "k";
  return v.toLocaleString("pt-BR");
}
function fmtDelta(d?: number | null) {
  if (d == null) return null;
  return (d > 0 ? "+" : "") + d.toLocaleString("pt-BR");
}

// ── Data ─────────────────────────────────────────────
function useAudience() {
  return useQuery<AudienceData>({
    queryKey: ["audience", "kyan"],
    queryFn: async () => {
      const r = await fetch("/api/audience/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ── Component ────────────────────────────────────────
function Dados() {
  const { data, isLoading, isError, refetch, isFetching } = useAudience();

  const metrics   = data?.metrics       ?? [];
  const cidades   = data?.topCities     ?? [];
  const paises    = data?.topCountries  ?? [];
  const maxCity   = cidades[0]?.listeners || 1;
  const maxPais   = paises[0]?.listeners  || 1;

  return (
    <Shell>
      <section className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Dados / Audiência</p>
          <h1 className="text-white">Quem te ouve e onde</h1>
          <p className="text-text-dim text-[15px] mt-2">Streams, ouvintes e geografia da sua audiência.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 bg-white/8 text-text-dim hover:text-white rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Atualizar
        </button>
      </section>

      {/* Plataformas + TikTok + DNA — carregam independente do Chartmetric */}
      <PlatformsPanel />
      <DNAPanel />
      <EstadosPanel />
      <TikTokPanel />

      {isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-sm py-16 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando dados de audiência…
        </div>
      ) : isError ? (
        <GlassCard className="text-center py-10">
          <p className="text-white mb-4">Não consegui carregar os dados.</p>
          <button onClick={() => refetch()} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </GlassCard>
      ) : (
        <>
          {/* Banner honesto se Chartmetric estiver fora */}
          {data && !data.available && (
            <GlassCard className="mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-[15px] font-medium">Dados do Chartmetric indisponíveis</p>
                <p className="text-text-dim text-[14px] mt-1">
                  A fonte de audiência está temporariamente fora do ar (cota da API). Os números voltam assim que o acesso for restabelecido.
                </p>
              </div>
            </GlassCard>
          )}

          {/* Métricas */}
          {metrics.length > 0 && (
            <section className="mb-8">
              <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-4">Métricas-chave</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {metrics.map((m, i) => {
                  const up = (m.delta ?? 0) > 0;
                  const down = (m.delta ?? 0) < 0;
                  return (
                    <GlassCard key={i} className="p-5">
                      <p className="text-text-dim text-[12px] uppercase tracking-wide mb-2">{m.label}</p>
                      <p className="text-white text-2xl font-semibold">{fmt(m.value)}</p>
                      {m.delta != null && (
                        <p className={[
                          "text-[13px] mt-1 inline-flex items-center gap-1",
                          up ? "text-emerald-400" : down ? "text-amber-400" : "text-text-dim",
                        ].join(" ")}>
                          {up ? <TrendingUp size={13} /> : down ? <TrendingDown size={13} /> : null}
                          {fmtDelta(m.delta)}
                        </p>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cidades + Países */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top cidades */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={18} className="text-primary" />
                <h2 className="text-white text-[17px] font-semibold">Top cidades</h2>
              </div>
              {cidades.length === 0 ? (
                <p className="text-text-dim text-[14px] py-4">Sem dados de cidades no momento.</p>
              ) : (
                <ul className="space-y-3">
                  {cidades.slice(0, 12).map((c, i) => (
                    <li key={i}>
                      <div className="flex items-center justify-between text-[14px] mb-1">
                        <span className="text-white">{i + 1}. {c.name}</span>
                        <span className="text-text-dim">{fmt(c.listeners)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(4, (c.listeners / maxCity) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            {/* Top países */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <Globe size={18} className="text-primary" />
                <h2 className="text-white text-[17px] font-semibold">Onde sua música chega</h2>
              </div>
              {paises.length === 0 ? (
                <p className="text-text-dim text-[14px] py-4">Sem dados de países no momento.</p>
              ) : (
                <ul className="space-y-3">
                  {paises.slice(0, 10).map((p, i) => (
                    <li key={i}>
                      <div className="flex items-center justify-between text-[14px] mb-1">
                        <span className="text-white">{p.name}</span>
                        <span className="text-text-dim">{fmt(p.listeners)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white/40"
                          style={{ width: `${Math.max(4, (p.listeners / maxPais) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>

          {data?.updatedAt && (
            <p className="text-text-dim/60 text-xs mt-8">
              Atualizado em {new Date(data.updatedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </>
      )}
    </Shell>
  );
}
