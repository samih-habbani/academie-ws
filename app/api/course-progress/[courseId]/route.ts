import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/user-auth'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/** Progression du membre connecté sur les chapitres d'un cours (pour les pastilles et le pourcentage). */
export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401, headers: NO_STORE })

  const courseId = Number((await params).courseId)
  if (!Number.isInteger(courseId) || courseId <= 0) return NextResponse.json({ error: 'Cours invalide.' }, { status: 400, headers: NO_STORE })

  const rows = await prisma.videoProgress.findMany({
    where: { userId: user.id, chapter: { courseId } },
    select: { chapterId: true, seconds: true, duration: true, completed: true },
  })
  return NextResponse.json({ progress: rows }, { headers: NO_STORE })
}
