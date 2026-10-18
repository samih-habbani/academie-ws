import { prisma } from '@/lib/db'
import Nav from '@/components/Nav'
import StarCanvas from '@/components/StarCanvas'
import VideoGate from '@/components/VideoGate'
import { ProgressProvider } from '@/components/progress/ProgressProvider'
import ChapterStatus from '@/components/progress/ChapterStatus'
import { SidebarBar, SidebarCount } from '@/components/progress/ProgressSummary'
import { supportDownloadUrl } from '@/lib/support-download'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { chapterUrl, courseUrl } from '@/lib/urls'
import { hasLang, localizePath, type Lang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import { loadTranslations } from '@/lib/i18n/content'
import { alternatesFor } from '@/lib/i18n/metadata'
import { getYoutubeEmbedUrl } from '@/lib/youtube'

// ISR : rendu à la 1re visite puis servi depuis le cache, régénéré au plus toutes les heures.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ lang: string; slug: string; chapterId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug, chapterId } = await params
  return hasLang(lang) ? { alternates: alternatesFor(lang, `/course/${slug}/chapter/${chapterId}`) } : {}
}

export default async function ChapterPage({ params }: Props) {
  const { lang: rawLang, slug, chapterId } = await params
  if (!hasLang(rawLang)) notFound()
  const lang: Lang = rawLang
  const t = getDict(lang)
  const chapId = parseInt(chapterId)
  if (isNaN(chapId)) notFound()

  // Pas de try/catch → notFound() : une erreur BDD passagère ne doit pas être mise en cache comme un 404.
  const [course, chapter] = await Promise.all([
    prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        chapters: {
          where: { available: true },
          // Ordre voulu = numOrder (unique dans le cours) ; il détermine aussi « suivant / précédent ».
          orderBy: [{ numOrder: 'asc' }, { id: 'asc' }],
        },
      },
    }),
    prisma.chapter.findUnique({ where: { id: chapId } }),
  ])

  // Le chapitre doit appartenir au cours de l'URL.
  if (!course || !chapter || chapter.courseId !== course.id) notFound()

  // null si la valeur n'est pas une vraie référence YouTube (ancien bloc Vimeo, vide…) → « Vidéo non disponible ».
  const embedUrl = chapter.urlVideo ? getYoutubeEmbedUrl(chapter.urlVideo) : null

  const tr = await loadTranslations(lang, {
    course: [course.id],
    category: [course.categoryId],
    chapter: course.chapters.map((c) => c.id),
  })
  const courseTitle = tr('course', course.id, 'title', course.title)
  const chapterTitle = tr('chapter', chapter.id, 'title', chapter.title)
  const categoryTitle = course.category ? tr('category', course.category.id, 'title', course.category.title) : null

  const supportUrl = supportDownloadUrl(course.supportUrl)

  const allChapters = course.chapters
  const currentIdx = allChapters.findIndex(c => c.id === chapId)
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />

      <div className="site-content" style={{ minHeight: '100vh' }}>
        <Nav />

        <ProgressProvider courseId={course.id} chapterIds={allChapters.map((c) => c.id)}>
        <div className="lecture-layout">

          {/* MAIN: VIDEO + INFO */}
          <main className="lecture-main">
            {/* Breadcrumb */}
            <div style={{
              padding: '10px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: 'var(--text-d)',
              background: 'rgba(4,3,13,.6)', backdropFilter: 'blur(8px)',
            }}>
              <Link href={localizePath(lang, '/')} style={{ color: 'var(--text-d)', textDecoration: 'none' }}>{t.common.home}</Link>
              <span>›</span>
              <Link href={courseUrl(course.slug, lang)} style={{ color: 'var(--text-m)', textDecoration: 'none' }}>{courseTitle}</Link>
              <span>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{chapterTitle}</span>
            </div>

            {/* YouTube */}
            <div className="video-wrapper">
              {embedUrl ? (
                // L'adresse de la vidéo n'est pas dans le HTML : VideoGate la demande à l'API (membres uniquement).
                <VideoGate chapterId={chapter.id} title={chapterTitle} />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(124,58,237,.05)',
                  flexDirection: 'column', gap: 12,
                }}>
                  <span style={{ fontSize: 48, opacity: .4 }}>🎬</span>
                  <p style={{ color: 'var(--text-d)', fontSize: 14 }}>{t.chapter.noVideo}</p>
                </div>
              )}
            </div>

            {/* Chapter info */}
            <div className="lecture-info">
              <h1 className="lecture-title">{chapterTitle}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {categoryTitle && <span className="tag tag-purple">{categoryTitle}</span>}
                {chapter.type && (
                  <span className={`tag ${chapter.type === 'exo' ? 'tag-amber' : chapter.type === 'tp' ? 'tag-cyan' : chapter.type === 'quiz' ? 'tag-purple' : 'tag-green'}`}>
                    {(t.course.type as Record<string, string>)[chapter.type] ?? chapter.type}
                  </span>
                )}
                {chapter.duration && (
                  <span className="tag" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--text-m)' }}>
                    ⏱ {chapter.duration}
                  </span>
                )}
                {chapter.free && <span className="tag tag-green">{t.common.free}</span>}
              </div>

              <div className="lecture-actions">
                {nextChapter && (
                  <Link href={chapterUrl(course.slug, nextChapter.id, lang)} className="btn btn-primary">
                    {t.chapter.next}
                  </Link>
                )}
                <Link href={courseUrl(course.slug, lang)} className="btn btn-ghost">
                  {t.chapter.syllabus}
                </Link>
                {supportUrl && (
                  <a href={supportUrl} className="btn btn-ghost btn-support">
                    {t.course.support}
                  </a>
                )}
                {prevChapter && (
                  <Link href={chapterUrl(course.slug, prevChapter.id, lang)} className="btn btn-ghost">
                    {t.chapter.prev}
                  </Link>
                )}
              </div>
            </div>
          </main>

          {/* SIDEBAR: CHAPTERS */}
          <aside className="lecture-sidebar">
            <div className="sidebar-header">
              <h2>{t.chapter.sidebarTitle}</h2>
              <SidebarCount />
            </div>

            <SidebarBar fallbackPercent={Math.round(((currentIdx + 1) / allChapters.length) * 100)} />

            <div className="sidebar-list">
              {allChapters.map((ch, idx) => {
                const isCurrent = ch.id === chapId
                return (
                  <Link
                    key={ch.id}
                    href={chapterUrl(course.slug, ch.id, lang)}
                    className={`chapter-item ${isCurrent ? 'is-active' : ''}`}
                    style={{ marginBottom: 6 }}
                  >
                    <div className={`chapter-num ${isCurrent ? 'playing' : ''}`}>
                      {isCurrent ? '▶' : idx + 1}
                    </div>
                    <div className="chapter-info">
                      <div className="chapter-name" style={{ fontSize: 13 }}>{tr('chapter', ch.id, 'title', ch.title)}</div>
                      {ch.duration && <div className="chapter-dur">{ch.duration}</div>}
                    </div>
                    <ChapterStatus chapterId={ch.id} />
                  </Link>
                )
              })}
            </div>
          </aside>

        </div>
        </ProgressProvider>
      </div>
    </>
  )
}
