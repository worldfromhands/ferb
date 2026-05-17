const express = require('express');
const router = express.Router();

let tasks = [
  { id: '1', title: 'Gravar a voz do Bloco 2',  status: 'todo',  priority: 'critica', source: 'ferb'   },
  { id: '2', title: 'Responder e-mail da Loud',  status: 'todo',  priority: 'alta',    source: 'ferb'   },
  { id: '3', title: 'Postar reels da sessao',    status: 'todo',  priority: 'media',   source: 'manual' },
  { id: '4', title: 'Revisar contrato Spotify',  status: 'todo',  priority: 'media',   source: 'manual' },
  { id: '5', title: 'Checar ISRC das faixas',    status: 'feita', priority: 'baixa',   source: 'manual' },
];
let counter = tasks.length + 1;

router.get('/:artistId', (req, res) => res.json({ tasks }));

router.post('/:artistId', (req, res, next) => {
  const { title, priority } = req.body;
  if (!title) { const e = new Error('Titulo obrigatorio'); e.statusCode = 400; return next(e); }
  const task = { id: String(counter++), title, status: 'todo', priority: priority || 'media', source: 'manual' };
  tasks.unshift(task);
  res.status(201).json(task);
});

// Compatibilidade: /tasks/:id (frontend usa esse path)
router.patch('/:artistId/tasks/:taskId', (req, res, next) => {
  const idx = tasks.findIndex(t => t.id === req.params.taskId);
  if (idx === -1) { const e = new Error('Tarefa nao encontrada'); e.statusCode = 404; return next(e); }
  tasks[idx] = { ...tasks[idx], ...req.body };
  res.json(tasks[idx]);
});

module.exports = router;
