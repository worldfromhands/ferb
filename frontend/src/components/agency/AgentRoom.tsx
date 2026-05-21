import { useState, useEffect, useCallback } from "react";
import { DemandModal } from "./DemandModal";

interface Demand {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: "in_progress" | "completed" | "pending";
  result: string | null;
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
}

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
  demands?: Demand[];
}

const MOOD_LABELS: Record<string, string> = {
  idle:     'Disponível',
  thinking: 'Pensando...',
  working:  'Trabalhando',
  happy:    'Satisfeito',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     '⏳ Pendente',
  in_progress: '⚙ Em andamento',
  completed:   '✓ Concluído',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface Briefing {
  summary: string;
  suggestion: string | null;
}

export function AgentRoom({
  initialAgent,
  onBack,
}: {
  initialAgent: Agent;
  onBack: () => void;
}) {
  const [agent,     setAgent]     = useState<Agent>(initialAgent);
  const [demands,   setDemands]   = useState<Demand[]>(initialAgent.demands ?? []);
  const [briefing,  setBriefing]  = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [response,  setResponse]  = useState<string | null>(null);

  // Buscar briefing ao entrar
  useEffect(() => {
    let alive = true;
    setBriefingLoading(true);
    fetch(`/api/mvp/briefing/${initialAgent.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) { setBriefing(d); setBriefingLoading(false); } })
      .catch(() => { if (alive) setBriefingLoading(false); });
    return () => { alive = false; };
  }, [initialAgent.id]);

  async function refreshBriefing() {
    setBriefingLoading(true);
    try {
      await fetch(`/api/mvp/briefing/${initialAgent.id}/refresh`, { method: 'POST' });
      const r = await fetch(`/api/mvp/briefing/${initialAgent.id}`);
      if (r.ok) setBriefing(await r.json());
    } finally {
      setBriefingLoading(false);
    }
  }

  const refresh = useCallback(async () => {
    try {
      const [roomRes, demandsRes] = await Promise.all([
        fetch(`/api/mvp/room/${initialAgent.id}`),
        fetch(`/api/mvp/demands/${initialAgent.id}`),
      ]);
      if (roomRes.ok)    setAgent(await roomRes.json());
      if (demandsRes.ok) setDemands(await demandsRes.json());
    } catch {
      // silencioso
    }
  }, [initialAgent.id]);

  // Poll a cada 2s para pegar quando a demanda completa
  useEffect(() => {
    const iv = setInterval(refresh, 2000);
    return () => clearInterval(iv);
  }, [refresh]);

  async function handleCreateDemand(data: {
    title: string; description: string; priority: string; dueDate: string;
  }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mvp/demand/${agent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao criar demanda');
      const json = await res.json();
      setResponse(json.agentResponse);
      setShowModal(false);
      refresh();
    } catch (e: unknown) {
      alert('Erro: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  const moodColor = agent.mood === 'happy' ? '#10b981'
    : agent.mood === 'thinking' ? '#f59e0b'
    : agent.mood === 'working'  ? '#fa243c'
    : '#666';

  return (
    <div className="agent-room">
      {/* Header */}
      <div className="room-header">
        <button className="back-btn" onClick={onBack}>← Voltar</button>
        <div className="room-agent-info">
          <span className="room-avatar">{agent.avatar}</span>
          <div>
            <p className="room-name">{agent.name}</p>
            <p className="room-title">{agent.title}</p>
            <span className="room-mood" style={{ color: moodColor }}>
              {MOOD_LABELS[agent.mood] ?? 'Disponível'}
            </span>
          </div>
        </div>
        <div className="room-location">📍 {agent.room}</div>
      </div>

      {/* Bio */}
      <div className="room-bio glass-panel">
        <p className="text-white text-[15px] font-medium mb-1">{agent.specialty}</p>
        <p className="text-text-dim text-[14px] leading-relaxed">{agent.bio}</p>
      </div>

      {/* Briefing — leitura + sugestão proativa */}
      <div className="briefing-panel" style={{ borderLeftColor: agent.color }}>
        <div className="briefing-header">
          <span className="briefing-eyebrow">O que {agent.name} está vendo</span>
          <button
            type="button"
            className="briefing-refresh"
            onClick={refreshBriefing}
            disabled={briefingLoading}
            title="Gerar nova leitura"
          >
            ↻
          </button>
        </div>
        {briefingLoading ? (
          <div className="briefing-skeleton">
            <div className="briefing-skel-line" />
            <div className="briefing-skel-line" style={{ width: '85%' }} />
            <div className="briefing-skel-line" style={{ width: '70%' }} />
          </div>
        ) : briefing ? (
          <>
            <p className="briefing-summary">{briefing.summary}</p>
            {briefing.suggestion && (
              <div className="briefing-suggestion">
                <span className="briefing-suggestion-label">Sugestão pra essa semana</span>
                <p>{briefing.suggestion}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-text-dim text-[14px]">Sem leitura disponível agora.</p>
        )}
      </div>

      {/* Resposta do agente (após nova demanda) */}
      {response && (
        <div className="agent-response glass-panel" style={{ borderLeftColor: agent.color }}>
          <p className="text-[12px] text-text-dim uppercase tracking-wider mb-2">
            {agent.name} respondeu
          </p>
          <p className="text-white text-[15px] leading-relaxed">{response}</p>
          <button
            className="text-[12px] text-text-dim mt-3 hover:text-white transition-colors"
            onClick={() => setResponse(null)}
          >
            fechar ✕
          </button>
        </div>
      )}

      {/* Demandas */}
      <div className="demands-area">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-[18px] font-semibold">
            Demandas <span className="text-text-dim font-normal text-[14px]">({demands.length})</span>
          </h3>
          <button
            className="btn-primary-sm"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            + Nova demanda
          </button>
        </div>

        {demands.length === 0 ? (
          <p className="text-text-dim text-[14px] text-center py-8">
            Nenhuma demanda ainda. Dê a primeira!
          </p>
        ) : (
          <div className="demands-list">
            {demands.map(d => (
              <div key={d.id} className={`demand-card demand-${d.status}`}>
                <div className="demand-card-header">
                  <p className="demand-title">{d.title}</p>
                  <span className={`demand-status-badge demand-status-${d.status}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>
                <p className="demand-desc">{d.description}</p>

                {d.status === 'completed' && d.result && (
                  <div className="demand-result">
                    <p className="text-[12px] text-text-dim uppercase tracking-wider mb-1">Resultado</p>
                    <p className="text-white text-[14px] leading-relaxed">{d.result}</p>
                  </div>
                )}

                <div className="demand-meta">
                  <span>Prioridade: {d.priority}</span>
                  {d.dueDate && <span>Prazo: {formatDate(d.dueDate)}</span>}
                  <span>{formatDate(d.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <DemandModal
          agent={agent}
          onSubmit={handleCreateDemand}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
