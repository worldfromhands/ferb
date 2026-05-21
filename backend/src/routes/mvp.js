const express = require('express');
const { ask } = require('../services/claudeService');
const { AGENT_SYSTEM_PROMPTS } = require('../agents/agentPrompts');
const { buildAgentContext } = require('../agents/agentContext');

const router = express.Router();

// ─────────────────────────────────────────────────────
// DADOS DOS AGENTES (in-memory — MVP simples)
// ─────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'manager',
    name: 'Gerente',
    title: 'Manager',
    specialty: 'Estratégia de carreira e negócios',
    bio: 'Responsável pela visão macro da carreira. Negocia, decide, protege.',
    avatar: '👔',
    color: '#3b82f6',
    room: 'Escritório Executivo',
  },
  {
    id: 'musicproducer',
    name: 'Produtor Musical',
    title: 'Music Producer',
    specialty: 'Beats, mixagem, sound design',
    bio: 'Vive no estúdio. Transforma ideias em som. Parceiro criativo número um.',
    avatar: '🎵',
    color: '#8b5cf6',
    room: 'Estúdio de Produção',
  },
  {
    id: 'marketer',
    name: 'Marketer',
    title: 'Marketing & PR',
    specialty: 'Narrativa, presença digital, campanhas',
    bio: 'Pensa em como o mundo vai enxergar cada movimento do artista.',
    avatar: '📢',
    color: '#ec4899',
    room: 'Central de Mídia',
  },
  {
    id: 'arandr',
    name: 'A&R',
    title: 'Artists & Repertoire',
    specialty: 'Repertório, parcerias, playlists editoriais',
    bio: 'Oreha no mercado. Sabe o que está tocando antes de todos.',
    avatar: '🎧',
    color: '#f59e0b',
    room: 'Sala de Escuta',
  },
  {
    id: 'legal',
    name: 'Advogado',
    title: 'Legal & Contratos',
    specialty: 'Contratos, direitos autorais, royalties',
    bio: 'Protege o artista em cada negociação. Lê o que os outros não leem.',
    avatar: '⚖️',
    color: '#ef4444',
    room: 'Escritório Jurídico',
  },
  {
    id: 'finance',
    name: 'Financeiro',
    title: 'Finance & Revenue',
    specialty: 'Fluxo de caixa, receitas, ROI',
    bio: 'Cuida dos números para que o artista só pense em criar.',
    avatar: '💰',
    color: '#10b981',
    room: 'Sala de Contas',
  },
  {
    id: 'booking',
    name: 'Booking',
    title: 'Booking & Shows',
    specialty: 'Shows, festivais, agenda de palco',
    bio: 'Vive nos bastidores. Conhece todos os promoters e os melhores palcos.',
    avatar: '🎫',
    color: '#06b6d4',
    room: 'Sala de Agenda',
  },
  {
    id: 'stylist',
    name: 'Estilista',
    title: 'Stylist & Visual',
    specialty: 'Imagem, moda, identidade visual',
    bio: 'Cada aparição é um statement. Cada peça conta uma história.',
    avatar: '✨',
    color: '#f472b6',
    room: 'Atelier',
  },
  {
    id: 'techhacker',
    name: 'Tech Hacker',
    title: 'Data & Tech',
    specialty: 'Dados, algoritmos, automação, plataformas',
    bio: 'Vê o que os outros não veem. Faz a tecnologia trabalhar pelo artista.',
    avatar: '💻',
    color: '#0ea5e9',
    room: 'Sala de Servidores',
  },
];

// In-memory storage para demands e moods
const demandsStore = new Map(); // agentId → demand[]
const moodStore    = new Map(); // agentId → mood string
let demandCounter  = 1;

// Inicializar
AGENTS.forEach(a => {
  demandsStore.set(a.id, []);
  moodStore.set(a.id, 'idle');
});

// ─────────────────────────────────────────────────────
// 1. LOBBY — Todos os agentes com estado atual
// ─────────────────────────────────────────────────────

