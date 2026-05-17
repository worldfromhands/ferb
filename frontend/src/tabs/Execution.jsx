import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Loading, ErrorState, EmptyState } from '../components/States';

const ARTIST_ID = 'kyan';

const PRIORITY_COLOR = {
  high:   'var(--red)',
  medium: 'var(--accent)',
  low:    'var(--text-dim)',
};

function TaskItem({ task, onToggle }) {
  const done = task.status === 'done';
  return (
    <div style={{
      padding: 'var(--sp-3) var(--sp-4)',
      display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
      opacity: done ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      <button
        onClick={() => onToggle(task)}
        style={{
          width: 18, height: 18, borderRadius: 4,
          border: `1.5px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
          background: done ? 'var(--accent)' : 'transparent',
          cursor: 'pointer', flexShrink: 0, marginTop: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.7rem',
        }}
      >
        {done ? '✓' : ''}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, textDecoration: done ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-1)', flexWrap: 'wrap' }}>
          {task.priority && (
            <span style={{ fontSize: '0.7rem', color: PRIORITY_COLOR[task.priority] || 'var(--text-dim)', fontWeight: 600 }}>
              {task.priority.toUpperCase()}
            </span>
          )}
          {task.ferb && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>
              FERB
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Execution() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await api.get(`/api/execution/${ARTIST_ID}`);
    if (e) setError(e);
    else setTasks(data?.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    const { error: e } = await api.patch(`/api/execution/${ARTIST_ID}/tasks/${task.id}`, { status: newStatus });
    if (e) {
      // Revert
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const { data, error: e } = await api.post(`/api/execution/${ARTIST_ID}/tasks`, { title });
    if (!e && data) {
      setTasks(prev => [data, ...prev]);
      setNewTitle('');
    }
    setAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTask();
  };

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const pending = tasks.filter(t => t.status !== 'done');
  const done    = tasks.filter(t => t.status === 'done');

  return (
    <div>
      <div className="tab-header">
        <h1>Execução</h1>
        <button className="btn-secondary" onClick={load}>↻ Atualizar</button>
      </div>

      {/* Add task */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
        <input
          className="input"
          type="text"
          placeholder="Nova tarefa..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={addTask} disabled={adding || !newTitle.trim()}>
          {adding ? '...' : '+ Adicionar'}
        </button>
      </div>

      {/* Pending tasks */}
      <section>
        <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
          Pendentes ({pending.length})
        </h2>
        {pending.length === 0
          ? <EmptyState message="Nenhuma tarefa pendente. 🎉" />
          : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {pending.map((t, i) => (
                <div key={t.id ?? i} style={{ borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <TaskItem task={t} onToggle={toggle} />
                </div>
              ))}
            </div>
          )
        }
      </section>

      {/* Done tasks */}
      {done.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            Concluídas ({done.length})
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {done.map((t, i) => (
              <div key={t.id ?? i} style={{ borderBottom: i < done.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <TaskItem task={t} onToggle={toggle} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
