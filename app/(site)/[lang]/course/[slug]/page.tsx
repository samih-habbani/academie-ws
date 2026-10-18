import { prisma } from '@/lib/db'
import { mediaSrc } from '@/lib/media'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import { supportDownloadUrl } from '@/lib/support-download'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { chapterUrl } from '@/lib/urls'
import { hasLang, localizePath, INTL_LOCALE, type Lang } from '@/lib/i18n/config'
import { getDict, type Dict } from '@/lib/i18n/dictionaries'
import { loadTranslations, type Translate } from '@/lib/i18n/content'
import { alternatesFor } from '@/lib/i18n/metadata'
import { ProgressProvider } from '@/components/progress/ProgressProvider'
import ChapterStatus from '@/components/progress/ChapterStatus'
import { CourseProgressBar } from '@/components/progress/ProgressSummary'

// ISR : aucune page pré-générée au build, chaque cours est rendu à la 1re visite
// puis servi depuis le cache et régénéré au plus toutes les heures.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

const TYPE_COLORS: Record<string, string> = {
  cours: 'tag-green',
  exo: 'tag-amber',
  tp: 'tag-cyan',
  quiz: 'tag-purple',
}

type Props = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  return hasLang(lang) ? { alternates: alternatesFor(lang, `/course/${slug}`) } : {}
}

