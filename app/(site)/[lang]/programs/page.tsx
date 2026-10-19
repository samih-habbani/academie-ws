import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import ProgramBrowser, { type BrowserProgram } from '@/components/ProgramBrowser'
import { prisma } from '@/lib/db'
import { hasLang, localizePath } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import { alternatesFor } from '@/lib/i18n/metadata'
import { loadTextTranslations } from '@/lib/i18n/content'
import Link from 'next/link'

export const revalidate = 3600

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!hasLang(lang)) return {}
  const t = getDict(lang)
  return { title: `${t.programs.title} — Académie WS`, description: t.programs.lead, alternates: alternatesFor(lang, '/programs') }
}

export default async function ProgramsPage({ params }: Props) {
  const { lang } = await params
  if (!hasLang(lang)) notFound()
  const t = getDict(lang)

  const rows = await prisma.program.findMany({
    where: { status: 'published' },
    orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    include: { modules: { select: { hours: true } }, tools: { select: { name: true }, orderBy: { name: 'asc' } }, certifications: { select: { id: true } } },
  })
  const tx = await loadTextTranslations(lang, rows.flatMap((r) => [r.title, r.tagline]))
  const programs: BrowserProgram[] = rows.map((r) => ({
    id: r.id, slug: r.slug, title: tx(r.title), tagline: tx(r.tagline), domain: r.domain, level: r.level, coverImage: r.coverImage, coverHeadline: r.coverHeadline, tools: r.tools.map((t) => t.name), certified: r.certifications.length > 0,
    hours: r.modules.reduce((s, m) => s + m.hours, 0), hoursPerDay: r.hoursPerDay, modules: r.modules.length, formats: r.formats,
  }))

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <div className="site-content">
        <Nav />
        <main style={{ flex: 1 }}>
          <div className="container" style={{ paddingBottom: 72 }}>
            <div className="breadcrumb" style={{ paddingTop: 32 }}>
              <Link href={localizePath(lang, '/')}>{t.common.home}</Link>
              <span style={{ fontSize: 12 }}>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{t.programs.navTitle}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, marginBottom: 12 }}>{t.programs.title}</h1>
            <p style={{ color: 'var(--text-m)', maxWidth: 720, marginBottom: 36 }}>{t.programs.lead}</p>
            <ProgramBrowser programs={programs} />
          </div>
        </main>
        <Footer lang={lang} />
      </div>
    </>
  )
}
