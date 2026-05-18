import { Link, useLocation } from "@tanstack/react-router";
import { MotionLogo } from "./MotionLogo";

const tabs = [
  { label: "Home",      to: "/" },
  { label: "Agência",   to: "/agencia" },
  { label: "Crítico",   to: "/critico" },
  { label: "Dados",     to: "/dados" },
  { label: "Tarefas",   to: "/tarefas" },
  { label: "Catálogo",  to: "/catalogo" },
  { label: "Relatórios",to: "/relatorios" },
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
                    className={[
                      "relative inline-flex items-center h-16 px-4 text-[14px] font-medium transition-colors",
                      active ? "text-white" : "text-text-dim hover:text-white",
                    ].join(" ")}
                  >
                    {t.label}
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
