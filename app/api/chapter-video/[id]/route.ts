import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser } from '@/lib/user-auth'
import { getYoutubeVideoId } from '@/lib/youtube'

// L'identifiant de la vidéo n'est pas écrit dans les pages (elles sont publiques et en cache) :
// il n'est renvoyé qu'aux visiteurs connectés, avec leur position de reprise.
const NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401, headers: NO_STORE })

  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Chapitre invalide.' }, { status: 400, headers: NO_STORE })

  const [chapter, progress] = await Promise.all([
    prisma.chapter.findUnique({ where: { id }, select: { urlVideo: true } }),
    prisma.videoProgress.findUnique({
      where: { userId_chapterId: { userId: user.id, chapterId: id } },
      select: { seconds: true, duration: true, completed: true },
    }),
  ])
  if (!chapter) return NextResponse.json({ error: 'Chapitre introuvable.' }, { status: 404, headers: NO_STORE })

  return NextResponse.json(
    { videoId: chapter.urlVideo ? getYoutubeVideoId(chapter.urlVideo) : null, progress, audioTipDismissed: user.audioTipDismissed },
    { headers: NO_STORE },
  )
}
