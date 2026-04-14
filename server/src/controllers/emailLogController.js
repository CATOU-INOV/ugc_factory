import prisma from '../lib/prisma.js'

export async function listEmailLogs(req, res) {
  const { type, campaignId } = req.query

  const where = {}
  if (type) where.type = type
  if (campaignId) where.campaignId = campaignId

  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 200)
  const offset = parseInt(req.query.offset, 10) || 0

  const [total, logs] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({
      where,
      include: {
        submission: { select: { id: true, firstName: true, lastName: true } },
        campaign: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ])

  res.json({ logs, total, limit, offset })
}