export default async function CoursePage({ params }: Props) {
  const { lang: rawLang, slug } = await params
  if (!hasLang(rawLang)) notFound()
  const lang: Lang = rawLang
  const t = getDict(lang)

  // Pas de try/catch → notFound() : avec l'ISR, une erreur BDD passagère serait sinon
  // mise en cache comme un « 404 » pendant 1 h sur un cours qui existe.
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      theme: true,
      chapters: {
        where: { available: true },
        // numOrder est l'ordre voulu, unique dans le cours. Trier d'abord par chapterPart (texte)
        // mélangeait les parties dans l'ordre alphabétique.
        orderBy: [{ numOrder: 'asc' }, { id: 'asc' }],
      },
    },
  })

  if (!course) notFound()

  const tr = await loadTranslations(lang, {
    course: [course.id],
    category: [course.categoryId],
    theme: course.themeId ? [course.themeId] : [],
    chapter: course.chapters.map((c) => c.id),
  })
  const courseTitle = tr('course', course.id, 'title', course.title)
  const courseDescription = tr('course', course.id, 'description', course.description)
  const categoryTitle = course.category ? tr('category', course.category.id, 'title', course.category.title) : null
  const themeTitle = course.theme ? tr('theme', course.theme.id, 'title', course.theme.title) : null

  const supportUrl = supportDownloadUrl(course.supportUrl)
  const hasParts = new Set(course.chapters.map(c => c.chapterPart).filter(Boolean)).size > 1

  // Blocs de chapitres consécutifs d'une même partie, dans l'ordre de numOrder (un chapitre sans
  // partie reste à sa place, et une partie interrompue par un autre chapitre est affichée en 2 blocs).
  const groups: { part: string | null; chapters: typeof course.chapters }[] = []
  for (const ch of course.chapters) {
    const part = ch.chapterPart ?? null
    const last = groups[groups.length - 1]
    if (last && last.part === part) last.chapters.push(ch)
    else groups.push({ part, chapters: [ch] })
  }
  // Numéro affiché = position dans le cours (1, 2, 3…), pas la valeur brute de numOrder
  // (qui peut commencer à 8 quand des chapitres sont masqués).
  const position = new Map(course.chapters.map((ch, i) => [ch.id, i + 1]))

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />

      <div className="site-content">
        <Nav />

        <main style={{ flex: 1 }}>
          <ProgressProvider courseId={course.id} chapterIds={course.chapters.map((c) => c.id)}>
          <div className="container">

            {/* BREADCRUMB */}
            <div className="breadcrumb" style={{ paddingTop: 32 }}>
              <Link href={localizePath(lang, '/')}>{t.common.home}</Link>
              <span style={{ fontSize: 12 }}>›</span>
              {categoryTitle && <span style={{ color: 'var(--text-m)' }}>{categoryTitle}</span>}
              <span style={{ fontSize: 12 }}>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{courseTitle}</span>
            </div>

            {/* COURSE HEADER */}
            <div className="course-header-pg">
              <div className="course-thumb-lg">
                {course.logo ? (
                  // Seule image visible dès l'arrivée sur la page : chargée en priorité.
                  <Image
                    src={mediaSrc('courses', course.logo)}
                    alt={courseTitle}
                    fill
                    sizes="(max-width: 700px) 100vw, 160px"
                    quality={70}
                    loading="eager"
                    fetchPriority="high"
                  />
                ) : (
                  <span style={{ fontSize: 40, opacity: .4 }}>🎬</span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {categoryTitle && <span className="tag tag-purple">{categoryTitle}</span>}
                  {themeTitle && <span className="tag tag-cyan">{themeTitle}</span>}
                  {course.difficulty && (
                    <span className="tag tag-amber">{t.course.difficulty[course.difficulty] ?? course.difficulty}</span>
                  )}
                </div>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
                  {courseTitle}
                </h1>
                {courseDescription && (
                  <p style={{ color: 'var(--text-m)', fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>{courseDescription}</p>
                )}
                <div className="course-meta-row">
                  <div className="meta-item">▶ <strong>{course.chapters.length}</strong> {(course.chapters.length === 1 ? t.course.chapters_one : t.course.chapters_other).replace('{n}', '').trim()}</div>
                  {course.duration && <div className="meta-item">⏱ <strong>{course.duration}</strong></div>}
                  {course.date && (
                    <div className="meta-item">📅 {new Date(course.date).toLocaleDateString(INTL_LOCALE[lang])}</div>
                  )}
                </div>
                <CourseProgressBar />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                {course.chapters.length > 0 && (
                  <Link href={chapterUrl(course.slug, course.chapters[0].id, lang)} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    {t.course.start}
                  </Link>
                )}
                {supportUrl && (
                  <a href={supportUrl} className="btn btn-ghost btn-support" style={{ whiteSpace: 'nowrap' }}>
                    {t.course.support}
                  </a>
                )}
                <span className="tag tag-green" style={{ fontSize: 13 }}>{t.course.freeAccess}</span>
              </div>
            </div>

            {/* CHAPTERS */}
            {course.chapters.length === 0 ? (
              <div className="coming-soon" role="status">
                <span aria-hidden="true">🎬</span>
                <p>{t.course.comingSoon}</p>
              </div>
            ) : (
            <div style={{ paddingBottom: 64 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                {t.course.syllabus}
              </h2>

              {hasParts ? (
                groups.map((group, i) => (
                  <div key={i} style={{ marginBottom: 32 }}>
                    {group.part && (
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--purple-l)',
                        textTransform: 'uppercase', letterSpacing: 1.5,
                        marginBottom: 12, paddingLeft: 4,
                      }}>
                        {tr('chapter', group.chapters[0].id, 'chapterPart', group.part)}
                      </div>
                    )}
                    {group.chapters.map((ch) => (
                      <ChapterRow key={ch.id} chapter={ch} position={position.get(ch.id)!} courseSlug={course.slug} lang={lang} t={t} tr={tr} />
                    ))}
                  </div>
                ))
              ) : (
                course.chapters.map((ch) => (
                  <ChapterRow key={ch.id} chapter={ch} position={position.get(ch.id)!} courseSlug={course.slug} lang={lang} t={t} tr={tr} />
                ))
              )}
            </div>
            )}

          </div>
          </ProgressProvider>
        </main>

        <Footer lang={lang} />
      </div>
    </>
  )
}

function ChapterRow({ chapter, position, courseSlug, lang, t, tr }: {
  chapter: { id: number; title: string; duration: string | null; free: boolean; type: string | null }
  position: number
  courseSlug: string
  lang: Lang
  t: Dict
  tr: Translate
}) {
  return (
    <Link href={chapterUrl(courseSlug, chapter.id, lang)} className="chapter-item">
      <div className="chapter-num">{position}</div>
      <div className="chapter-info">
        <div className="chapter-name">{tr('chapter', chapter.id, 'title', chapter.title)}</div>
<div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {chapter.type && (
            <span className={`tag ${TYPE_COLORS[chapter.type] ?? 'tag-purple'}`} style={{ fontSize: 11 }}>
              {(t.course.type as Record<string, string>)[chapter.type] ?? chapter.type}
            </span>
          )}
        </div>
      </div>
      {chapter.duration && (
        <div style={{ fontSize: 12, color: 'var(--text-d)', flexShrink: 0 }}>{chapter.duration}</div>
      )}
      <ChapterStatus chapterId={chapter.id} />
    </Link>
  )
}
