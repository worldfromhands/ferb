import { createFileRoute } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";
import { EmBreve } from "@/components/EmBreve";

export const Route = createFileRoute("/catalogo")({ component: Catalogo });

function Catalogo() {
  return (
    <EmBreve
      eyebrow="Catálogo / Criação"
      title="Seu catálogo e o que performa"
      description="A análise do seu repertório: quais faixas puxam audiência, que som funciona melhor e onde há espaço para o próximo lançamento."
      features={[
        "Discografia completa com performance por faixa e álbum",
        "Quais sons sustentam audiência e quais estão em queda",
        "Ideias de collab por sobreposição de público",
        "Tudo ancorado no seu catálogo real — nunca em achismo",
      ]}
      phase="Fase 2"
      icon={<Disc3 size={26} />}
    />
  );
}
