import { Link, useLocation } from "@tanstack/react-router";

const tabs = [
  { label: "Home",       to: "/",           ready: true  },
  { label: "Agência",    to: "/agencia",    ready: true  },
  { label: "Dados",      to: "/dados",      ready: true  },
  { label: "Tarefas",    to: "/tarefas",    ready: true  },
  { label: "Relações",   to: "/relacoes",   ready: true  },
  { label: "Relatórios", to: "/relatorios", ready: true  },
  { label: "Crítico",    to: "/critico",    ready: false },
  { label: "Catálogo",   to: "/catalogo",   ready: false },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 tab-blur border-b border-white/8">
      <div className="flex items-center gap-7 px-8 h-16">
        {/* Marca EHXIS — sempre texto, glow dourado */}
        <Link to="/" className="shrink-0 ehxis-mark text-[20px] leading-none">
          EHXIS
        </Link>

        <nav className="flex-1 overflow-x-auto scrollbar-none">
          <ul className="flex items-center gap-1 min-w-max">
            {tabs.map((t) => {
              const active = pathname === t.to;
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    title={t.ready ? undefined : "Em breve"}
                    className={[
                      "relative inline-flex items-center gap-1.5 h-16 px-3.5",
                      "font-mono uppercase tracking-[0.18em] text-[10px] transition-colors",
                      active ? "text-primary" : "text-text-dim hover:text-white",
                    ].join(" ")}
                  >
                    {t.label}
                    {!t.ready && (
                      <span
                        aria-hidden
                        className="h-1 w-1 rounded-full bg-white/25"
                        title="Em breve"
                      />
                    )}
                    {active && (
                      <span className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
