import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AgentCard } from "@/components/agency/AgentCard";
import { AgentRoom } from "@/components/agency/AgentRoom";
import { Concilio } from "@/components/agency/Concilio";
import "@/styles/agency.css";

export const Route = createFileRoute("/agencia")({
  component: Agency,
});

interface Agent {
  id: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  avatar: string;
  color: string;
  room: string;
  mood: string;
  activeDemand?: { title: string } | null;
  demands?: unknown[];
}

function Agency() {
  const [agents,       setAgents]       = useState<Agent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showConcilio,  setShowConcilio]  = useState(false);

  async function loadLobby() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/mvp/lobby/kyan");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgents(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar agência");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLobby();
    // Atualiza moods a cada 3s
    const iv = setInterval(loadLobby, 3000);
    return () => clearInterval(iv);
  }, []);

  if (showConcilio) {
    return <Concilio onBack={() => setShowConcilio(false)} />;
  }

  if (selectedAgent) {
    return (
      <Shell>
        <AgentRoom
          initialAgent={selectedAgent as Parameters<typeof AgentRoom>[0]['initialAgent']}
          onBack={() => {
            setSelectedAgent(null);
            loadLobby();
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Agência Virtual</p>
          <h1 className="text-white">Sua equipe está aqui.</h1>
          <p className="text-text-dim text-[15px] mt-2">
            Entre na sala de cada agente, dê demandas e receba respostas.
          </p>
        </div>
        <button
          onClick={() => setShowConcilio(true)}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Users size={16} /> Reunir o Concílio
        </button>
      </section>

      {loading && agents.length === 0 ? (
        <div className="agents-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="agent-card-skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-white mb-4">Não consegui conectar com a agência.</p>
          <button
            className="btn-primary-sm"
            onClick={loadLobby}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      )}
    </Shell>
  );
}
