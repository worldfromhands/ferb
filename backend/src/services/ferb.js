const { buildSystemPrompt } = require('../agents/ferbPersona');
const { ask } = require('./claudeService');

async function gerarSummary(metricas) {
  const linhas = metricas.map(m => {
    const v = (m.current ?? m.value ?? 0).toLocaleString('pt-BR');
    const d = m.delta != null ? ` (variacao: ${m.delta > 0 ? '+' : ''}${Number(m.delta).toLocaleString('pt-BR')})` : '';
    return `- ${m.label || m.metricKey}: ${v}${d}`;
  }).join('\n');

  const sys = buildSystemPrompt({ name: 'KYAN' });
  const prompt = `Dados atuais do KYAN no Chartmetric:\n${linhas}\n\nLeia esses dados como um artista le uma obra em progresso. Em 2-3 frases, diga o que o movimento desses numeros esta revelando sobre o momento artistico do KYAN e aponte a direcao natural que emerge desse padrao. NAO use markdown, asteriscos ou negrito. Texto puro apenas.`;
  return await ask(sys, prompt);
}

function gerarStatusGeral(metricas) {
  const temCritico = metricas.some(m => (m.delta ?? 0) < -100000);
  const temAbaixo  = metricas.some(m => m.status === 'abaixo');
  if (temCritico) return 'critical';
  if (temAbaixo)  return 'warning';
  return 'good';
}

module.exports = { gerarSummary, gerarStatusGeral };

