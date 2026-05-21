const express = require('express');
const prisma  = require('../config/prisma');
const router  = express.Router();

// Lista todas as tarefas
router.get('/:artistId', async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// Cria tarefa
router.post('/:artistId', async (req, res, next) => {
  try {
    const { title, priority } = req.body;
    if (!title) {
      const e = new Error('Titulo obrigatorio');
      e.statusCode = 400;
      return next(e);
    }
    const task = await prisma.task.create({
      data: {
        title,
        priority: priority || 'media',
        status: 'todo',
        ferb: false,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// Atualiza tarefa (status, priority, title)
router.patch('/:artistId/tasks/:taskId', async (req, res, next) => {
  try {
    const { title, status, priority } = req.body;
    const data = {};
    if (title    !== undefined) data.title    = title;
    if (status   !== undefined) data.status   = status;
    if (priority !== undefined) data.priority = priority;

    const task = await prisma.task.update({
      where: { id: req.params.taskId },
      data,
    });
    res.json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Tarefa nao encontrada');
      e.statusCode = 404;
      return next(e);
    }
    next(err);
  }
});

// Remove tarefa
router.delete('/:artistId/tasks/:taskId', async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') {
      const e = new Error('Tarefa nao encontrada');
      e.statusCode = 404;
      return next(e);
    }
    next(err);
  }
});

module.exports = router;
