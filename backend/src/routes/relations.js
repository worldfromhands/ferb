const express = require('express');
const router = express.Router();
const data = {
  contacts: [
    { name: 'Fellipe Moreira', type: 'producer', company: 'FMM Studios',  status: 'active',   notes: 'Produziu Bloco 1 e 2.' },
    { name: 'Carol (Loud)',    type: 'label',    company: 'Loud Records',  status: 'prospect', notes: 'Aguardando resposta deal EP.' },
    { name: 'Rafael Booking', type: 'booker',   company: 'Move Agencia',  status: 'active',   notes: '3 shows confirmados.' },
    { name: 'Pedro Sync',     type: 'brand',    company: 'Itau Unibanco', status: 'cold',     notes: 'Sync campanha verao.' },
    { name: 'Jao',            type: 'artist',   company: null,            status: 'active',   notes: 'Collab em negociacao.' },
    { name: 'Marina (Deezer)',type: 'label',    company: 'Deezer BR',     status: 'active',   notes: 'Parceria playlist.' },
  ],
  opportunities: [
    { title: 'Deal EP com Loud',          description: 'R$40k adiantamento. Prazo: sexta.', value: 40000, deadline: '2026-05-23' },
    { title: 'Sync Itau Q3',              description: 'Track exclusiva campanha verao.',   value: 15000, deadline: '2026-06-01' },
    { title: 'Playlist editorial Deezer', description: 'Garantida se lancar ate 30/05.',   value: null,  deadline: '2026-05-30' },
  ],
};
router.get('/:artistId', (req, res) => res.json(data));
router.post('/:artistId/contact', (req, res) => {
  const { name, type, company, notes } = req.body;
  if (!name) { const e = new Error('Nome obrigatorio'); e.statusCode = 400; throw e; }
  const c = { name, type: type || 'other', company: company || null, status: 'prospect', notes: notes || '' };
  data.contacts.push(c);
  res.status(201).json(c);
});
module.exports = router;
