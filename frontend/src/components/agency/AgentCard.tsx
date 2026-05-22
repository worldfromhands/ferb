interface Agent {
  id: string;
  name: string;
  title: string;
  specialty: string;
  avatar: string;
  color: string;
  mood: string;
  activeDemand?: { title: string } | null;
}

const MOOD_LABELS: Record<string, string> = {
  idle:     '● Disponível',
  thinking: '◌ Pensando',
  working:  '◎ Trabalhando',
  happy:    '● Satisfeito',
};

const MOOD_COLORS: Record<string, string> = {
  idle:     'rgba(255,255,255,0.45)',
  thinking: '#8a6d1f',
  working:  '#d4af37',
  happy:    '#d4af37',
};

export function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="agent-card"
      style={{ '--agent-color': agent.color } as React.CSSProperties}
    >
      <div className="agent-avatar">{agent.avatar}</div>

      <div className="agent-meta">
        <p className="agent-name">{agent.name}</p>
        <p className="agent-title">{agent.title}</p>
      </div>

      <div
        className="agent-mood"
        style={{ color: MOOD_COLORS[agent.mood] ?? '#888' }}
      >
        {MOOD_LABELS[agent.mood] ?? '● Disponível'}
      </div>

      {agent.activeDemand && (
        <p className="agent-active-demand">⚙ {agent.activeDemand.title}</p>
      )}

      <span className="agent-enter">Entrar →</span>
    </button>
  );
}
