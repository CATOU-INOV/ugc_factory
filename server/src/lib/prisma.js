// Singleton Prisma Client
// Évite les connexions multiples en développement (hot-reload)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

export default prisma