router.get('/lobby/:artistId', (req, res) => {
  const agents = AGENTS.map(a => ({
    ...a,
    mood: moodStore.get(a.id) || 'idle',
    activeDemand: (demandsStore.get(a.id) || []).find(d => d.status === 'in_progress') || null,
  }));
  res.json(agents);
});

// ─────────────────────────────────────────────────────
// 2. SALA DO AGENTE
// ─────────────────────────────────────────────────────

router.get('/room/:agentId', (req, res) => {
  const agent = AGENTS.find(a => a.id === req.params.agentId);
  if (!agent) return res.status(404).json({ error: 'Agente não encontrado' });

  const demands = (demandsStore.get(agent.id) || []).slice().reverse(); // mais recentes primeiro
  res.json({
    ...agent,
    mood: moodStore.get(agent.id) || 'idle',
    demands,
  });
});

// ─────────────────────────────────────────────────────
// 3. CRIAR DEMANDA
// ─────────────────────────────────────────────────────

router.post('/demand/:agentId', async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { title, description, priority = 'medium', dueDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return res.status(404).json({ error: 'Agente não encontrado' });

    const demandId = `${agentId}-${demandCounter++}`;
    const demand = {
      id: demandId,
      agentId,
      title,
      description,
      priority,
      dueDate: dueDate || null,
      status: 'in_progress',
      result: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const demands = demandsStore.get(agentId) || [];
    demands.push(demand);
    demandsStore.set(agentId, demands);

    // Agente entra em modo "thinking"
    moodStore.set(agentId, 'thinking');

    // Chamar Claude com a persona do agente + contexto real do KYAN
    const basePersona = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS.manager;
    const context     = await buildAgentContext(agentId);
    const systemPrompt = basePersona + context;

    const userPrompt = `Você recebeu uma demanda:

Título: "${title}"
Descrição: "${description}"
Prioridade: ${priority}
Prazo: ${dueDate || 'Sem prazo definido'}

Responda confirmando que entendeu, como vai abordar e quando pode entregar — use os dados reais do KYAN do seu contexto para fundamentar a resposta. Seja conciso, direto e específico.

FORMATO OBRIGATÓRIO: texto corrido, sem asteriscos, sem negrito, sem emojis, sem marcadores. Só texto puro.`;

    const agentResponse = await ask(systemPrompt, userPrompt);

    // Completar a demanda após resposta do Claude
    const delay = 4000 + Math.random() * 4000; // 4–8s de "trabalho"
    setTimeout(() => {
      const current = demandsStore.get(agentId) || [];
      const idx = current.findIndex(d => d.id === demandId);
      if (idx !== -1) {
        current[idx].status = 'completed';
        current[idx].result = agentResponse;
        current[idx].completedAt = new Date().toISOString();
        demandsStore.set(agentId, current);
      }
      moodStore.set(agentId, 'happy');

      // Volta pra idle depois de 10s
      setTimeout(() => moodStore.set(agentId, 'idle'), 10000);
    }, delay);

    res.json({
      demand,
      agentResponse,
      message: `${agent.name} recebeu a demanda e está trabalhando...`,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// 4. HISTÓRICO DE DEMANDAS DE UM AGENTE
// ─────────────────────────────────────────────────────

router.get('/demands/:agentId', (req, res) => {
  const demands = (demandsStore.get(req.params.agentId) || []).slice().reverse();
  res.json(demands);
});

// ─────────────────────────────────────────────────────
// 5. MAPA REGIONAL (REAL — Chartmetric)
// ─────────────────────────────────────────────────────

const cm = require('../services/chartmetric');

router.get('/map/:artistId', async (req, res, next) => {
  try {
    const [cities, countries] = await Promise.all([
      cm.getTopCities(undefined, 20),
      cm.getTopCountries(undefined, 15),
    ]);
    res.json({ cities, countries });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
