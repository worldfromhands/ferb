import { useQuery } from "@tanstack/react-query";
import { Loader2, Activity, Gauge } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

// ── Types ────────────────────────────────────────────
interface SonicProfile {
  tracksAnalyzed: number;
  avgBPM: number;
  bpmGenre: string;
  energy: number;        energyLabel: string;
  danceability: number;
  valence: number;       moodLabel: string;
  acousticness: number;
  speechiness: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
}
interface DNATrack { name: string; bpm: number; energy: number; danceability: number; valence: number }
interface DNAData { profile: SonicProfile | null; tracks: DNATrack[]; source: string }

const BARS: { key: keyof SonicProfile; label: string; color: string }[] = [
  { key: "energy",       label: "Energia",       color: "#fa243c" },
  { key: "danceability", label: "Dançabilidade", color: "#30b0c0" },
  { key: "valence",      label: "Positividade",  color: "#f59e0b" },
  { key: "speechiness",  label: "Rap / Fala",    color: "#10b981" },
  { key: "acousticness", label: "Acústico",      color: "#8b5cf6" },
];

export function DNAPanel() {
  const { data, isLoading } = useQuery<DNAData>({
    queryKey: ["dna", "kyan"],
    queryFn: async () => {
      const r = await fetch("/api/dna/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  const p = data?.profile;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-primary" />
        <h2 className="text-white text-[17px] font-semibold">DNA Musical</h2>
      </div>

      {isLoading ? (
        <GlassCard className="flex items-center gap-2 text-text-dim text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Analisando o som do KYAN…
        </GlassCard>
      ) : !p ? (
        <GlassCard className="py-6 text-center">
          <p className="text-text-dim text-[14px]">Não foi possível montar o perfil sonoro agora.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          {/* BPM em destaque */}
          <div className="flex items-end gap-3 mb-1">
            <span className="text-white text-4xl font-semibold leading-none">{p.avgBPM}</span>
            <span className="text-text-dim text-[14px] mb-0.5">BPM médio · {p.bpmGenre}</span>
          </div>
          <p className="text-text-dim text-[12px] mb-5">{p.tracksAnalyzed} faixas analisadas · fonte ReccoBeats</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-[12px] text-white">
              <Gauge size={12} /> Energia {p.energyLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-[12px] text-white">
              Mood {p.moodLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-[12px] text-white">
              {p.loudness} dB
            </span>
          </div>

          {/* Barras de features */}
          <div className="space-y-3">
            {BARS.map(bar => {
              const v = (p[bar.key] as number) || 0;
              return (
                <div key={bar.key} className="flex items-center gap-3">
                  <span className="text-text-dim text-[13px] w-28 shrink-0">{bar.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round(v * 100)}%`, background: bar.color }}
                    />
                  </div>
                  <span className="text-white text-[13px] w-9 text-right shrink-0">{Math.round(v * 100)}%</span>
                </div>
              );
            })}
          </div>

          {/* Faixas analisadas */}
          {data?.tracks && data.tracks.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/8">
              <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-3">Faixas por BPM</p>
              <div className="flex flex-wrap gap-2">
                {data.tracks.slice(0, 10).map((t, i) => (
                  <span key={i} className="rounded-lg bg-white/5 px-2.5 py-1 text-[12px] text-text-dim">
                    {t.name} <span className="text-white">{t.bpm}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </section>
  );
}
