import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { themeUrl } from '@/lib/urls'

// Ancienne URL /thematique/<id> : redirection permanente (308) vers /theme/<slug>.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export default async function LegacyThemePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const theme = await prisma.theme.findUnique({ where: { id }, select: { slug: true } })
  if (!theme) notFound()
  permanentRedirect(themeUrl(theme.slug))
}
