/**
 * Borra usuarios por teléfono (incluye variantes con/sin prefijo 54 como en UserService).
 *
 * Ejecutar donde DATABASE_URL apunte al Postgres real (p. ej. terminal del servidor /
 * contenedor con red Docker, nunca pegues la URL en chats):
 *
 *   cd packages/database && DATABASE_URL="..." pnpm exec tsx scripts/delete-users-by-phone.ts 5491...
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function phoneLookupVariants(phone: string): string[] {
  const s = phone.replace(/\D/g, '')
  if (!s) return []
  const v = new Set<string>()
  v.add(s)
  if (s.startsWith('54') && s.length >= 11) {
    v.add(s.slice(2))
  }
  if (s.startsWith('54') && s.length === 12 && s[2] !== '9') {
    v.add(`549${s.slice(2)}`)
  }
  if (!s.startsWith('54') && s.startsWith('9') && s.length >= 10 && s.length <= 11) {
    v.add(`54${s}`)
  }
  return [...v]
}

async function main() {
  const args = process.argv.slice(2).filter(Boolean)
  if (!args.length) {
    console.error('Uso: pnpm exec tsx scripts/delete-users-by-phone.ts <tel> [<tel> ...]')
    process.exit(1)
  }

  const allPhones = new Set<string>()
  for (const a of args) {
    for (const v of phoneLookupVariants(a)) allPhones.add(v)
  }
  const list = [...allPhones]

  const found = await prisma.user.findMany({
    where: { phone: { in: list } },
    select: { id: true, phone: true, name: true, onboardingComplete: true },
  })

  console.log('Coincidencias antes de borrar:', found.length)
  for (const u of found) {
    console.log(`  - ${u.phone} | ${u.name} | onboardingComplete=${u.onboardingComplete}`)
  }

  if (!found.length) {
    console.log('Nada que borrar para esos números.')
    await prisma.$disconnect()
    return
  }

  const result = await prisma.user.deleteMany({ where: { phone: { in: list } } })
  console.log('Filas User eliminadas:', result.count)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
