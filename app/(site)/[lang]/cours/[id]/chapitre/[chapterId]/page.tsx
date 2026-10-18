import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { chapterUrl } from '@/lib/urls'

// Ancienne URL /cours/<id>/chapitre/<id> : redirection permanente (308) vers /course/<slug>/chapter/<id>.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export default async function LegacyChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params
  const courseId = Number(id)
  const chapId = Number(chapterId)
  if (!Number.isInteger(courseId) || !Number.isInteger(chapId)) notFound()
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { slug: true } })
  if (!course) notFound()
  permanentRedirect(chapterUrl(course.slug, chapId))
}
