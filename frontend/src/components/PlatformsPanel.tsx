import { useQuery } from "@tanstack/react-query";
import { Loader2, Youtube, Music, Radio, Users, Eye, Video, Play, KeyRound } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

// ── Types ────────────────────────────────────────────
interface YouTubeSnap { channel?: { subscribers?: number; views?: number; videos?: number; title?: string } | null }
interface DeezerSnap  { artist?: { name?: string; fans?: number; albumsCount?: number } | null; topTracks?: unknown[] }
interface LastfmSnap  { info?: { listeners?: number; playcount?: number; tags?: string[] } | null }
interface PlatformsData {
  youtube: YouTubeSnap | null;  youtubeConfigured: boolean;
  deezer: DeezerSnap | null;    deezerConfigured: boolean;
  lastfm: LastfmSnap | null;    lastfmConfigured: boolean;
}

function fmt(v?: number | null) {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(1).replace(".", ",") + "k";
  return v.toLocaleString("pt-BR");
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">{icon}{label}</div>
      <p className="text-white text-lg font-semibold">{value}</p>
    </div>
  );
}

/** Card de plataforma sem chave configurada */
function MissingKey({ name, hint }: { name: string; hint: string }) {
  return (
    <div className="flex items-start gap-2 text-text-dim text-[13px]">
      <KeyRound size={15} className="shrink-0 mt-0.5 text-primary/70" />
      <span>{name} aguarda chave — {hint}</span>
    </div>
  );
}

export function PlatformsPanel() {
  const { data, isLoading } = useQuery<PlatformsData>({
    queryKey: ["platforms", "kyan"],
    queryFn: async () => {
      const r = await fetch("/api/platforms/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const yt = data?.youtube?.channel;
  const dz = data?.deezer?.artist;
  const lf = data?.lastfm?.info;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={18} className="text-primary" />
        <h2 className="text-white text-[17px] font-semibold">Plataformas</h2>
      </div>

      {isLoading ? (
        <GlassCard className="flex items-center gap-2 text-text-dim text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando plataformas…
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {/* YouTube */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Youtube size={18} className="text-primary" />
              <h3 className="text-white text-[15px] font-semibold">YouTube</h3>
            </div>
            {data?.youtubeConfigured && yt ? (
              <div className="grid grid-cols-3 gap-2">
                <Metric icon={<Users size={13} />}  label="Inscritos" value={fmt(yt.subscribers)} />
                <Metric icon={<Eye size={13} />}    label="Views"     value={fmt(yt.views)} />
                <Metric icon={<Video size={13} />}  label="Vídeos"    value={fmt(yt.videos)} />
              </div>
            ) : (
              <MissingKey name="YouTube" hint="YOUTUBE_API_KEY no .env" />
            )}
          </GlassCard>

          {/* Deezer */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Music size={18} className="text-primary" />
              <h3 className="text-white text-[15px] font-semibold">Deezer</h3>
            </div>
            {dz ? (
              <div className="grid grid-cols-3 gap-2">
                <Metric icon={<Users size={13} />} label="Fãs"     value={fmt(dz.fans)} />
                <Metric icon={<Music size={13} />} label="Álbuns"  value={fmt(dz.albumsCount)} />
                <Metric icon={<Play size={13} />}  label="Tracks"  value={fmt(data?.deezer?.topTracks?.length)} />
              </div>
            ) : (
              <p className="text-text-dim text-[13px]">Sem dados da Deezer no momento.</p>
            )}
          </GlassCard>

          {/* Last.fm */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Radio size={18} className="text-primary" />
              <h3 className="text-white text-[15px] font-semibold">Last.fm</h3>
            </div>
            {data?.lastfmConfigured && lf ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Metric icon={<Users size={13} />} label="Ouvintes" value={fmt(lf.listeners)} />
                  <Metric icon={<Play size={13} />}  label="Plays"    value={fmt(lf.playcount)} />
                </div>
                {lf.tags && lf.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {lf.tags.slice(0, 4).map((t, i) => (
                      <span key={i} className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-text-dim">{t}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <MissingKey name="Last.fm" hint="LASTFM_API_KEY no .env" />
            )}
          </GlassCard>
        </div>
      )}
    </section>
  );
}
