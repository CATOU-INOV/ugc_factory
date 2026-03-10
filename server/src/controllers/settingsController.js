import prisma from '../lib/prisma.js'

export async function getAnnualBudget(req, res) {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'annualBudget' } })
  res.json({ annualBudget: setting ? Number(setting.value) : 0 })
}

export async function setAnnualBudget(req, res) {
  const { value } = req.body
  const parsed = parseFloat(value)
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ error: 'Valeur invalide' })
  }
  await prisma.appSetting.upsert({
    where: { key: 'annualBudget' },
    update: { value: String(parsed) },
    create: { key: 'annualBudget', value: String(parsed) },
  })
  res.json({ annualBudget: parsed })
}
