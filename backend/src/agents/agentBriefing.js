/**
 * Quando o usuário entra na sala de um agente, gera um BRIEFING:
 * - Resumo: o que esse agente está vendo no momento dele com os dados reais
 * - Sugestão: um movimento concreto que o agente sugere AGORA
 *
 * Usa o contexto real do KYAN + persona do agente + Claude pra produzir.
 * Resultado cached por 10min pra não chamar Claude toda vez que entra na sala.
 */

const { ask } = require('../services/claudeService');
const { AGENT_SYSTEM_PROMPTS } = require('./agentPrompts');
const { buildAgentContext }    = require('./agentContext');

const cache = new Map();
const TTL   = 10 * 60 * 1000;

async function generateBriefing(agentId) {
  const cached = cache.get(agentId);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const basePersona  = AGENT_SYSTEM_PROMPTS[agentId];
  if (!basePersona) return null;

  const context = await buildAgentContext(agentId);
  const system  = basePersona + context;

  const user = `Você está chegando no seu escritório agora. Olhou os números do KYAN no contexto acima e identifica DUAS coisas:

1) RESUMO: Em uma frase curta (até 25 palavras), o que esses dados estão dizendo sobre o seu domínio AGORA. Seja específico, cite um número se ajudar. Não conclua, observe.

2) SUGESTÃO: Um movimento concreto que você recomendaria pro KYAN essa semana, ancorado no que você acabou de ver. Direto, executável, em até 2 frases.

FORMATO DE RESPOSTA — JSON puro, sem markdown, sem cercas de código:
{"summary": "...", "suggestion": "..."}

Apenas o JSON. Nada antes ou depois.`;

  let raw = await ask(system, user);

  // Limpar possíveis cercas de código markdown se Claude usar
  raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: tentar extrair JSON com regex
    const m = raw.match(/\{[\s\S]*"summary"[\s\S]*"suggestion"[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch { parsed = null; }
    }
  }

  if (!parsed || !parsed.summary) {
    parsed = { summary: raw.slice(0, 200), suggestion: null };
  }

  cache.set(agentId, { ts: Date.now(), data: parsed });
  return parsed;
}

function invalidateCache(agentId = null) {
  if (agentId) cache.delete(agentId);
  else cache.clear();
}

module.exports = { generateBriefing, invalidateCache };
