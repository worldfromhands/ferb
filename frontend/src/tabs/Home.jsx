import { useHomeReport } from '../hooks/useHomeReport';
import { Loading, ErrorState, EmptyState } from '../components/States';
import '../styles/home.css';

const ARTIST_ID = 'kyan';

function StatusBadge({ status }) {
  const map = {
    critical:  { label: 'Crítico',  cls: 'badge-critical' },
    warning:   { label: 'Atenção',  cls: 'badge-warning'  },
    good:      { label: 'Bom',      cls: 'badge-good'     },
    excellent: { label: 'Ótimo',    cls: 'badge-good'     },
  };
  const s = map[status] || { label: status, cls: '' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function Delta({ value }) {
  if (value == null) return null;
  const up = value > 0;
  const color = up ? 'var(--green)' : 'var(--red)';
  return (
    <span style={{ color, fontVariantNumeric: 'tabular-nums', fontSize: '0.85em' }}>
      {up ? '▲' : '▼'} {Math.abs(value).toLocaleString('pt-BR')}
    </span>
  );
}

export default function Home() {
  const { report, loading, error, refresh } = useHomeReport(ARTIST_ID);

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={refresh} />;
  if (!report) return <EmptyState message="Nenhum relatório disponível." onAction={refresh} actionLabel="Gerar relatório" />;

  const {
    summary,
    overallStatus,
    criticalItems  = [],
    metricChanges  = [],
    pendingTasks   = [],
    opportunities  = [],
    generatedAt,
  } = report;

  return (
    <div>
      <div className="tab-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <h1>Home</h1>
          {overallStatus && <StatusBadge status={overallStatus} />}
        </div>
        <button className="btn-secondary" onClick={refresh}>↻ Atualizar</button>
      </div>

      {/* FERB Summary */}
      {summary && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            FERB acha que
          </p>
          <p style={{ lineHeight: 1.6 }}>{summary}</p>
          {generatedAt && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 'var(--sp-3)' }}>
              Gerado em {new Date(generatedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {/* Critical items */}
      {criticalItems.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            Itens críticos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {criticalItems.map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                <p style={{ margin: 0 }}>{item.message}</p>
                {item.status && <StatusBadge status={item.status} />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metric changes */}
      {metricChanges.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            Mudanças de métricas
          </h2>
          <div className="metrics-grid">
            {metricChanges.map((m, i) => (
              <div key={i} className="card metric-card">
                <p className="metric-label">{m.label}</p>
                <p className="metric-value">{(m.current ?? 0).toLocaleString('pt-BR')}</p>
                <Delta value={m.delta} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            Tarefas pendentes
          </h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {pendingTasks.map((t, i) => (
              <div key={i} style={{
                padding: 'var(--sp-3) var(--sp-4)',
                borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)'
              }}>
                <span style={{ color: 'var(--text-dim)' }}>○</span>
                <span style={{ flex: 1 }}>{t.title}</span>
                {t.priority && <StatusBadge status={t.priority === 'high' ? 'critical' : t.priority === 'medium' ? 'warning' : 'good'} />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            Oportunidades
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {opportunities.map((o, i) => (
              <div key={i} className="card">
                <p style={{ margin: 0, fontWeight: 500 }}>{o.title}</p>
                {o.description && <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--text-dim)', fontSize: '0.9em' }}>{o.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
