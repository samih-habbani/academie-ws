import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/user-auth'
import { COMPLETED_RATIO } from '@/lib/progress'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/** Enregistre la position de lecture du membre connecté dans la vidéo d'un chapitre. */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401, headers: NO_STORE })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400, headers: NO_STORE })
  }
  const { chapterId, seconds, duration } = (body ?? {}) as Record<string, unknown>
  const valid =
    Number.isInteger(chapterId) && (chapterId as number) > 0 &&
    Number.isInteger(seconds) && (seconds as number) >= 0 && (seconds as number) <= 86_400 &&
    Number.isInteger(duration) && (duration as number) > 0 && (duration as number) <= 86_400
  if (!valid) return NextResponse.json({ error: 'Valeurs invalides.' }, { status: 400, headers: NO_STORE })

  const s = Math.min(seconds as number, duration as number)
  const d = duration as number
  const reachedEnd = s / d >= COMPLETED_RATIO

  try {
    const saved = await prisma.videoProgress.upsert({
      where: { userId_chapterId: { userId: user.id, chapterId: chapterId as number } },
      // « terminé » ne se perd jamais : revoir une vidéo ne la repasse pas en « en cours ».
      update: { seconds: s, duration: d, ...(reachedEnd ? { completed: true } : {}) },
      create: { userId: user.id, chapterId: chapterId as number, seconds: s, duration: d, completed: reachedEnd },
      select: { seconds: true, duration: true, completed: true },
    })
    return NextResponse.json(saved, { headers: NO_STORE })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return NextResponse.json({ error: 'Chapitre introuvable.' }, { status: 404, headers: NO_STORE })
    }
    throw e
  }
}
