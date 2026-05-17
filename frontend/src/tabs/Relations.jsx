import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Loading, ErrorState, EmptyState } from '../components/States';

const ARTIST_ID = 'kyan';

const TYPE_LABEL = {
  label:    'Label',
  producer: 'Produtor',
  booker:   'Booker',
  press:    'Imprensa',
  brand:    'Marca',
  artist:   'Artista',
  other:    'Outro',
};

const STATUS_COLOR = {
  active:   'var(--green)',
  cold:     'var(--text-dim)',
  prospect: 'var(--accent)',
  closed:   'var(--red)',
};

function ContactCard({ contact }) {
  const color = STATUS_COLOR[contact.status] || 'var(--text-dim)';
  return (
    <div className="card" style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', flexShrink: 0,
      }}>
        {contact.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {contact.name}
        </p>
        <p style={{ margin: 'var(--sp-1) 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {TYPE_LABEL[contact.type] || contact.type}
          {contact.company ? ` · ${contact.company}` : ''}
        </p>
        {contact.notes && (
          <p style={{ margin: 'var(--sp-2) 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {contact.notes}
          </p>
        )}
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color, flexShrink: 0 }}>
        {contact.status ?? '—'}
      </span>
    </div>
  );
}

function OpportunityCard({ opp }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{opp.title}</p>
        {opp.value != null && (
          <span style={{ fontSize: '0.85rem', color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>
            R$ {opp.value.toLocaleString('pt-BR')}
          </span>
        )}
      </div>
      {opp.description && (
        <p style={{ margin: 'var(--sp-2) 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          {opp.description}
        </p>
      )}
      {opp.deadline && (
        <p style={{ margin: 'var(--sp-2) 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Prazo: {new Date(opp.deadline).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}

export default function Relations() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: d, error: e } = await api.get(`/api/relations/${ARTIST_ID}`);
    if (e) setError(e);
    else setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading />;
  if (error)   return <ErrorState message={error} onRetry={load} />;
  if (!data)   return <EmptyState message="Nenhuma relação encontrada." onAction={load} actionLabel="Carregar" />;

  const { contacts = [], opportunities = [] } = data;

  const q = search.toLowerCase();
  const filteredContacts = q
    ? contacts.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      )
    : contacts;

  return (
    <div>
      <div className="tab-header">
        <h1>Relações</h1>
        <button className="btn-secondary" onClick={load}>↻ Atualizar</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <input
          className="input"
          type="text"
          placeholder="Buscar contato..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <section>
          <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
            Oportunidades ({opportunities.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {opportunities.map((o, i) => <OpportunityCard key={i} opp={o} />)}
          </div>
        </section>
      )}

      {/* Contacts */}
      <section>
        <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--sp-3)' }}>
          Contatos ({filteredContacts.length})
        </h2>
        {filteredContacts.length === 0
          ? <EmptyState message={search ? 'Nenhum contato encontrado.' : 'Nenhum contato ainda.'} />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {filteredContacts.map((c, i) => <ContactCard key={i} contact={c} />)}
            </div>
          )
        }
      </section>
    </div>
  );
}
