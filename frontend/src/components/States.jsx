export function Loading({ label = 'Carregando...' }) {
  return (
    <div className="state-box">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box">
      <span style={{ color: 'var(--bad)' }}>Algo falhou</span>
      <p style={{ fontSize: 13 }}>{message}</p>
      {onRetry && (
        <button className="btn-ghost btn" onClick={onRetry}>Tentar de novo</button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="state-box">
      <span>{title}</span>
      {hint && <p style={{ fontSize: 13 }}>{hint}</p>}
    </div>
  );
}
