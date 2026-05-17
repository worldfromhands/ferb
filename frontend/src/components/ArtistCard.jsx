import { useState, useEffect } from 'react';
import './ArtistCard.css';

const fmt = (n) => n ? n.toLocaleString('pt-BR') : '—';

export default function ArtistCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/artist/3419361');
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      setData(json.obj);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="state-screen">
      <div className="spinner" />
      <p>Carregando dados...</p>
    </div>
  );

  if (error) return (
    <div className="state-screen">
      <span className="error-icon">⚠️</span>
      <p>{error}</p>
      <button className="btn-primary" onClick={fetchData}>Tentar novamente</button>
    </div>
  );

  const s = data.cm_statistics;
  const trend = data.career_status?.trend || '';
  const isDecline = trend.includes('decline');

  const cards = [
    {
      icon: '🎵', platform: 'Spotify',
      value: fmt(s.sp_monthly_listeners), label: 'ouvintes mensais',
      sub: `${fmt(s.sp_followers)} seguidores`
    },
    {
      icon: '📸', platform: 'Instagram',
      value: fmt(s.ins_followers), label: 'seguidores',
      sub: null
    },
    {
      icon: '▶️', platform: 'YouTube',
      value: fmt(s.ycs_views), label: 'views totais',
      sub: `${fmt(s.ycs_subscribers)} inscritos`
    },
    {
      icon: '🎵', platform: 'TikTok',
      value: fmt(s.tiktok_followers), label: 'seguidores',
      sub: `${fmt(s.tiktok_likes)} likes`
    },
    {
      icon: '📋', platform: 'Playlists',
      value: fmt(s.num_sp_playlists), label: 'playlists Spotify',
      sub: `${fmt(s.num_sp_editorial_playlists)} editoriais`
    },
    {
      icon: '⭐', platform: 'Score', isScore: true,
      value: data.cm_artist_score?.toFixed(1), label: 'Chartmetric Score',
      sub: `Rank global #${fmt(data.cm_artist_rank)}`
    },
  ];

  return (
    <div className="dashboard">

      {/* Header */}
      <header className="dash-header">
        <span className="dash-header-title">FERB Dashboard</span>
        <div className="dash-header-badge">
          <span className="dot-live" />
          ao vivo
        </div>
      </header>

      {/* Hero */}
      <section className="dash-hero">
        <div className="hero-inner">
          <img src={data.image_url} alt={data.name} className="artist-photo" />
          <div className="hero-text">
            <h1>{data.name}</h1>
            <div className="hero-meta">
              <span className="hero-label">{data.record_label} · {data.current_city}</span>
              <span className={`career-pill ${isDecline ? 'decline' : 'growth'}`}>
                {isDecline ? '↘' : '↗'} {data.career_status?.stage} · {trend}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="dash-grid">
        {cards.map((c) => (
          <div key={c.platform} className={`card${c.isScore ? ' card-score' : ''}`}>
            <span className="card-icon">{c.icon}</span>
            <p className="card-platform">{c.platform}</p>
            <p className="card-value">{c.value}</p>
            <p className="card-label">{c.label}</p>
            {c.sub && <p className="card-sub">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="dash-actions">
        <button className="btn-primary" onClick={fetchData}>
          Atualizar dados
        </button>
        {lastUpdate && <span className="update-time">Última atualização: {lastUpdate}</span>}
      </div>

      {/* Debug */}
      <div className="debug-section">
        <details>
          <summary>Dados brutos da API</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>

      {/* Watermark EHXIS */}
      <div className="logo-watermark">EHXIS</div>

    </div>
  );
}
