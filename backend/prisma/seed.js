/**
 * Seed — popula os 9 agentes da Agência Virtual.
 * Roda com: npx prisma db seed   (ou: node prisma/seed.js)
 * Idempotente — usa upsert, pode rodar várias vezes.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    bio: 'Ouvido no mercado. Sabe o que está tocando antes de todos.',
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
  {
    id: 'socialmedia',
    name: 'Social Media',
    title: 'Social Strategy',
    specialty: 'Algoritmo, conteúdo e timing nas redes',
    bio: 'Vive nas timelines. Conhece Instagram, TikTok e YouTube por dentro — sabe a janela certa e o gancho que segura o feed.',
    avatar: '📱',
    color: '#d4af37',
    room: 'Central Social',
  },
];

const TASKS = [
  { title: 'Gravar a voz do Bloco 2', status: 'todo',  priority: 'critica', ferb: true  },
  { title: 'Responder e-mail da Loud', status: 'todo',  priority: 'alta',   ferb: true  },
  { title: 'Postar reels da sessao',   status: 'todo',  priority: 'media',  ferb: false },
  { title: 'Revisar contrato Spotify', status: 'todo',  priority: 'media',  ferb: false },
  { title: 'Checar ISRC das faixas',   status: 'feita', priority: 'baixa',  ferb: false },
];

const CONTACTS = [
  { name: 'Fellipe Moreira', role: 'Produtor',     company: 'FMM Studios',   type: 'produtor', city: 'São Paulo', notes: 'Produziu Bloco 1 e 2.' },
  { name: 'Carol',           role: 'A&R',          company: 'Loud Records',  type: 'selo',     city: 'São Paulo', notes: 'Aguardando resposta do deal de EP.' },
  { name: 'Rafael',          role: 'Booking',      company: 'Move Agência',  type: 'promoter', city: 'Rio de Janeiro', notes: '3 shows confirmados.' },
  { name: 'Pedro',           role: 'Sync',         company: 'Itaú Unibanco', type: 'marca',    city: 'São Paulo', notes: 'Sync para campanha de verão.' },
  { name: 'Marina',          role: 'Editorial',    company: 'Deezer BR',     type: 'selo',     city: 'São Paulo', notes: 'Parceria de playlist.' },
];

const OPPORTUNITIES = [
  { title: 'Deal EP com Loud',          description: 'R$40k de adiantamento. Prazo: sexta.', status: 'em_negociacao', priority: 'critica', value: 40000, contactName: 'Carol'  },
  { title: 'Sync Itaú Q3',              description: 'Faixa exclusiva para campanha de verão.', status: 'aberta',     priority: 'alta',    value: 15000, contactName: 'Pedro'  },
  { title: 'Playlist editorial Deezer', description: 'Garantida se lançar até 30/05.',          status: 'aberta',     priority: 'media',   value: null,  contactName: 'Marina' },
];

async function main() {
  console.log('Seed: agentes...');
  for (const a of AGENTS) {
    await prisma.agent.upsert({
      where: { id: a.id },
      update: {
        name: a.name, title: a.title, specialty: a.specialty,
        bio: a.bio, avatar: a.avatar, color: a.color, room: a.room,
      },
      create: a,
    });
  }
  console.log(`  ${AGENTS.length} agentes prontos.`);

  // Tasks só na primeira vez (se tabela vazia)
  const taskCount = await prisma.task.count();
  if (taskCount === 0) {
    console.log('Seed: tarefas iniciais...');
    await prisma.task.createMany({ data: TASKS });
    console.log(`  ${TASKS.length} tarefas criadas.`);
  } else {
    console.log(`  ${taskCount} tarefas já existem — pulando.`);
  }

  // Contatos + oportunidades só na primeira vez
  const contactCount = await prisma.contact.count();
  if (contactCount === 0) {
    console.log('Seed: contatos e oportunidades...');
    const byName = {};
    for (const c of CONTACTS) {
      const created = await prisma.contact.create({ data: c });
      byName[c.name] = created.id;
    }
    for (const o of OPPORTUNITIES) {
      const { contactName, ...rest } = o;
      await prisma.opportunity.create({
        data: { ...rest, contactId: byName[contactName] || null },
      });
    }
    console.log(`  ${CONTACTS.length} contatos e ${OPPORTUNITIES.length} oportunidades criados.`);
  } else {
    console.log(`  ${contactCount} contatos já existem — pulando.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
