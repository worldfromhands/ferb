import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/relatorios")({ component: Relatorios });

function Relatorios() {
  return (
    <EmBreve
      eyebrow="Relatórios"
      title="O histórico do que o FERB já te disse"
      description="Cada manhã o FERB gera um relatório do dia. Aqui fica o arquivo: o que mudou, o que foi recomendado e como a carreira evoluiu ao longo do tempo."
      features={[
        "Relatório diário gerado automaticamente toda manhã",
        "Histórico navegável — comparar semanas e meses",
        "Evolução das métricas-âncora no tempo",
        "Exportar relatório para enviar à equipe",
      ]}
      phase="Fase 2"
      icon={<FileText size={26} />}
    />
  );
}
