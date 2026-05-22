import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Music2, Users, Heart, Video, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

// ── Types ────────────────────────────────────────────
interface TikTokStatus {
  configured: boolean;
  connected: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  redirectUri?: string;
}
interface TikTokVideo {
  id: string; title: string;
  views?: number; likes?: number; comments?: number; shares?: number;
  cover?: string; url?: string; createdAt?: string | null;
}
interface TikTokUser {
  display_name?: string; avatar_url?: string;
  follower_count?: number; following_count?: number;
  likes_count?: number; video_count?: number;
}
interface TikTokSnapshot {
  configured: boolean; connected: boolean;
  user?: TikTokUser; videos?: TikTokVideo[]; error?: string;
}

function fmt(v?: number | null) {
  if (v == null) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(1).replace(".", ",") + "k";
  return v.toLocaleString("pt-BR");
}

export function TikTokPanel() {
  const qc = useQueryClient();
  const [callbackMsg, setCallbackMsg] = useState<"ok" | "erro" | null>(null);

  // Detecta retorno do callback OAuth (?tiktok=ok|erro)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tiktok");
    if (t === "ok" || t === "erro") {
      setCallbackMsg(t);
      qc.invalidateQueries({ queryKey: ["tiktok-status"] });
      qc.invalidateQueries({ queryKey: ["tiktok-snapshot"] });
      // limpa a query string da URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [qc]);

  const { data: status, isLoading: loadingStatus } = useQuery<TikTokStatus>({
    queryKey: ["tiktok-status"],
    queryFn: async () => {
      const r = await fetch("/api/tiktok/status");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const connected = Boolean(status?.connected);

  const { data: snap, isLoading: loadingSnap } = useQuery<TikTokSnapshot>({
    queryKey: ["tiktok-snapshot"],
    queryFn: async () => {
      const r = await fetch("/api/tiktok/snapshot");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    enabled: connected,
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/tiktok/disconnect", { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tiktok-status"] });
      qc.invalidateQueries({ queryKey: ["tiktok-snapshot"] });
    },
  });

  // App nem configurado — não mostra nada
  if (!loadingStatus && status && !status.configured) return null;

  const user   = snap?.user;
  const videos = snap?.videos ?? [];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Music2 size={18} className="text-primary" />
        <h2 className="text-white text-[17px] font-semibold">TikTok</h2>
      </div>

      {/* Mensagem do callback */}
      {callbackMsg === "ok" && (
        <div className="mb-3 flex items-center gap-2 text-primary text-[14px]">
          <CheckCircle2 size={16} /> Conta do TikTok conectada com sucesso.
        </div>
      )}
      {callbackMsg === "erro" && (
        <div className="mb-3 flex items-center gap-2 text-white/55 text-[14px]">
          <AlertCircle size={16} /> Não foi possível conectar o TikTok. Tente novamente.
        </div>
      )}

      {loadingStatus ? (
        <GlassCard className="flex items-center gap-2 text-text-dim text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Verificando TikTok…
        </GlassCard>
      ) : !connected ? (
        // ─── NÃO CONECTADO ───
        (status?.redirectUri || "").includes("localhost") ? (
          // localhost: TikTok exige HTTPS público — conexão fica pro deploy
          <GlassCard className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-[15px] font-medium">Conexão do TikTok disponível após o deploy</p>
              <p className="text-text-dim text-[14px] mt-1">
                O TikTok só aceita um endereço HTTPS público para o login. A integração já está pronta —
                assim que o FERB for publicado, o botão "Conectar TikTok" funciona.
              </p>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white text-[15px] font-medium">Conecte a conta do TikTok do KYAN</p>
              <p className="text-text-dim text-[14px] mt-1">
                O TikTok exige login do artista para liberar seguidores, curtidas e métricas de vídeo.
              </p>
            </div>
            <a
              href="/api/tiktok/auth"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              <Music2 size={16} /> Conectar TikTok
            </a>
          </GlassCard>
        )
      ) : (
        // ─── CONECTADO ───
        <>
          {loadingSnap ? (
            <GlassCard className="flex items-center gap-2 text-text-dim text-sm py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Carregando dados do TikTok…
            </GlassCard>
          ) : snap?.error ? (
            <GlassCard className="flex items-start gap-3">
              <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white text-[15px]">{snap.error}</p>
                <a href="/api/tiktok/auth" className="text-primary text-[14px] hover:underline mt-1 inline-block">
                  Reconectar TikTok
                </a>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Perfil + métricas */}
              <GlassCard className="mb-3">
                <div className="flex items-center gap-4 mb-5">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-white/8 flex items-center justify-center">
                      <Music2 size={20} className="text-text-dim" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[15px] font-medium">
                      {user?.display_name || status?.displayName || "Conta TikTok"}
                    </p>
                    <p className="text-text-dim text-[13px]">Conectado</p>
                  </div>
                  <button
                    onClick={() => disconnect.mutate()}
                    disabled={disconnect.isPending}
                    className="text-text-dim/60 hover:text-white text-[13px] transition-colors shrink-0"
                  >
                    {disconnect.isPending ? "…" : "Desconectar"}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Users size={15} />,  label: "Seguidores", value: user?.follower_count },
                    { icon: <Heart size={15} />,  label: "Curtidas",   value: user?.likes_count },
                    { icon: <Video size={15} />,  label: "Vídeos",     value: user?.video_count },
                  ].map((m, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-text-dim text-[12px] mb-1">
                        {m.icon}{m.label}
                      </div>
                      <p className="text-white text-xl font-semibold">{fmt(m.value)}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Vídeos recentes */}
              {videos.length > 0 && (
                <GlassCard>
                  <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-4">Vídeos recentes</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {videos.slice(0, 8).map(v => (
                      <a
                        key={v.id}
                        href={v.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="group block"
                      >
                        <div className="aspect-[9/16] rounded-xl overflow-hidden bg-white/5 relative">
                          {v.cover ? (
                            <img src={v.cover} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Video size={20} className="text-text-dim" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <ExternalLink size={14} className="text-white" />
                          </div>
                        </div>
                        <p className="text-text-dim text-[12px] mt-1.5">
                          {fmt(v.views)} views · {fmt(v.likes)} ❤
                        </p>
                      </a>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
