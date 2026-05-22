import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/critico")({ component: Critico });

function Critico() {
  return (
    <EmBreve
      eyebrow="Crítico"
      title="O que precisa da sua atenção hoje"
      description="A central de alertas do FERB. Tudo que saiu do esperado — quedas, riscos e prazos curtos — reunido num lugar só, antes de virar problema."
      features={[
        "Pontos de tensão: métricas que caíram além do seu normal",
        "Alertas de prazo: tarefas e oportunidades vencendo",
        "Quedas regionais: cidades perdendo ouvintes",
        "Cada alerta com o dado que o gerou e uma ação sugerida",
      ]}
      phase="Fase 2"
      icon={<AlertTriangle size={26} />}
    />
  );
}
