import { prisma } from '@/lib/prisma'
import { resetCountsData } from '@/lib/subscription'

async function main() {
  const users = await prisma.user.findMany({
    where: { subscription: { is: null } },
    select: { id: true },
  })

  if (users.length === 0) {
    console.log('No users missing subscriptions.')
    return
  }

  const data = users.map((u) => ({
    userId: u.id,
    plan: 'FREE' as const,
    ...resetCountsData(),
  }))

  const result = await prisma.subscription.createMany({ data })
  console.log(`Created ${result.count} subscription(s).`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
