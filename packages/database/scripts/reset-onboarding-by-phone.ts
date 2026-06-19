/**
 * Marca onboardingComplete=false (opcional: limpiar historial BB vía API del bot).
 *
 *   cd packages/database && DATABASE_URL="..." pnpm exec tsx scripts/reset-onboarding-by-phone.ts 5491...
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function phoneLookupVariants(phone: string): string[] {
  const s = phone.replace(/\D/g, '')
  if (!s) return []
  const v = new Set<string>()
  v.add(s)
  if (s.startsWith('54') && s.length >= 11) v.add(s.slice(2))
  if (s.startsWith('54') && s.length === 12 && s[2] !== '9') v.add(`549${s.slice(2)}`)
  if (!s.startsWith('54') && s.startsWith('9') && s.length >= 10 && s.length <= 11) v.add(`54${s}`)
  return [...v]
}

async function main() {
  const args = process.argv.slice(2).filter(Boolean)
  if (!args.length) {
    console.error('Uso: pnpm exec tsx scripts/reset-onboarding-by-phone.ts <tel> [<tel> ...]')
    process.exit(1)
  }

  const allPhones = new Set<string>()
  for (const a of args) {
    for (const v of phoneLookupVariants(a)) allPhones.add(v)
  }
  const list = [...allPhones]

  const before = await prisma.user.findMany({
    where: { phone: { in: list } },
    select: { id: true, phone: true, name: true, onboardingComplete: true },
  })

  console.log('Antes:')
  for (const u of before) {
    console.log(`  - ${u.phone} | ${u.name} | onboardingComplete=${u.onboardingComplete}`)
  }

  if (!before.length) {
    console.log('No hay usuarios para esos teléfonos.')
    await prisma.$disconnect()
    return
  }

  const result = await prisma.user.updateMany({
    where: { phone: { in: list } },
    data: { onboardingComplete: false },
  })

  console.log('Filas actualizadas:', result.count)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
