import { prisma } from '@/lib/db'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
}

const TYPE_LABELS: Record<string, string> = {
  cours: 'Cours',
  exo: 'Exercice',
  tp: 'TP',
  quiz: 'Quiz',
}

const TYPE_COLORS: Record<string, string> = {
  cours: 'tag-green',
  exo: 'tag-amber',
  tp: 'tag-cyan',
  quiz: 'tag-purple',
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const courseId = parseInt(id)
  if (isNaN(courseId)) notFound()

  let course
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        theme: true,
        chapters: {
          where: { available: true },
          orderBy: [{ chapterPart: 'asc' }, { numOrder: 'asc' }],
        },
      },
    })
  } catch {
    notFound()
  }

  if (!course) notFound()

  const parts = [...new Set(course.chapters.map(c => c.chapterPart).filter(Boolean))]
  const hasParts = parts.length > 1

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
              <Link href="/">Accueil</Link>
              <span style={{ fontSize: 12 }}>›</span>
              {course.category && <span style={{ color: 'var(--text-m)' }}>{course.category.title}</span>}
              <span style={{ fontSize: 12 }}>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{course.title}</span>
            </div>

            {/* COURSE HEADER */}
            <div className="course-header-pg">
              <div className="course-thumb-lg">
                {course.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/uploads/images/courses/${course.logo}`} alt={course.title} />
                ) : (
                  <span style={{ fontSize: 40, opacity: .4 }}>🎬</span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {course.category && <span className="tag tag-purple">{course.category.title}</span>}
                  {course.theme && <span className="tag tag-cyan">{course.theme.title}</span>}
                  {course.difficulty && (
                    <span className="tag tag-amber">{DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}</span>
                  )}
                </div>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
                  {course.title}
                </h1>
                {course.description && (
                  <p style={{ color: 'var(--text-m)', fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>{course.description}</p>
                )}
                <div className="course-meta-row">
                  <div className="meta-item">▶ <strong>{course.chapters.length}</strong> chapitres</div>
                  {course.duration && <div className="meta-item">⏱ <strong>{course.duration}</strong></div>}
                  {course.date && (
                    <div className="meta-item">📅 {new Date(course.date).toLocaleDateString('fr-FR')}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                {course.chapters.length > 0 && (
                  <Link href={`/cours/${course.id}/chapitre/${course.chapters[0].id}`} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    🚀 Commencer
                  </Link>
                )}
                <span className="tag tag-green" style={{ fontSize: 13 }}>✓ Accès gratuit</span>
              </div>
            </div>

            {/* CHAPTERS */}
            <div style={{ paddingBottom: 64 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                📋 Programme du cours
              </h2>

              {hasParts ? (
                parts.map(part => (
                  <div key={part} style={{ marginBottom: 32 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: 'var(--purple-l)',
                      textTransform: 'uppercase', letterSpacing: 1.5,
                      marginBottom: 12, paddingLeft: 4,
                    }}>
                      {part}
                    </div>
                    {course.chapters.filter(c => c.chapterPart === part).map((ch) => (
                      <ChapterRow key={ch.id} chapter={ch} courseId={course.id} />
                    ))}
                  </div>
                ))
              ) : (
                course.chapters.map((ch) => (
                  <ChapterRow key={ch.id} chapter={ch} courseId={course.id} />
                ))
              )}
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

function ChapterRow({ chapter, courseId }: {
  chapter: { id: number; title: string; duration: string | null; numOrder: number | null; free: boolean; type: string | null }
  courseId: number
}) {
  return (
    <Link href={`/cours/${courseId}/chapitre/${chapter.id}`} className="chapter-item">
      <div className="chapter-num">{chapter.numOrder ?? '—'}</div>
      <div className="chapter-info">
        <div className="chapter-name">{chapter.title}</div>
<div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {chapter.type && (
            <span className={`tag ${TYPE_COLORS[chapter.type] ?? 'tag-purple'}`} style={{ fontSize: 11 }}>
              {TYPE_LABELS[chapter.type] ?? chapter.type}
            </span>
          )}
        </div>
      </div>
      {chapter.duration && (
        <div style={{ fontSize: 12, color: 'var(--text-d)', flexShrink: 0 }}>{chapter.duration}</div>
      )}
    </Link>
  )
}
