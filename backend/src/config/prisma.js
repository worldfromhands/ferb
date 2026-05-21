/**
 * Prisma Client — singleton.
 * Evita abrir múltiplas conexões em hot-reload (nodemon).
 */
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__ferbPrisma || new PrismaClient({
  log: ['warn', 'error'],
});

if (!globalForPrisma.__ferbPrisma) {
  globalForPrisma.__ferbPrisma = prisma;
}

module.exports = prisma;
