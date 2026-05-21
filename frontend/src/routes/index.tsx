import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2,
  Clock, RefreshCw, Loader2, Eye, MapPin, Disc3, ListMusic,
  Users, Globe, TrendingDown, TrendingUp, Youtube as YoutubeIcon,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard, Badge } from "@/components/GlassCard";
import { ArtistPhotos } from "@/components/ArtistPhotos";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

// ── Types ────────────────────────────────────────────
type Tone = "bad" | "warn" | "good";

interface Identity {
  name: string;
  image: string | null;
  hometown: string | null;
  rank: number | null;
  score: number | null;
  primaryGenre: string | null;
  secondaryGenres: string[];
  careerStage: string | null;
  stageScore: number | null;
  trend: string | null;
  trendScore: number | null;
  recordLabel: string | null;
  booking: string | null;
  description: string | null;
  moods: string[];
  activities: string[];
}

interface City   { name: string; listeners: number; country: string | null }
interface Country { name: string; code: string | null; listeners: number; population: number; affinity: number }
interface Album  { id?: string; name: string; release_date?: string; image_url?: string; label?: string }
interface Playlist { name?: string; playlist_name?: string; followers?: number; url?: string }
interface RelatedArtist { id?: string; name: string; image?: string; popularity?: number; followers?: number; genres?: string[] }
interface SpotifyTrack { id: string; name: string; album?: string; cover?: string | null; popularity?: number; url?: string }

interface CriticalItem  { message: string; status?: string }
interface MetricChange  { label: string; value?: number; current?: number; delta?: number }
interface AudienceMetric { group: string; label: string; value: number; delta: number | null; status: string }
interface PendingTask   { title: string; priority?: string }
interface Opportunity   { title: string; description?: string }

interface YouTubeVideo {
  id: string; title: string; thumbnail?: string;
  views?: number; likes?: number; comments?: number;
  publishedAt?: string; url?: string;
}
interface YouTubeChannel {
  title?: string; thumbnail?: string; banner?: string;
  subscribers?: number; views?: number; videos?: number;
}
interface YouTubeSnapshot { channel?: YouTubeChannel | null; videos?: YouTubeVideo[] }

interface HomeReport {
  summary?: string;
  overallStatus?: string;
  criticalItems?: CriticalItem[];
  metricChanges?: MetricChange[];
  audienceMetrics?: AudienceMetric[];
  identity?: Identity | null;
  topCities?: City[];
  topCountries?: Country[];
  albums?: Album[];
  playlists?: Playlist[];
  relatedArtists?: RelatedArtist[];
  spotifyTopTracks?: SpotifyTrack[];
  spotifyArtist?: { followers?: number; popularity?: number; genres?: string[] } | null;
  spotifyConfigured?: boolean;
  youtube?: YouTubeSnapshot | null;
  youtubeConfigured?: boolean;
  pendingTasks?: PendingTask[];
  opportunities?: Opportunity[];
  generatedAt?: string;
}

// ── Helpers ──────────────────────────────────────────
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
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());
}
function trendColor(trend?: string | null) {
  if (!trend) return "var(--text-dim)";
  const t = trend.toLowerCase();
  if (t.includes("gradual decline") || t.includes("decline") || t.includes("down")) return "#f59e0b";
  if (t.includes("steep decline") || t.includes("falling"))                          return "#ef4444";
  if (t.includes("growth") || t.includes("rising") || t.includes("up"))              return "#10b981";
  return "var(--text-dim)";
}

// ── Data fetch ───────────────────────────────────────
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

