import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/dados")({ component: Dados });

function Dados() {
  return (
    <EmBreve
      eyebrow="Dados / Audiência"
      title="Quem te ouve e onde"
      description="A visão completa da sua audiência: streams, ouvintes mensais, crescimento por cidade e país, demografia e evolução em 30/90 dias."
      features={[
        "Gráfico de crescimento — streams e ouvintes ao longo do tempo",
        "Mapa do Brasil interativo — audiência por estado",
        "Top cidades e países com comparativo período a período",
        "Cada número com baseline: acima ou abaixo do seu normal",
      ]}
      phase="Fase 1"
      backendReady
      icon={<BarChart3 size={26} />}
    />
  );
}
