import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import ProgramView from '@/components/ProgramView'
import { prisma } from '@/lib/db'
import { getAdmin } from '@/lib/admin-auth'
import { hasLang } from '@/lib/i18n/config'
import { programInclude } from '@/lib/programs'

export const metadata: Metadata = { robots: { index: false, follow: false } }

type Props = { params: Promise<{ lang: string; id: string }> }

/** Aperçu d'un programme (brouillon ou publié) : réservé à l'administrateur connecté au back-office. */
export default async function ProgramPreviewPage({ params }: Props) {
  const { lang, id } = await params
  if (!hasLang(lang)) notFound()
  if (!(await getAdmin())) notFound()
  const programId = Number(id)
  if (!Number.isInteger(programId)) notFound()
  const program = await prisma.program.findUnique({ where: { id: programId }, include: programInclude })
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
          <div className="container"><ProgramView program={program} lang={lang} preview={program.status !== 'published'} /></div>
        </main>
        <Footer lang={lang} />
      </div>
    </>
  )
}
