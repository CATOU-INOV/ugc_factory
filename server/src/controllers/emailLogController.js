import prisma from '../lib/prisma.js'

export async function listEmailLogs(req, res) {
  const { type, campaignId } = req.query

  const where = {}
  if (type) where.type = type
  if (campaignId) where.campaignId = campaignId

  const logs = await prisma.emailLog.findMany({
    where,
    include: {
      submission: { select: { id: true, firstName: true, lastName: true } },
      campaign: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(logs)
}
