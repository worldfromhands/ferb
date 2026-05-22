import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, Disc3, Music2, TrendingUp, TrendingDown, Globe, MapPin, ListMusic,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/catalogo")({ component: Catalogo });

// ── Types ────────────────────────────────────────────
interface Song   { rank: number; title: string; streams: number }
interface Album  { title: string; type: string; streams: number; releaseDate?: string }
interface AlbumAnalysis {
  title: string; streams12m: number; listeners12m: number;
  growthStreams: string; reading?: string;
}
interface GeoItem { country?: string; city?: string; streams: number }
interface Playlist { name: string; reach: number; editorial?: boolean }
interface CatalogData {
  meta: { capturedAt: string; period: string; note: string };
  summary: {
    topSong: { title: string; streams: number } | null;
    topAlbum: { title: string; streams: number } | null;
    totalAlbumStreams: number;
    fastestGrowing: { title: string; growth: string } | null;
  };
  topSongs: Song[];
  albums: Album[];
  albumAnalysis: AlbumAnalysis[];
  geography: { topCountries: GeoItem[]; topCities: GeoItem[] };
  playlists: { byReach: Playlist[] };
}

function fmt(v?: number) {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + "k";
  return v.toLocaleString("pt-BR");
}
const isUp = (g: string) => g.trim().startsWith("+");

function Catalogo() {
  const { data, isLoading, isError, refetch } = useQuery<CatalogData>({
    queryKey: ["catalog", "kyan"],
    queryFn: async () => {
      const r = await fetch("/api/catalog/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  const songs   = data?.topSongs ?? [];
  const albums  = data?.albums ?? [];
  const maxSong = songs[0]?.streams || 1;
  const maxAlb  = Math.max(...albums.map(a => a.streams), 1);

  return (
    <Shell>
      <section className="mb-8">
        <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Catálogo / Criação</p>
        <h1 className="text-white">O catálogo do KYAN</h1>
        <p className="text-text-dim text-[15px] mt-2">
          Streams reais por faixa e por álbum — Spotify for Artists.
        </p>
      </section>

      {isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-sm py-16 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando catálogo…
        </div>
      ) : isError || !data ? (
        <GlassCard className="text-center py-10">
          <p className="text-white mb-4">Não consegui carregar o catálogo.</p>
          <button onClick={() => refetch()} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </GlassCard>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            <GlassCard className="p-5">
              <p className="text-text-dim text-[12px] uppercase tracking-wide mb-1">Música #1</p>
              <p className="text-white text-[17px] font-semibold truncate">{data.summary.topSong?.title}</p>
              <p className="text-primary text-[13px] mt-0.5">{fmt(data.summary.topSong?.streams)} streams</p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-text-dim text-[12px] uppercase tracking-wide mb-1">Álbum #1</p>
              <p className="text-white text-[17px] font-semibold truncate">{data.summary.topAlbum?.title}</p>
              <p className="text-primary text-[13px] mt-0.5">{fmt(data.summary.topAlbum?.streams)} streams</p>
            </GlassCard>
            <GlassCard className="p-5">
              <p className="text-text-dim text-[12px] uppercase tracking-wide mb-1">Em alta</p>
              <p className="text-white text-[17px] font-semibold truncate">{data.summary.fastestGrowing?.title}</p>
              <p className="text-primary text-[13px] mt-0.5 inline-flex items-center gap-1">
                <TrendingUp size={13} /> {data.summary.fastestGrowing?.growth}
              </p>
            </GlassCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top músicas */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <Music2 size={18} className="text-primary" />
                <h2 className="text-white text-[17px] font-semibold">Top músicas</h2>
              </div>
              <ul className="space-y-3">
                {songs.slice(0, 12).map(s => (
                  <li key={s.rank}>
                    <div className="flex items-center justify-between text-[14px] mb-1">
                      <span className="text-white"><span className="text-text-dim mr-1.5">{s.rank}.</span>{s.title}</span>
                      <span className="text-text-dim">{fmt(s.streams)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (s.streams / maxSong) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Discografia */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <Disc3 size={18} className="text-primary" />
                <h2 className="text-white text-[17px] font-semibold">Discografia</h2>
              </div>
              <ul className="space-y-3">
                {albums.map(a => (
                  <li key={a.title}>
                    <div className="flex items-center justify-between text-[14px] mb-1">
                      <span className="text-white">
                        {a.title}
                        <span className="text-text-dim ml-1.5 text-[11px] uppercase">{a.type}</span>
                      </span>
                      <span className="text-text-dim">{fmt(a.streams)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full bg-white/40" style={{ width: `${Math.max(3, (a.streams / maxAlb) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* Análise dos álbuns */}
          <section className="mt-6">
            <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-3">Análise dos álbuns (12 meses)</p>
            <div className="grid md:grid-cols-3 gap-3">
              {data.albumAnalysis.map(a => {
                const up = isUp(a.growthStreams);
                return (
                  <GlassCard key={a.title} className="p-5">
                    <p className="text-white text-[15px] font-semibold">{a.title}</p>
                    <p className={["text-[13px] mt-1 inline-flex items-center gap-1", up ? "text-primary" : "text-white/40"].join(" ")}>
                      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {a.growthStreams} streams
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/8 flex gap-4 text-[12px]">
                      <span className="text-text-dim">{fmt(a.streams12m)} streams</span>
                      <span className="text-text-dim">{fmt(a.listeners12m)} ouvintes</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          {/* Geografia */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <Globe size={18} className="text-primary" />
                <h2 className="text-white text-[17px] font-semibold">Países</h2>
              </div>
              <ul className="space-y-2.5">
                {data.geography.topCountries.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-[14px]">
                    <span className="text-white">{p.country}</span>
                    <span className="text-text-dim">{fmt(p.streams)}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={18} className="text-primary" />
                <h2 className="text-white text-[17px] font-semibold">Cidades</h2>
              </div>
              <ul className="space-y-2.5">
                {data.geography.topCities.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-[14px]">
                    <span className="text-white">{c.city}</span>
                    <span className="text-text-dim">{fmt(c.streams)}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* Playlists */}
          <GlassCard className="mt-6">
            <div className="flex items-center gap-2 mb-5">
              <ListMusic size={18} className="text-primary" />
              <h2 className="text-white text-[17px] font-semibold">Playlists por alcance</h2>
            </div>
            <ul className="space-y-2">
              {data.playlists.byReach.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-[14px]">
                  <span className="text-white">
                    {p.name}
                    {p.editorial && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                        editorial
                      </span>
                    )}
                  </span>
                  <span className="text-text-dim">{fmt(p.reach)}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <p className="text-text-dim/60 text-xs mt-8">{data.meta.note}</p>
        </>
      )}
    </Shell>
  );
}
