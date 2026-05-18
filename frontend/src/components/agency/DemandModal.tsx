import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  avatar: string;
}

interface DemandModalProps {
  agent: Agent;
  onSubmit: (data: { title: string; description: string; priority: string; dueDate: string }) => void;
  onClose: () => void;
  loading: boolean;
}

export function DemandModal({ agent, onSubmit, onClose, loading }: DemandModalProps) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [priority,    setPriority]    = useState("medium");
  const [dueDate,     setDueDate]     = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit({ title, description, priority, dueDate });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 28 }}>{agent.avatar}</span>
            <div>
              <p className="text-white font-semibold text-[16px]">Demanda para {agent.name}</p>
              <p className="text-text-dim text-[13px]">O que você precisa que ele faça?</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className="demand-form">
          <div className="field">
            <label>Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Criar campanha para o novo single"
              className="ferb-input"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="field">
            <label>Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhe o que você quer, referências, contexto..."
              className="ferb-input"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Prioridade</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="ferb-input"
                disabled={loading}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="field">
              <label>Prazo (opcional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="ferb-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost-sm" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading || !title.trim() || !description.trim()}>
              {loading ? "Enviando..." : "Dar demanda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
