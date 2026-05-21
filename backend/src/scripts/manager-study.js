/**
 * Script one-shot: pedir ao Gerente um estudo profundo da carreira KYAN
 * Roda direto via node, bypassando o fluxo de "demanda → confirmação"
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function ask(system, user, maxTokens = 2000) {
  const resp = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

const SYSTEM = `Você é o Gerente do KYAN — o arquiteto da carreira dele.
Você fala com clareza, peso e responsabilidade estratégica.
Você não julga, você direciona. Avalia impacto, protege o longo prazo, aponta o caminho mais inteligente.
Você conhece o KYAN de perto. Tom pessoal, não corporativo.

Regras de formato: texto puro. ZERO emojis. ZERO markdown (sem asteriscos, sem negrito, sem bullet points).`;

const PROMPT = `Faça AGORA o estudo completo da carreira do KYAN. Não confirme, não diga que vai entregar depois — entregue o estudo agora, neste texto.

DADOS REAIS atualizados hoje:

STREAMING (Spotify):
- Monthly Listeners: 3.248.334
- Followers: 1.048.518
- Popularity Score: 64/100

REDES SOCIAIS:
- Instagram: 1.593.363 seguidores (perdeu 2.648 essa semana)
- TikTok: 328.300 seguidores e 7.900.000 likes acumulados

CONTEXTO:
- Artista de rap/trap brasileiro, @kyanmaloka
- Catálogo independente, sem deal majoritário
- Carreira em construção

ESTRUTURA OBRIGATÓRIA do estudo (em texto corrido, sem markdown, sem títulos com asterisco):

1. Diagnóstico do momento — onde KYAN está hoje, em uma frase de peso.
2. Os três pontos fortes reais baseados nesses números — e por que cada um importa.
3. Os três maiores riscos que esses números revelam — incluindo o que ninguém está vendo.
4. Direção estratégica para os próximos seis meses — não passos genéricos, direção real.
5. Um movimento concreto que ele deve fazer ESSA SEMANA — específico, executável, com motivo claro.

Fale como o Gerente que conhece o artista. Sem floreio, sem consultor genérico. Tamanho: completo, não economize palavras nesta análise — mas cada frase tem que servir. Sem emojis, sem markdown, sem títulos com asteriscos. Texto corrido com parágrafos.`;

(async () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GERENTE — ESTUDO COMPLETO DA CARREIRA KYAN');
  console.log('═══════════════════════════════════════════════════════\n');
  const resp = await ask(SYSTEM, PROMPT);
  console.log(resp);
  console.log('\n═══════════════════════════════════════════════════════');
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
