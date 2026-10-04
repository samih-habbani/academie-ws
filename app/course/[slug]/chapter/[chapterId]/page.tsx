import { prisma } from '@/lib/db'
import Nav from '@/components/Nav'
import StarCanvas from '@/components/StarCanvas'
import { getDownloadUrl } from '@vercel/blob'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { chapterUrl, courseUrl } from '@/lib/urls'
import { getYoutubeEmbedUrl } from '@/lib/youtube'

// ISR : rendu à la 1re visite puis servi depuis le cache, régénéré au plus toutes les heures.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await params
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
              <Link href="/" style={{ color: 'var(--text-d)', textDecoration: 'none' }}>Accueil</Link>
              <span>›</span>
              <Link href={courseUrl(course.slug)} style={{ color: 'var(--text-m)', textDecoration: 'none' }}>{course.title}</Link>
              <span>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{chapter.title}</span>
            </div>

            {/* YouTube */}
            <div className="video-wrapper">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={chapter.title}
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(124,58,237,.05)',
                  flexDirection: 'column', gap: 12,
                }}>
                  <span style={{ fontSize: 48, opacity: .4 }}>🎬</span>
                  <p style={{ color: 'var(--text-d)', fontSize: 14 }}>Vidéo non disponible</p>
                </div>
              )}
            </div>

            {/* Chapter info */}
            <div className="lecture-info">
              <h1 className="lecture-title">{chapter.title}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {course.category && <span className="tag tag-purple">{course.category.title}</span>}
                {chapter.type && (
                  <span className={`tag ${chapter.type === 'exo' ? 'tag-amber' : chapter.type === 'tp' ? 'tag-cyan' : chapter.type === 'quiz' ? 'tag-purple' : 'tag-green'}`}>
                    {chapter.type === 'cours' ? 'Cours' : chapter.type === 'exo' ? 'Exercice' : chapter.type === 'tp' ? 'TP' : 'Quiz'}
                  </span>
                )}
                {chapter.duration && (
                  <span className="tag" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--text-m)' }}>
                    ⏱ {chapter.duration}
                  </span>
                )}
                {chapter.free && <span className="tag tag-green">Gratuit</span>}
              </div>

              <div className="lecture-actions">
                {nextChapter && (
                  <Link href={chapterUrl(course.slug, nextChapter.id)} className="btn btn-primary">
                    Chapitre suivant →
                  </Link>
                )}
                <Link href={courseUrl(course.slug)} className="btn btn-ghost">
                  ☰ Sommaire
                </Link>
                {course.supportUrl && (
                  <a href={getDownloadUrl(course.supportUrl)} className="btn btn-ghost btn-support">
                    ⬇ Support de cours
                  </a>
                )}
                {prevChapter && (
                  <Link href={chapterUrl(course.slug, prevChapter.id)} className="btn btn-ghost">
                    ← Précédent
                  </Link>
                )}
              </div>
            </div>
          </main>

          {/* SIDEBAR: CHAPTERS */}
          <aside className="lecture-sidebar">
            <div className="sidebar-header">
              <h2>Chapitres</h2>
              <span className="sidebar-progress">{allChapters.length} leçons</span>
            </div>

            <div style={{ height: 3, background: 'rgba(255,255,255,.05)' }}>
              <div style={{
                height: '100%',
                width: `${Math.round(((currentIdx + 1) / allChapters.length) * 100)}%`,
                background: 'linear-gradient(90deg,var(--purple),var(--cyan))',
                transition: 'width 1s ease',
              }} />
            </div>

            <div className="sidebar-list">
              {allChapters.map((ch, idx) => {
                const isCurrent = ch.id === chapId
                return (
                  <Link
                    key={ch.id}
                    href={chapterUrl(course.slug, ch.id)}
                    className={`chapter-item ${isCurrent ? 'is-active' : ''}`}
                    style={{ marginBottom: 6 }}
                  >
                    <div className={`chapter-num ${isCurrent ? 'playing' : ''}`}>
                      {isCurrent ? '▶' : idx + 1}
                    </div>
                    <div className="chapter-info">
                      <div className="chapter-name" style={{ fontSize: 13 }}>{ch.title}</div>
                      {ch.duration && <div className="chapter-dur">{ch.duration}</div>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </aside>

        </div>
      </div>
    </>
  )
}