// ── Component ────────────────────────────────────────
function Home() {
  const { data: report, isLoading, isError, refetch, isFetching } = useHomeReport();

  const criticos    = (report?.criticalItems    ?? []).slice(0, 5);
  const mudancas    = (report?.metricChanges    ?? []).slice(0, 6);
  const audience    = (report?.audienceMetrics  ?? []);
  const cidades     = (report?.topCities        ?? []).slice(0, 10);
  const paises      = (report?.topCountries     ?? []).slice(0, 6);
  const albums      = (report?.albums           ?? []).slice(0, 6);
  const playlists   = (report?.playlists        ?? []).slice(0, 6);
  const related     = (report?.relatedArtists   ?? []).slice(0, 6);
  const topTracks   = (report?.spotifyTopTracks ?? []).slice(0, 5);
  const tarefas     = (report?.pendingTasks     ?? []).slice(0, 4);
  const oports      = (report?.opportunities    ?? []).slice(0, 3);

  const maxListeners = cidades[0]?.listeners ?? 1;

  return (
    <Shell>
      {/* ── Header ── */}
      <section className="mb-16 flex items-start justify-between gap-4">
        <div>
          <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-4">{todayLabel()}</p>
          <h1 className="text-white max-w-3xl">
            {isLoading ? "Lendo o momento..." : "Bom dia. O que o dia está pedindo de você."}
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

      {/* ── BLOCO 1: QUEM VOCÊ É HOJE (identity) ── */}
      {report?.identity && (
        <section className="mb-16">
          <GlassCard className="relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {report.identity.image && (
                <img
                  src={report.identity.image}
                  alt={report.identity.name}
                  className="h-32 w-32 rounded-2xl object-cover shrink-0"
                />
              )}
              <div className="flex-1">
                <p className="text-text-dim text-[12px] uppercase tracking-wider mb-2">Quem você é hoje</p>
                <h2 className="text-white text-[28px] font-semibold mb-1">{report.identity.name}</h2>
                {report.identity.hometown && (
                  <p className="text-text-dim text-[14px] mb-4">
                    <MapPin className="inline h-3.5 w-3.5 mr-1" />
                    {report.identity.hometown}
                  </p>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-text-dim text-[11px] uppercase tracking-wider">Ranking mundial</p>
                    <p className="text-white text-[20px] font-semibold mt-1">#{report.identity.rank?.toLocaleString("pt-BR") ?? "?"}</p>
                  </div>
                  <div>
                    <p className="text-text-dim text-[11px] uppercase tracking-wider">Estágio</p>
                    <p className="text-white text-[20px] font-semibold mt-1 capitalize">{report.identity.careerStage ?? "?"}</p>
                    <p className="text-text-dim text-[11px]">{report.identity.stageScore}/100</p>
                  </div>
                  <div>
                    <p className="text-text-dim text-[11px] uppercase tracking-wider">Tendência</p>
                    <div className="flex items-center gap-1 mt-1">
                      {report.identity.trend?.toLowerCase().includes("decline")
                        ? <TrendingDown className="h-4 w-4" style={{ color: trendColor(report.identity.trend) }} />
                        : <TrendingUp   className="h-4 w-4" style={{ color: trendColor(report.identity.trend) }} />}
                      <p className="text-[14px] font-semibold capitalize" style={{ color: trendColor(report.identity.trend) }}>
                        {report.identity.trend ?? "?"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-text-dim text-[11px] uppercase tracking-wider">Gênero</p>
                    <p className="text-white text-[14px] font-medium mt-1">{report.identity.primaryGenre ?? "?"}</p>
                    {report.identity.secondaryGenres.length > 0 && (
                      <p className="text-text-dim text-[11px] mt-0.5 line-clamp-1">
                        {report.identity.secondaryGenres.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* ── BLOCO 2: Leitura estratégica FERB ── */}
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
                  Leitura do momento
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
                <p className="text-text-dim text-[15px]">Não consegui gerar a análise agora. Backend offline?</p>
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

      {/* ── BLOCO 3: MÉTRICAS RÁPIDAS ── */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-white">Pulse</h2>
          <span className="text-text-dim text-[13px]">Chartmetric · ao vivo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <GlassCard key={i} className="flex flex-col gap-3 !p-5">
                  <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                  <div className="h-7 w-20 rounded-lg bg-white/10 animate-pulse" />
                </GlassCard>
              ))
            : audience.map((m, i) => {
                const up = (m.delta ?? 0) >= 0;
                return (
                  <GlassCard key={i} className="flex flex-col gap-2 !p-5">
                    <span className="text-text-dim text-[10px] uppercase tracking-wider line-clamp-1">{m.label}</span>
                    <p className="text-white text-[22px] font-semibold tracking-tight leading-none">
                      {formatValue(m.value)}
                    </p>
                    {m.delta != null && m.delta !== 0 && (
                      <div
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium"
                        style={{ color: up ? "var(--good)" : "var(--bad)" }}
                      >
                        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {formatDelta(m.delta)}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
        </div>
      </section>

      {/* ── BLOCO 4: MAPA REGIONAL REAL — TOP CIDADES ── */}
      {cidades.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-white">Mapa do seu público</h2>
              <p className="text-text-dim text-[13px] mt-1">Top cidades por ouvintes mensais</p>
            </div>
            <Globe className="h-5 w-5 text-text-dim" />
          </div>
          <GlassCard className="!p-6">
            <div className="space-y-3">
              {cidades.map((c, i) => {
                const pct = (c.listeners / maxListeners) * 100;
                return (
                  <div key={c.name} className="flex items-center gap-4">
                    <span className="text-text-dim text-[13px] w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-white text-[14px] font-medium truncate">{c.name}</p>
                        <p className="text-text-dim text-[13px] tabular-nums shrink-0 ml-3">
                          {c.listeners.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: i === 0 ? "var(--primary)" : "rgba(255,255,255,0.4)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </section>
      )}

      {/* ── BLOCO 5: TOP PAÍSES ── */}
      {paises.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-white">Onde sua música chega</h2>
            <span className="text-text-dim text-[13px]">Países</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {paises.map((p, i) => (
              <GlassCard key={i} className="!p-4">
                <p className="text-text-dim text-[11px] uppercase tracking-wider truncate">{p.name}</p>
                <p className="text-white text-[20px] font-semibold mt-1">{formatValue(p.listeners)}</p>
                <p className="text-text-dim text-[11px] mt-0.5">ouvintes</p>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* ── BLOCO 6: ÚLTIMOS LANÇAMENTOS ── */}
      {albums.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-white">Catálogo recente</h2>
              <p className="text-text-dim text-[13px] mt-1">Seus últimos lançamentos</p>
            </div>
            <Disc3 className="h-5 w-5 text-text-dim" />
          </div>
          <GlassCard className="!p-0 overflow-hidden">
            <ul className="divide-y divide-white/[0.06]">
              {albums.map((a, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.04] transition-colors">
                  <Disc3 className="h-4 w-4 text-text-dim shrink-0" />
                  <p className="flex-1 text-white text-[14px] font-medium truncate">{a.name}</p>
                  <p className="text-text-dim text-[12px] shrink-0">{a.release_date}</p>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>
      )}

      {/* ── BLOCO 7: TOP TRACKS NO SPOTIFY ── */}
      {topTracks.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-white">Top no Spotify</h2>
            <span className="text-text-dim text-[13px]">Mais ouvidas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topTracks.map(t => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="group glass rounded-2xl p-3 hover:bg-white/[0.07] transition-colors"
              >
                {t.cover && (
                  <img src={t.cover} alt={t.name} className="aspect-square w-full rounded-xl object-cover mb-3" />
                )}
                <p className="text-white text-[13px] font-medium line-clamp-2">{t.name}</p>
                <p className="text-text-dim text-[11px] mt-1">Popularidade {t.popularity}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── BLOCO 7b: YOUTUBE ── */}
      {report?.youtube?.channel && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-white">YouTube</h2>
              <p className="text-text-dim text-[13px] mt-1">{report.youtube.channel.title}</p>
            </div>
            <YoutubeIcon className="h-5 w-5 text-text-dim" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <GlassCard className="!p-5">
              <p className="text-text-dim text-[12px] uppercase tracking-wider">Inscritos</p>
              <p className="text-white text-[26px] font-semibold mt-2">{formatValue(report.youtube.channel.subscribers)}</p>
            </GlassCard>
            <GlassCard className="!p-5">
              <p className="text-text-dim text-[12px] uppercase tracking-wider">Visualizações totais</p>
              <p className="text-white text-[26px] font-semibold mt-2">{formatValue(report.youtube.channel.views)}</p>
            </GlassCard>
            <GlassCard className="!p-5">
              <p className="text-text-dim text-[12px] uppercase tracking-wider">Vídeos</p>
              <p className="text-white text-[26px] font-semibold mt-2">{formatValue(report.youtube.channel.videos)}</p>
            </GlassCard>
          </div>
          {(report.youtube.videos?.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.youtube.videos!.slice(0, 6).map(v => (
                <a key={v.id} href={v.url} target="_blank" rel="noreferrer"
                  className="group glass rounded-2xl p-3 hover:bg-white/[0.07] transition-colors">
                  {v.thumbnail && (
                    <img src={v.thumbnail} alt={v.title} className="aspect-video w-full rounded-xl object-cover mb-3" />
                  )}
                  <p className="text-white text-[13px] font-medium line-clamp-2 mb-1">{v.title}</p>
                  <div className="flex gap-3 text-text-dim text-[11px]">
                    <span>{formatValue(v.views)} views</span>
                    <span>{formatValue(v.likes)} likes</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── BLOCO 8: PLAYLISTS ATUAIS ── */}
      {playlists.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-white">Playlists onde você está</h2>
              <p className="text-text-dim text-[13px] mt-1">Maior alcance no Spotify hoje</p>
            </div>
            <ListMusic className="h-5 w-5 text-text-dim" />
          </div>
          <GlassCard className="!p-0 overflow-hidden">
            <ul className="divide-y divide-white/[0.06]">
              {playlists.map((p, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.04] transition-colors">
                  <ListMusic className="h-4 w-4 text-text-dim shrink-0" />
                  <p className="flex-1 text-white text-[14px] font-medium truncate">
                    {p.name || p.playlist_name || "—"}
                  </p>
                  {p.followers != null && (
                    <p className="text-text-dim text-[12px] shrink-0">{formatValue(p.followers)} followers</p>
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>
      )}

      {/* ── BLOCO 9: ARTISTAS SIMILARES ── */}
      {related.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-white">Quem está no seu campo</h2>
              <p className="text-text-dim text-[13px] mt-1">Artistas similares de mercado</p>
            </div>
            <Users className="h-5 w-5 text-text-dim" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map(r => (
              <GlassCard key={r.name} className="!p-3">
                {r.image && (
                  <img src={r.image} alt={r.name} className="aspect-square w-full rounded-xl object-cover mb-2" />
                )}
                <p className="text-white text-[13px] font-medium line-clamp-1">{r.name}</p>
                {r.followers != null && (
                  <p className="text-text-dim text-[11px] mt-0.5">{formatValue(r.followers)}</p>
                )}
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* ── BLOCO 10: Pontos de tensão ── */}
      {(criticos.length > 0 || isLoading) && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-white">Pontos de tensão</h2>
              <p className="text-text-dim text-[13px] mt-1">Onde a energia está represada</p>
            </div>
          </div>
          <GlassCard className="p-0 overflow-hidden">
            {isLoading ? (
              <SkeletonList rows={3} />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {criticos.map((c, i) => {
                  const tone = statusToTone(c.status);
                  return (
                    <li key={i} className="flex items-center gap-4 px-6 py-5 hover:bg-white/[0.04] transition-colors cursor-pointer">
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
                      <Eye className="h-4 w-4 text-text-dim shrink-0" />
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>
        </section>
      )}

      {/* ── BLOCO 11: Métricas detalhadas Home (compat) ── */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-white">Métricas-âncora</h2>
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
                          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {formatDelta(m.delta)}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
        </div>
      </section>

      {/* ── BLOCO 12: Fotos Instagram ── */}
      <ArtistPhotos username="kyanmaloka" artistName="Kyan Maloka" />

      {/* ── BLOCO 13: Tarefas + Oportunidades ── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-white text-[22px] font-semibold">Tarefas</h2>
              </div>
              {tarefas.length > 0 && <Badge>{tarefas.length} abertas</Badge>}
            </div>
            {isLoading ? <SkeletonList rows={3} compact /> : (
              <ul className="space-y-4">
                {tarefas.map((t, i) => {
                  const high = t.priority === "high" || t.priority === "critica" || t.priority === "alta";
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border border-white/20 flex items-center justify-center shrink-0" />
                      <span className="flex-1 text-[15px] text-white">{t.title}</span>
                      {high && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium uppercase tracking-wide">
                          <Clock className="h-3 w-3" /> agora
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-white text-[22px] font-semibold">Oportunidades</h2>
              </div>
              <Badge>FERB vê</Badge>
            </div>
            {isLoading ? <SkeletonList rows={3} compact /> : (
              <ul className="space-y-5">
                {oports.map((o, i) => (
                  <li key={i} className="group cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-white text-[15px] font-medium group-hover:text-primary transition-colors">{o.title}</p>
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
