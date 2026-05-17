const { buildSystemPrompt } = require('../agents/ferbPersona');
const { ask } = require('./claudeService');

async function gerarSummary(metricas) {
  const linhas = metricas.map(m => {
    const v = (m.current ?? m.value ?? 0).toLocaleString('pt-BR');
    const d = m.delta != null ? ` (variacao: ${m.delta > 0 ? '+' : ''}${Number(m.delta).toLocaleString('pt-BR')})` : '';
    return `- ${m.label || m.metricKey}: ${v}${d}`;
  }).join('\n');

  const sys = buildSystemPrompt({ name: 'KYAN' });
  const prompt = `Dados atuais do KYAN no Chartmetric:\n${linhas}\n\nFaca uma analise de 2-3 frases. NAO use markdown, asteriscos ou negrito. Texto puro apenas. Identifique o padrao principal, diga o que esta acontecendo e o que ele deve focar AGORA.`;
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

