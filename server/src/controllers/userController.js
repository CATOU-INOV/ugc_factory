import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'

export async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(users)
}

export async function createUser(req, res) {
  const { email, password, firstName, lastName, role } = req.body

  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Champs obligatoires : email, prénom, nom, rôle' })
  }

  if (!['ADMIN', 'MEDIA'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide. Valeurs acceptées : ADMIN, MEDIA' })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' })
  }

  // Mot de passe par défaut si non fourni
  const rawPassword = password || 'Orchestra2024!'
  const hashed = await bcrypt.hash(rawPassword, 12)

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      password: hashed,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  })

  res.status(201).json({ ...user, temporaryPassword: !password ? rawPassword : undefined })
}

export async function updateUser(req, res) {
  const { id } = req.params
  const { firstName, lastName, email } = req.body

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Champs obligatoires : prénom, nom, email' })
  }

  const existing = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), NOT: { id } },
  })
  if (existing) {
    return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur' })
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  })

  res.json(user)
}
