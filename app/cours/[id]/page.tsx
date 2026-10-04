import { prisma } from '@/lib/db'
import { mediaSrc } from '@/lib/media'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import { getDownloadUrl } from '@vercel/blob'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// ISR : aucune page pré-générée au build, chaque cours est rendu à la 1re visite
// puis servi depuis le cache et régénéré au plus toutes les heures.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

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

  // Pas de try/catch → notFound() : avec l'ISR, une erreur BDD passagère serait sinon
  // mise en cache comme un « 404 » pendant 1 h sur un cours qui existe.
  const course = await prisma.course.findUnique({
    where: { id: courseId },
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
                  // Seule image visible dès l'arrivée sur la page : chargée en priorité.
                  <Image
                    src={mediaSrc('courses', course.logo)}
                    alt={course.title}
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
                {course.supportUrl && (
                  <a href={getDownloadUrl(course.supportUrl)} className="btn btn-ghost btn-support" style={{ whiteSpace: 'nowrap' }}>
                    ⬇ Support de cours
                  </a>
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
                groups.map((group, i) => (
                  <div key={i} style={{ marginBottom: 32 }}>
                    {group.part && (
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--purple-l)',
                        textTransform: 'uppercase', letterSpacing: 1.5,
                        marginBottom: 12, paddingLeft: 4,
                      }}>
                        {group.part}
                      </div>
                    )}
                    {group.chapters.map((ch) => (
                      <ChapterRow key={ch.id} chapter={ch} position={position.get(ch.id)!} courseId={course.id} />
                    ))}
                  </div>
                ))
              ) : (
                course.chapters.map((ch) => (
                  <ChapterRow key={ch.id} chapter={ch} position={position.get(ch.id)!} courseId={course.id} />
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

function ChapterRow({ chapter, position, courseId }: {
  chapter: { id: number; title: string; duration: string | null; free: boolean; type: string | null }
  position: number
  courseId: number
}) {
  return (
    <Link href={`/cours/${courseId}/chapitre/${chapter.id}`} className="chapter-item">
      <div className="chapter-num">{position}</div>
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
