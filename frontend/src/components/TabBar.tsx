import { Link, useLocation } from "@tanstack/react-router";
import { MotionLogo } from "./MotionLogo";

const tabs = [
  { label: "Home",       to: "/",           ready: true  },
  { label: "Agência",    to: "/agencia",    ready: true  },
  { label: "Dados",      to: "/dados",      ready: true  },
  { label: "Tarefas",    to: "/tarefas",    ready: true  },
  { label: "Relações",   to: "/relacoes",   ready: true  },
  { label: "Crítico",    to: "/critico",    ready: false },
  { label: "Catálogo",   to: "/catalogo",   ready: false },
  { label: "Relatórios", to: "/relatorios", ready: false },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 tab-blur border-b border-white/8">
      <div className="flex items-center gap-6 px-8 h-16">
        <div className="flex items-center shrink-0">
          <MotionLogo size={46} autoPlay={true} interactive={true} noShadow />
        </div>
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
                      "relative inline-flex items-center gap-1.5 h-16 px-4 text-[14px] font-medium transition-colors",
                      active ? "text-white" : "text-text-dim hover:text-white",
                    ].join(" ")}
                  >
                    {t.label}
                    {!t.ready && (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-white/25"
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
