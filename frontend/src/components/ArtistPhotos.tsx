import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ImageOff, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "./GlassCard";

type Photo = {
  image_url: string;
  caption?: string;
  permalink?: string;
  posted_at?: string;
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) return "Hoje";
  if (d === 1) return "Ontem";
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}sem`;
  return `${Math.floor(d / 30)}mes`;
}

export function ArtistPhotos({
  username,
  artistName,
}: {
  username: string;
  artistName?: string;
}) {
  const displayName = artistName ?? `@${username}`;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data, isLoading, error } = useQuery({
    queryKey: ["instagram", username],
    queryFn: async () => {
      const r = await fetch(`/api/instagram/recent?username=${encodeURIComponent(username)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as { photos: Photo[]; error?: string };
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: mounted,
  });

  const photos = data?.photos ?? [];
  const showLoading = !mounted || isLoading;

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-white">Fotos recentes</h2>
          <p className="text-text-dim text-[14px] mt-1">
            {displayName} — Instagram
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>via Firecrawl</Badge>
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-text-dim hover:text-primary transition-colors"
          >
            Ver perfil <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="-mx-8">
        <div className="flex gap-5 overflow-x-auto scrollbar-none px-8 pb-2 snap-x snap-mandatory">
          {showLoading && <SkeletonRow />}
          {!showLoading && error && <ErrorState />}
          {!showLoading && !error && photos.length === 0 && <EmptyState />}
          {!showLoading &&
            photos.map((p, i) => (
              <a
                key={p.permalink ?? i}
                href={p.permalink ?? `https://instagram.com/${username}`}
                target="_blank"
                rel="noreferrer"
                className="snap-start shrink-0 w-[240px] group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden glass">
                  <img
                    src={p.image_url}
                    alt={p.caption || "Instagram post"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {p.posted_at && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                        {timeAgo(p.posted_at)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-white text-[14px] font-medium leading-tight line-clamp-2">
                  {p.caption || "Sem legenda"}
                </p>
                <p className="text-text-dim text-[12px] mt-0.5">{displayName}</p>
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}

function SkeletonRow() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="snap-start shrink-0 w-[240px]">
          <div className="aspect-[4/5] rounded-[20px] glass flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-text-dim animate-spin" />
          </div>
          <div className="h-3 mt-3 w-3/4 rounded bg-white/10" />
          <div className="h-2.5 mt-2 w-1/3 rounded bg-white/5" />
        </div>
      ))}
    </>
  );
}

function ErrorState() {
  return (
    <div className="glass rounded-[20px] p-8 flex items-center gap-4 w-full">
      <AlertCircle className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="text-white text-[14px] font-medium">Não consegui carregar o Instagram</p>
        <p className="text-text-dim text-[13px] mt-0.5">
          O Instagram pode ter bloqueado a leitura. Tente novamente em alguns minutos.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-[20px] p-8 flex items-center gap-4 w-full">
      <ImageOff className="h-5 w-5 text-text-dim shrink-0" />
      <p className="text-text-dim text-[14px]">Nenhuma foto encontrada.</p>
    </div>
  );
}
