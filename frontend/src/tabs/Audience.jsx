import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Loading, ErrorState, EmptyState } from '../components/States';

const ARTIST_ID = 'kyan';

const STATUS_MAP = {
  acima:            { label: 'Acima',    color: 'var(--green)' },
  abaixo:           { label: 'Abaixo',   color: 'var(--red)'   },
  dentro_do_normal: { label: 'Normal',   color: 'var(--text-dim)' },
  aprendendo:       { label: 'Novo',     color: 'var(--accent)'   },
};

function MetricCard({ metric }) {
  const st = STATUS_MAP[metric.status] || { label: metric.status, color: 'var(--text-dim)' };
  const deltaColor = metric.delta > 0 ? 'var(--green)' : metric.delta < 0 ? 'var(--red)' : 'var(--text-dim)';

  return (
    <div className="card metric-card">
      <p className="metric-label">{metric.label}</p>
      <p className="metric-value">
        {typeof metric.value === 'number' ? metric.value.toLocaleString('pt-BR') : metric.value ?? '—'}
      </p>
      {metric.delta != null && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: deltaColor }}>
          {metric.delta > 0 ? '▲' : '▼'} {Math.abs(metric.delta).toLocaleString('pt-BR')}
        </p>
      )}
      <p style={{ margin: 'var(--sp-2) 0 0', fontSize: '0.75rem', color: st.color, fontWeight: 600 }}>
        {st.label}
      </p>
      {metric.baseline != null && (
        <p style={{ margin: 'var(--sp-1) 0 0', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          Base: {metric.baseline.toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}

export default function Audience() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data: d, error: e } = await api.get(`/api/audience/${ARTIST_ID}`);
    if (e) setError(e);
    else setData(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={load} />;
  if (!data)   return <EmptyState message="Nenhum dado de audiência." onAction={load} actionLabel="Carregar" />;

  const { metrics = [], updatedAt } = data;

  const groups = metrics.reduce((acc, m) => {
    const g = m.group || 'Geral';
    if (!acc[g]) acc[g] = [];
    acc[g].push(m);
    return acc;
  }, {});

  return (
    <div>
      <div className="tab-header">
        <div>
          <h1>Audiência</h1>
          {updatedAt && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Atualizado em {new Date(updatedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <button className="btn-secondary" onClick={load}>↻ Atualizar</button>
      </div>

      {Object.entries(groups).map(([group, items]) => (
        <section key={group}>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            {group}
          </h2>
          <div className="metrics-grid">
            {items.map((m, i) => <MetricCard key={i} metric={m} />)}
          </div>
        </section>
      ))}

      {metrics.length === 0 && (
        <EmptyState message="Métricas ainda não disponíveis." onAction={load} actionLabel="Tentar novamente" />
      )}
    </div>
  );
}
