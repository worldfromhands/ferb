import { useQuery } from "@tanstack/react-query";
import { Loader2, Map } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface EstadoCity { city: string; listeners: number }
interface Estado {
  rank: number;
  code: string;
  name: string;
  totalListeners: number;
  cityCount: number;
  topCities: EstadoCity[];
}
interface StatesData { states: Estado[]; totalStates: number; totalBRListeners: number }

function fmt(v?: number) {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + "k";
  return v.toLocaleString("pt-BR");
}

export function EstadosPanel() {
  const { data, isLoading } = useQuery<StatesData>({
    queryKey: ["states", "kyan"],
    queryFn: async () => {
      const r = await fetch("/api/states/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const states = data?.states ?? [];
  const max = states[0]?.totalListeners || 1;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Map size={18} className="text-primary" />
        <h2 className="text-white text-[17px] font-semibold">Audiência por estado</h2>
      </div>

      {isLoading ? (
        <GlassCard className="flex items-center gap-2 text-text-dim text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Agrupando cidades por estado…
        </GlassCard>
      ) : states.length === 0 ? (
        <GlassCard className="py-6 text-center">
          <p className="text-text-dim text-[14px]">Sem dados de estados no momento.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <p className="text-text-dim text-[12px] mb-4">
            {data?.totalStates} estados · {fmt(data?.totalBRListeners)} ouvintes no Brasil
          </p>
          <ul className="space-y-3.5">
            {states.map(s => (
              <li key={s.code}>
                <div className="flex items-center justify-between text-[14px] mb-1">
                  <span className="text-white">
                    <span className="text-text-dim mr-1.5">#{s.rank}</span>
                    {s.name}
                    <span className="text-text-dim ml-1.5 text-[12px]">({s.code})</span>
                  </span>
                  <span className="text-text-dim">{fmt(s.totalListeners)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, (s.totalListeners / max) * 100)}%` }}
                  />
                </div>
                {s.topCities?.length > 0 && (
                  <p className="text-text-dim/70 text-[11px] mt-1">
                    {s.topCities.slice(0, 3).map(c => c.city).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </section>
  );
}
