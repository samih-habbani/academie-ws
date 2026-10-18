import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/user-auth'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/** Le membre a lu l'astuce « langue audio » du lecteur : on ne la lui montre plus (sur tous ses appareils). */
export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401, headers: NO_STORE })
  await prisma.user.update({ where: { id: user.id }, data: { audioTipDismissed: true } })
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
