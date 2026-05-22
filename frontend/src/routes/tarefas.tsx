import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/tarefas")({ component: Tarefas });

function Tarefas() {
  return (
    <EmBreve
      eyebrow="Tarefas / Execução"
      title="Suas tarefas e prazos"
      description="A visão gerenciável do que precisa ser feito. A Home mostra o resumo; aqui você cria, edita, prioriza e conclui tudo."
      features={[
        "Criar, editar e concluir tarefas com prioridade e prazo",
        "Filtros por status e prioridade",
        "Distinção entre tarefas suas e tarefas sugeridas pelo FERB",
        "Tarefas ignoradas viram alerta no Crítico",
      ]}
      phase="Fase 1"
      backendReady
      icon={<CheckSquare size={26} />}
    />
  );
}
