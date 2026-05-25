// EHXIS Trophy Room — dataset
// Números reais validados nesta sessão (Chartmetric, Spotify, YouTube, Last.fm,
// Deezer, Spotify for Artists). Snapshot manual de 22/05/2026.

export type TrophyCategory =
  | "artista"
  | "album"
  | "marco"
  | "projeto"
  | "dataset"
  | "placeholder";

export type Trophy = {
  slug: string;
  number: string;              // exibido como "01", "02"...
  title: string;
  category: TrophyCategory;
  categoryLabel: string;
  period: string;
  metric: string;              // número principal grande
  sub?: string;                // número secundário
  hover: string;               // descrição curta
  body?: string;               // descrição longa (rota de detalhe)
  link?: { label: string; href: string };
  accent: string;              // hex
  span: { col: 1 | 2 | 3; row: 1 | 2 };
  placeholder?: boolean;
};

export const TROPHIES: Trophy[] = [
  {
    slug: "kyan",
    number: "01",
    title: "KYAN",
    category: "artista",
    categoryLabel: "Artista flagship",
    period: "2021 — presente",
    metric: "3,2M",
    sub: "ouvintes mensais",
    hover: "Do quebrada inteligente ao mainstream — o carro-chefe da casa.",
    body:
      "Carro-chefe da EHXIS. Saga Quebrada Inteligente, presença consolidada no Brasil e Portugal, ponte entre o rap de rua e o pop urbano contemporâneo.",
    link: { label: "Spotify", href: "https://open.spotify.com/artist/05qCf6M7E7AxizHVmrcPqh" },
    accent: "#d4af37",
    span: { col: 2, row: 2 },
  },
  {
    slug: "dois-qi-pro-max",
    number: "02",
    title: "DOIS — Quebrada Inteligente Pro Max",
    category: "album",
    categoryLabel: "Álbum",
    period: "dez / 2025",
    metric: "89M",
    sub: "streams · 13 faixas",
    hover: "+332% no streaming — o capítulo mais explosivo da saga.",
    body:
      "Lançamento mais recente do KYAN pela EHXIS. Segundo volume da saga, 89 milhões de streams acumulados e crescimento de 332% vs. o período anterior. Pico de 132 mil streams num único dia.",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
  },
  {
    slug: "youtube-271m",
    number: "03",
    title: "271M views",
    category: "marco",
    categoryLabel: "Marco · YouTube",
    period: "acumulado",
    metric: "271M",
    sub: "726k inscritos",
    hover: "O alcance audiovisual da casa em um número.",
    body:
      "Total acumulado do canal do KYAN no YouTube — 271 milhões de views, 726 mil inscritos, 136 vídeos. A profundidade audiovisual da casa.",
    link: { label: "YouTube", href: "https://youtube.com/channel/UCyMaz2H2tHcc6avYIWqk2Sg" },
    accent: "#d4af37",
    span: { col: 1, row: 1 },
  },
  {
    slug: "lastfm-streaming",
    number: "04",
    title: "18,9M plays",
    category: "marco",
    categoryLabel: "Marco · Last.fm",
    period: "acumulado",
    metric: "18,9M",
    sub: "261k ouvintes",
    hover: "Presença consolidada em todas as plataformas.",
    body:
      "Plays consolidados no Last.fm. Sinal forte de retenção e escuta recorrente — não impressão de algoritmo, é gente que volta.",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
  },
  {
    slug: "ferb",
    number: "05",
    title: "FERB",
    category: "projeto",
    categoryLabel: "Projeto · IA",
    period: "2026",
    metric: "10",
    sub: "agentes de IA",
    hover: "A agência virtual que lê os dados e direciona a carreira todo dia.",
    body:
      "Sistema interno da EHXIS. Dez agentes especializados — Gerente, A&R, Produtor, Marketer, Advogado, Financeiro, Booking, Estilista, Tech Hacker e Social Media — que monitoram performance, conteúdo, agenda e estratégia em tempo real.",
    accent: "#d4af37",
    span: { col: 2, row: 1 },
  },
  {
    slug: "discografia",
    number: "06",
    title: "Discografia",
    category: "dataset",
    categoryLabel: "Dataset",
    period: "2021 — hoje",
    metric: "90",
    sub: "lançamentos",
    hover: "O catálogo inteiro da casa, de 2021 até hoje.",
    body:
      "Catálogo completo do KYAN pela EHXIS — singles, EPs e álbuns desde 2021. Quatro álbuns, um EP, dezenas de singles. Música #1 acumulada: brinks! (34,8M streams).",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
  },
  {
    slug: "casting",
    number: "07",
    title: "Casting",
    category: "placeholder",
    categoryLabel: "Casting",
    period: "—",
    metric: "—",
    sub: "artistas em breve",
    hover: "Roster completo da label — em curadoria.",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
    placeholder: true,
  },
  {
    slug: "shows",
    number: "08",
    title: "Shows & Turnês",
    category: "placeholder",
    categoryLabel: "Live",
    period: "—",
    metric: "—",
    sub: "datas em breve",
    hover: "Histórico e próximas datas — em curadoria.",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
    placeholder: true,
  },
  {
    slug: "parcerias",
    number: "09",
    title: "Parcerias",
    category: "placeholder",
    categoryLabel: "Brand",
    period: "—",
    metric: "—",
    sub: "marcas em breve",
    hover: "Co-criações com marcas — em curadoria.",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
    placeholder: true,
  },
  {
    slug: "premios",
    number: "10",
    title: "Prêmios",
    category: "placeholder",
    categoryLabel: "Awards",
    period: "—",
    metric: "—",
    sub: "reconhecimentos em breve",
    hover: "Indicações e prêmios — em curadoria.",
    accent: "#1a1a1a",
    span: { col: 1, row: 1 },
    placeholder: true,
  },
];

export function getTrophy(slug: string): Trophy | undefined {
  return TROPHIES.find((t) => t.slug === slug);
}
