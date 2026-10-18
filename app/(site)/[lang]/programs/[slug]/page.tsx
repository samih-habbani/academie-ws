import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import ProgramView from '@/components/ProgramView'
import { prisma } from '@/lib/db'
import { hasLang } from '@/lib/i18n/config'
import { alternatesFor } from '@/lib/i18n/metadata'
import { programInclude } from '@/lib/programs'

// ISR : régénérée au plus toutes les heures, et à chaque enregistrement depuis le back-office.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ lang: string; slug: string }> }

async function load(slug: string) {
  return prisma.program.findFirst({ where: { slug, status: 'published' }, include: programInclude })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  if (!hasLang(lang)) return {}
  const program = await load(slug)
  if (!program) return {}
  return {
    title: `${program.title} — Académie WS`,
    description: program.tagline || program.summary.slice(0, 160),
    alternates: alternatesFor(lang, `/programs/${slug}`),
  }
}

export default async function ProgramPage({ params }: Props) {
  const { lang, slug } = await params
  if (!hasLang(lang)) notFound()
  const program = await load(slug)
  if (!program) notFound()

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <div className="site-content">
        <Nav />
        <main style={{ flex: 1 }}>
          <div className="container"><ProgramView program={program} lang={lang} /></div>
        </main>
        <Footer lang={lang} />
      </div>
    </>
  )
}
