import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { courseUrl } from '@/lib/urls'

// Ancienne URL /cours/<id> : redirection permanente (308) vers /course/<slug>.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export default async function LegacyCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const course = await prisma.course.findUnique({ where: { id }, select: { slug: true } })
  if (!course) notFound()
  permanentRedirect(courseUrl(course.slug))
}
