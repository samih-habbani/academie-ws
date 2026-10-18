import { prisma } from '@/lib/db'
import { mediaSrc } from '@/lib/media'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import CourseCard from '@/components/CourseCard'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLang, fmt, localizePath, type Lang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import { loadTranslations } from '@/lib/i18n/content'
import { alternatesFor } from '@/lib/i18n/metadata'

// ISR : rendu à la 1re visite puis servi depuis le cache, régénéré au plus toutes les heures.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  return hasLang(lang) ? { alternates: alternatesFor(lang, `/theme/${slug}`) } : {}
}

export default async function ThemePage({ params }: Props) {
  const { lang: rawLang, slug } = await params
  if (!hasLang(rawLang)) notFound()
  const lang: Lang = rawLang
  const t = getDict(lang)

  // Pas de try/catch → notFound() : une erreur BDD passagère ne doit pas être mise en cache comme un 404.
  const theme = await prisma.theme.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, title: true } },
      courses: {
        where: { available: true },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          logo: true,
          description: true,
          duration: true,
          difficulty: true,
          chapterCount: true,
        },
      },
    },
  })

  if (!theme) notFound()

  const tr = await loadTranslations(lang, {
    theme: [theme.id],
    category: [theme.category.id],
    course: theme.courses.map((c) => c.id),
  })
  const themeTitle = tr('theme', theme.id, 'title', theme.title)
  const themeDescription = tr('theme', theme.id, 'description', theme.description)
  const categoryTitle = theme.category ? tr('category', theme.category.id, 'title', theme.category.title) : null

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />

      <div className="site-content">
        <Nav />

        <main style={{ flex: 1 }}>
          <div className="container">

            {/* BREADCRUMB */}
            <div className="breadcrumb" style={{ paddingTop: 32 }}>
              <Link href={localizePath(lang, '/')}>{t.common.home}</Link>
              <span style={{ fontSize: 12 }}>›</span>
              {categoryTitle && (
                <span style={{ color: 'var(--text-m)' }}>{categoryTitle}</span>
              )}
              <span style={{ fontSize: 12 }}>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{themeTitle}</span>
            </div>

            {/* THEME HEADER */}
            <div className="course-header-pg">
              <div className="course-thumb-lg">
                {theme.img ? (
                  // Image d'en-tête visible dès l'arrivée : chargée en priorité (les cartes restent lazy).
                  <Image
                    src={mediaSrc('themes', theme.img)}
                    alt={themeTitle}
                    fill
                    sizes="(max-width: 700px) 100vw, 160px"
                    quality={70}
                    loading="eager"
                    fetchPriority="high"
                  />
                ) : (
                  <span style={{ fontSize: 40, opacity: .4 }}>🗂️</span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {categoryTitle && <span className="tag tag-purple">{categoryTitle}</span>}
                  <span className="tag tag-cyan">{fmt(t.theme.courseCount, { n: theme.courses.length })}</span>
                </div>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
                  {themeTitle}
                </h1>
                {themeDescription && (
                  <p style={{ color: 'var(--text-m)', fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>{themeDescription}</p>
                )}
              </div>
            </div>

            {/* COURSES */}
            <div style={{ paddingBottom: 64 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                {t.theme.coursesOfTheme}
              </h2>

              <div className="courses-grid">
                {theme.courses.map((course) => (
                  <CourseCard key={course.id} course={{ ...course, title: tr('course', course.id, 'title', course.title), description: tr('course', course.id, 'description', course.description) }} lang={lang} />
                ))}
              </div>
            </div>

          </div>
        </main>

        <Footer lang={lang} />
      </div>
    </>
  )
}
