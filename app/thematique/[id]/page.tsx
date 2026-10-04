import { prisma } from '@/lib/db'
import { mediaSrc } from '@/lib/media'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import CourseCard from '@/components/CourseCard'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// ISR : rendu à la 1re visite puis servi depuis le cache, régénéré au plus toutes les heures.
export const revalidate = 3600
export async function generateStaticParams() {
  return []
}

export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const themeId = parseInt(id)
  if (isNaN(themeId)) notFound()

  // Pas de try/catch → notFound() : une erreur BDD passagère ne doit pas être mise en cache comme un 404.
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    include: {
      category: { select: { id: true, title: true } },
      courses: {
        where: { available: true },
        orderBy: { date: 'desc' },
        select: {
          id: true,
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
              {theme.category && (
                <span style={{ color: 'var(--text-m)' }}>{theme.category.title}</span>
              )}
              <span style={{ fontSize: 12 }}>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{theme.title}</span>
            </div>

            {/* THEME HEADER */}
            <div className="course-header-pg">
              <div className="course-thumb-lg">
                {theme.img ? (
                  // Image d'en-tête visible dès l'arrivée : chargée en priorité (les cartes restent lazy).
                  <Image
                    src={mediaSrc('themes', theme.img)}
                    alt={theme.title}
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
                  {theme.category && <span className="tag tag-purple">{theme.category.title}</span>}
                  <span className="tag tag-cyan">{theme.courses.length} cours</span>
                </div>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
                  {theme.title}
                </h1>
                {theme.description && (
                  <p style={{ color: 'var(--text-m)', fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>{theme.description}</p>
                )}
              </div>
            </div>

            {/* COURSES */}
            <div style={{ paddingBottom: 64 }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                📋 Cours de la thématique
              </h2>

              <div className="courses-grid">
                {theme.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
