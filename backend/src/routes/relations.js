const express = require('express');
const prisma  = require('../config/prisma');
const router  = express.Router();

// ─────────────────────────────────────────────────────
// LISTAR — contatos + oportunidades
// ─────────────────────────────────────────────────────
router.get('/:artistId', async (req, res, next) => {
  try {
    const [contacts, opportunities] = await Promise.all([
      prisma.contact.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.opportunity.findMany({
        orderBy: { createdAt: 'desc' },
        include: { contact: { select: { id: true, name: true } } },
      }),
    ]);
    res.json({ contacts, opportunities });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// CONTATOS
// ─────────────────────────────────────────────────────
router.post('/:artistId/contact', async (req, res, next) => {
  try {
    const { name, role, company, type, email, phone, city, notes } = req.body;
    if (!name || !String(name).trim()) {
      const e = new Error('Nome obrigatorio');
      e.statusCode = 400;
      return next(e);
    }
    const contact = await prisma.contact.create({
      data: {
        name: String(name).trim(),
        role:    role    || null,
        company: company || null,
        type:    type    || 'outro',
        email:   email   || null,
        phone:   phone   || null,
        city:    city    || null,
        notes:   notes   || null,
      },
    });
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
});

router.patch('/:artistId/contact/:id', async (req, res, next) => {
  try {
    const fields = ['name', 'role', 'company', 'type', 'email', 'phone', 'city', 'notes'];
    const data = {};
    for (const f of fields) if (req.body[f] !== undefined) data[f] = req.body[f];
    if (req.body.lastContact !== undefined) {
      data.lastContact = req.body.lastContact ? new Date(req.body.lastContact) : null;
    }
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data });
    res.json(contact);
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Contato nao encontrado');
      e.statusCode = 404;
      return next(e);
    }
    next(err);
  }
});

router.delete('/:artistId/contact/:id', async (req, res, next) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Contato nao encontrado');
      e.statusCode = 404;
      return next(e);
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────
// OPORTUNIDADES
// ─────────────────────────────────────────────────────
router.post('/:artistId/opportunity', async (req, res, next) => {
  try {
    const { title, description, status, priority, value, dueDate, contactId } = req.body;
    if (!title || !String(title).trim()) {
      const e = new Error('Titulo obrigatorio');
      e.statusCode = 400;
      return next(e);
    }
    const opportunity = await prisma.opportunity.create({
      data: {
        title: String(title).trim(),
        description: description || null,
        status:      status      || 'aberta',
        priority:    priority    || 'media',
        value:       value != null && value !== '' ? Number(value) : null,
        dueDate:     dueDate && String(dueDate).trim() ? new Date(dueDate) : null,
        contactId:   contactId || null,
      },
    });
    res.status(201).json(opportunity);
  } catch (err) {
    next(err);
  }
});

router.patch('/:artistId/opportunity/:id', async (req, res, next) => {
  try {
    const data = {};
    for (const f of ['title', 'description', 'status', 'priority', 'contactId']) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }
    if (req.body.value !== undefined) {
      data.value = req.body.value != null && req.body.value !== '' ? Number(req.body.value) : null;
    }
    if (req.body.dueDate !== undefined) {
      data.dueDate = req.body.dueDate && String(req.body.dueDate).trim() ? new Date(req.body.dueDate) : null;
    }
    const opportunity = await prisma.opportunity.update({ where: { id: req.params.id }, data });
    res.json(opportunity);
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Oportunidade nao encontrada');
      e.statusCode = 404;
      return next(e);
    }
    next(err);
  }
});

router.delete('/:artistId/opportunity/:id', async (req, res, next) => {
  try {
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Oportunidade nao encontrada');
      e.statusCode = 404;
      return next(e);
    }
    next(err);
  }
});

module.exports = router;
