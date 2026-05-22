/**
 * Teste FERB — envia 1 demanda para cada um dos 9 agentes
 * e imprime a resposta de cada um. Run: node scripts/test-9-agentes.js
 */
const http = require('http');

function post(agentId, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      host: 'localhost', port: 3000, method: 'POST',
      path: `/api/mvp/demand/${agentId}`,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch (e) { reject(new Error('parse: ' + buf.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const DEMANDAS = [
  { agentId: 'manager', emoji: '👔', nome: 'GERENTE',
    title: 'Qual é o próximo movimento estratégico mais inteligente para KYAN agora?',
    description: 'Analise os dados de crescimento atual — cidades com maior concentração de ouvintes, faixas com melhor performance, e ritmo de lançamentos dos últimos 6 meses. Com base nisso, me diga: qual é o movimento mais inteligente pra fazer agora? Não quero lista de opções. Quero sua opinião direta sobre qual alavanca acionar — tour, novo lançamento, collab, push em playlist específica, ou outro — e por quê esse movimento e não outro. Me diga também o que estou deixando de fazer que já deveria ter feito.' },
  { agentId: 'arandr', emoji: '🎧', nome: 'A&R',
    title: 'Qual faixa do catálogo atual tem mais potencial não aproveitado e o que fazer com ela?',
    description: 'Olha pro catálogo atual — álbuns, faixas, performance de cada uma. Qual faixa está sub-performando em relação ao seu potencial real? Pode ser uma faixa com pouco push, um som que ressoaria melhor com um remix, uma que encaixaria perfeita em alguma playlist editorial que ainda não pegou. Me diz qual é essa faixa, por que você acha que ela tem mais potencial do que os números mostram, e qual seria a jogada certa agora — remix, re-pitch para playlist, collab pra reativar, ou reedição.' },
  { agentId: 'musicproducer', emoji: '🎵', nome: 'PRODUTOR MUSICAL',
    title: 'O som atual do KYAN está alinhado com o que a audiência dele está consumindo ou está dissonante?',
    description: 'Analisa o perfil sonoro atual — BPM médio, energia das faixas, gêneros predominantes, e o que os related artists estão fazendo. Compara isso com o que a audiência de KYAN consome (cidades, perfil de ouvinte, tendências de playlist que ele aparece). Existe dissonância entre o som que KYAN produz e o som que o público dele quer? Se sim, qual é o caminho de ajuste — sem perder identidade, mas ganhando relevância. Me diz também se tem algum elemento sonoro que deveria estar mais presente nas próximas produções.' },
  { agentId: 'marketer', emoji: '📢', nome: 'MARKETER',
    title: 'Qual cidade brasileira representa a maior oportunidade de crescimento orgânico agora e como ativar isso?',
    description: 'Olha pro mapa de cidades — onde KYAN já tem base de ouvintes, onde está crescendo mais rápido, onde tem potencial mas ainda não foi trabalhado. Escolhe UMA cidade que representa a melhor oportunidade de crescimento orgânico agora. Me explica por que essa cidade e não outra. Depois me diz como ativar esse crescimento — conteúdo específico, influencers locais, rádio regional, show, parceria com cena local. Quero uma estratégia de 30 dias pra essa cidade.' },
  { agentId: 'legal', emoji: '⚖️', nome: 'ADVOGADO',
    title: 'Quais são os 3 maiores riscos jurídicos e contratuais que KYAN precisa resolver agora?',
    description: 'Com base no que você sabe sobre a estrutura de carreira atual — distribuição, publishing, splits de faixas, relação com plataformas — me aponta os 3 maiores riscos que podem custar dinheiro ou controle criativo no futuro próximo. Pra cada risco, me diz: o que é, por que é urgente, e qual é a ação mínima necessária pra se proteger. Também quero saber: existe alguma receita que provavelmente está sendo perdida por falta de registro ou claim correto — e como recuperar isso.' },
  { agentId: 'finance', emoji: '💰', nome: 'FINANCEIRO',
    title: 'Se KYAN decidir fazer uma tour de 5 shows por SP, RJ e MG nos próximos 60 dias, qual é o cenário financeiro realista?',
    description: 'Monta um cenário financeiro realista de uma pequena tour — 5 shows, cidades SP, RJ e MG. Usa os dados de audiência por cidade que você tem acesso pra estimar demanda. Me diz: custo estimado (produção, deslocamento, equipe, local), receita esperada (ingresso médio por cidade, capacidade realista de casa), break-even, e lucro líquido possível. Depois me diz se esse investimento faz sentido agora ou se tem algo de melhor ROI pra fazer com o mesmo budget. Seja pragmático — não quero otimismo, quero realidade.' },
  { agentId: 'booking', emoji: '🎫', nome: 'BOOKING',
    title: 'Qual festival ou evento no Brasil nos próximos 6 meses faria mais sentido para KYAN aparecer e como entrar?',
    description: 'Olha pro calendário de festivais e eventos brasileiros — Rolling Loud Brasil, The Town, Lollapalooza, Primavera Sound, eventos regionais, shows universitários, festas de cena. Com base no perfil de audiência do KYAN e no momento de carreira atual, qual seria o encaixe mais estratégico? Não precisa ser o maior — precisa ser o mais certo. Me diz qual evento, por que faz sentido, qual seria o argumento pra apresentar ao booking do evento, e como iniciar esse contato. Se não tiver festival ideal agora, me diz qual seria o move alternativo pra marcar presença ao vivo.' },
  { agentId: 'stylist', emoji: '✨', nome: 'ESTILISTA',
    title: 'A identidade visual atual do KYAN está comunicando o que ele quer comunicar ou está genérica demais?',
    description: 'Analisa o que você consegue ver sobre a identidade visual atual do KYAN — fotos do Instagram, estética dos clipes, paleta usada, tipografia, escolhas de roupa e styling. Cruza isso com o perfil do público (cidades, faixa etária, gênero, cenas musicais que ele aparece). A estética atual está alinhada com quem é o público e com o que KYAN quer projetar? Onde está genérica, desatualizada, ou inconsistente? Me dá 3 direcionamentos concretos — não vagos — que ele poderia implementar no próximo ensaio fotográfico ou clipe pra fortalecer identidade visual.' },
  { agentId: 'techhacker', emoji: '💻', nome: 'TECH HACKER',
    title: 'Onde estão as maiores oportunidades de crescimento algorítmico que KYAN ainda não está aproveitando?',
    description: 'Olha pros dados de playlist — quais editoriais ele já aparece, quais ele deveria aparecer e não aparece, qual é o padrão de faixas que entram nessas playlists. Analisa também o ritmo de lançamento e frequência de upload — o algoritmo do Spotify favorece consistência. Me diz: qual é o comportamento do algoritmo que mais favorece o perfil de KYAN agora, o que está faltando pra ativar mais recomendações orgânicas, e se existe alguma janela de timing — dia da semana, frequência de lançamento, tipo de conteúdo — que ele deveria estar usando mas não está. Quero tática, não teoria.' },
];

(async () => {
  for (const d of DEMANDAS) {
    console.log('\n' + '='.repeat(70));
    console.log(`${d.emoji}  ${d.nome}  (${d.agentId})`);
    console.log('='.repeat(70));
    console.log('DEMANDA: ' + d.title + '\n');
    try {
      const r = await post(d.agentId, { title: d.title, description: d.description, priority: 'high' });
      console.log('RESPOSTA:\n' + (r.agentResponse || JSON.stringify(r)));
    } catch (e) {
      console.log('ERRO: ' + e.message);
    }
  }
  console.log('\n' + '='.repeat(70));
  console.log('FIM — 9 demandas enviadas.');
})();
