const DESCRICOES = {
  movement:      'Vai mostrar o que acontece agora com sua música nas redes — tendências, virais e picos de busca.',
  creation:      'Vai analisar seu catálogo: que som performa melhor e ideias de collab por overlap de público.',
  opportunities: 'Vai reunir as oportunidades acionáveis — shows, sync e parcerias — geradas pelos agentes de IA.',
  identity:      'Vai guardar a memória do artista: posicionamento, valores e referências que personalizam o FERB.',
  financial:     'Vai consolidar receita, royalties e ROI. Módulo sensível — será construído com criptografia.',
  bureaucracy:   'Vai organizar contratos, registros (ISRC, ISWC), splits e prazos. Fase final do FERB.',
};

export default function ComingSoon({ tab }) {
  if (!tab) return null;
  return (
    <div>
      <div className="tab-header">
        <h1>{tab.label}</h1>
        <p>Esta aba faz parte de uma fase futura do FERB.</p>
      </div>
      <div className="card" style={{ maxWidth: 520 }}>
        <span className="badge-soon">Fase {tab.phase} — em breve</span>
        <p style={{ marginTop: 'var(--sp-3)', color: 'var(--text-dim)' }}>
          {DESCRICOES[tab.id] || 'Em desenvolvimento.'}
        </p>
      </div>
    </div>
  );
}
