import { prisma } from '@/lib/prisma'
import { resetCountsData } from '@/lib/subscription'

async function main() {
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const result = await prisma.subscription.updateMany({
    where: { lastResetDate: { lt: todayUtc } },
    data: resetCountsData(now),
  })

  console.log(`Reset ${result.count} subscription(s).`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
