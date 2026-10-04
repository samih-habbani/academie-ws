import Image from 'next/image'
import { prisma } from '@/lib/db'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import CourseCard from '@/components/CourseCard'
import ThemeCard from '@/components/ThemeCard'

// Page statique régénérée toutes les heures (ISR) au lieu d'une requête BDD par visite.
export const revalidate = 3600

type CategoryWithCourses = Awaited<ReturnType<typeof fetchData>>['categories']
type CourseItem = CategoryWithCourses[number]['courses'][number]
type ThemeOfCourse = NonNullable<CourseItem['theme']>

type GridEntry =
  | { kind: 'course'; date: Date; course: CourseItem }
  | { kind: 'theme'; date: Date; theme: ThemeOfCourse; courses: CourseItem[] }

function groupByTheme(courses: CourseItem[]): GridEntry[] {
  const themeGroups = new Map<number, { theme: ThemeOfCourse; courses: CourseItem[] }>()
  const entries: GridEntry[] = []

  for (const course of courses) {
    if (course.theme) {
      const group = themeGroups.get(course.theme.id)
      if (group) {
        group.courses.push(course)
      } else {
        themeGroups.set(course.theme.id, { theme: course.theme, courses: [course] })
      }
    } else {
      entries.push({ kind: 'course', date: course.date, course })
    }
  }

  for (const { theme, courses: themeCourses } of themeGroups.values()) {
    const mostRecentDate = themeCourses.reduce((max, c) => (c.date > max ? c.date : max), themeCourses[0].date)
    entries.push({ kind: 'theme', date: mostRecentDate, theme, courses: themeCourses })
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
}

async function fetchData() {
  const [categories, totalCourses] = await Promise.all([
    prisma.category.findMany({
      orderBy: { orderCategory: 'asc' },
      include: {
        courses: {
          where: { available: true },
          orderBy: { date: 'desc' },
          select: {
            id: true,
            title: true,
            logo: true,
            description: true,
            date: true,
            duration: true,
            difficulty: true,
            chapterCount: true,
            theme: { select: { id: true, title: true, description: true, img: true } },
          },
        },
      },
    }),
    prisma.course.count({ where: { available: true } }),
  ])
  return { categories, totalCourses }
}

export default async function HomePage() {
  // Pas de try/catch volontaire : avec l'ISR, une erreur BDD avalée ici serait mise en cache
  // (« 0 formation » pendant 1 h). En laissant l'erreur remonter, Next garde la dernière
  // version valide de la page.
  const { categories, totalCourses } = await fetchData()

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="nebula nebula-3" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />

      <div className="site-content">
        <Nav />

        <main style={{ flex: 1 }}>

          {/* HERO */}
          <section className="hero-section">
            <div className="container">
              <div className="hero-rocket">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="58" fill="rgba(124,58,237,0.08)" stroke="rgba(124,58,237,0.2)" strokeWidth="1"/>
                  <path d="M60 18 C52 28 48 44 48 60 L54 60 L54 72 C54 75 56.7 77 60 77 C63.3 77 66 75 66 72 L66 60 L72 60 C72 44 68 28 60 18Z" fill="white" opacity=".95"/>
                  <path d="M48 62 L38 82 L54 74Z" fill="rgba(167,139,250,.7)"/>
                  <path d="M72 62 L82 82 L66 74Z" fill="rgba(167,139,250,.7)"/>
                  <circle cx="60" cy="58" r="8" fill="#22D3EE" opacity=".9"/>
                  <ellipse cx="60" cy="78" rx="10" ry="14" fill="rgba(245,158,11,.8)"/>
                  <ellipse cx="60" cy="75" rx="6" ry="9" fill="rgba(253,224,71,.9)"/>
                  <circle cx="60" cy="58" r="4" fill="white" opacity=".6"/>
                </svg>
              </div>
              <h1 className="hero-title">
                Propulsez vos<br />compétences
              </h1>
              <p className="hero-sub">
                Des formations vidéo haut de gamme en développement web, design et digital.
                Apprenez à votre rythme avec un contenu ultra-pratique.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="#formations" className="btn btn-primary" style={{ fontSize: 16, padding: '12px 28px' }}>
                  <span>🚀</span> Découvrir les formations
                </a>
                <a href="#about" className="btn btn-ghost" style={{ fontSize: 16, padding: '12px 28px' }}>
                  En savoir plus
                </a>
              </div>

              <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 800, color: 'var(--purple-l)' }}>{totalCourses}+</div>
                  <div style={{ fontSize: 13, color: 'var(--text-d)', marginTop: 4 }}>Formations</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 800, color: 'var(--cyan)' }}>{categories.length}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-d)', marginTop: 4 }}>Catégories</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 800, color: 'var(--amber)' }}>HD</div>
                  <div style={{ fontSize: 13, color: 'var(--text-d)', marginTop: 4 }}>Qualité vidéo</div>
                </div>
              </div>
            </div>
          </section>

          {/* PRÉSENTATION */}
          <section id="about" style={{ padding: '0 0 80px' }}>
            <div className="container">
              <div className="about-grid" style={{
                gap: 0,
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 24,
                background: 'linear-gradient(145deg,rgba(4,3,13,.95),rgba(10,8,24,.98))',
                overflow: 'hidden',
              }}>

                {/* PHOTO */}
                <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, alignSelf: 'stretch', minHeight: 500 }}>
                  {/* Sous la ligne de flottaison : chargement différé (lazy) par défaut, pas de preload. */}
                  <Image
                    src="/samih.webp"
                    alt="Samih Habbani"
                    width={1122}
                    height={1402}
                    sizes="(max-width: 700px) 100vw, 420px"
                    quality={75}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      display: 'block',
                    }}
                  />

                  {/* gradient overlay droite + bas */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, transparent 50%, rgba(4,3,13,.9) 100%), linear-gradient(to top, rgba(4,3,13,.6) 0%, transparent 30%)',
                  }} />

                  {/* COCKPIT OVERLAY */}
                  {/* scanlines */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,211,238,.04) 3px, rgba(34,211,238,.04) 4px)',
                  }} />

                  {/* coins cockpit — haut gauche */}
                  <svg style={{ position: 'absolute', top: 16, left: 16 }} width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M0 24 L0 0 L24 0" stroke="#22D3EE" strokeWidth="1.5" strokeOpacity=".7"/>
                    <circle cx="0" cy="0" r="3" fill="#22D3EE" fillOpacity=".5"/>
                  </svg>
                  {/* coin haut droit */}
                  <svg style={{ position: 'absolute', top: 16, right: 16 }} width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M40 24 L40 0 L16 0" stroke="#22D3EE" strokeWidth="1.5" strokeOpacity=".7"/>
                    <circle cx="40" cy="0" r="3" fill="#22D3EE" fillOpacity=".5"/>
                  </svg>
                  {/* coin bas gauche */}
                  <svg style={{ position: 'absolute', bottom: 80, left: 16 }} width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M0 16 L0 40 L24 40" stroke="#A78BFA" strokeWidth="1.5" strokeOpacity=".6"/>
                    <circle cx="0" cy="40" r="3" fill="#A78BFA" fillOpacity=".5"/>
                  </svg>
                  {/* coin bas droit */}
                  <svg style={{ position: 'absolute', bottom: 80, right: 16 }} width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M40 16 L40 40 L16 40" stroke="#A78BFA" strokeWidth="1.5" strokeOpacity=".6"/>
                    <circle cx="40" cy="40" r="3" fill="#A78BFA" fillOpacity=".5"/>
                  </svg>

                  {/* ligne de visée horizontale */}
                  <div style={{
                    position: 'absolute', top: '38%', left: 12, right: 12, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.25) 30%, rgba(34,211,238,.25) 70%, transparent)',
                    pointerEvents: 'none',
                  }} />

                  {/* barre instruments bas */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 72,
                    background: 'linear-gradient(to top, rgba(4,3,13,.95), transparent)',
                    borderTop: '1px solid rgba(34,211,238,.12)',
                    display: 'flex', alignItems: 'flex-end', padding: '0 16px 14px',
                    gap: 16,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {[['ID', 'SAMIH_HABBANI'], ['RÔLE', 'FORMATEUR']].map(([k, v]) => (
                        <span key={k} style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: 'rgba(255,255,255,.45)', letterSpacing: 1 }}>
                          <span style={{ color: '#A78BFA' }}>{k}</span> · {v}
                        </span>
                      ))}
                      <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#10B981', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                        EN LIGNE
                      </span>
                    </div>
                    {/* mini jauge */}
                    <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      {[['SYS', '#22D3EE', 92], ['PWR', '#A78BFA', 100]].map(([label, color, pct]) => (
                        <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'Courier New, monospace', fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: 1 }}>{label}</span>
                          <div style={{ width: 48, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color as string, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CONTENU */}
                <div style={{ padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {/* terminal */}
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 13, color: '#10B981', marginBottom: 24, letterSpacing: '.5px' }}>
                    &gt; samih@academie:~$ ./init --profile
                  </div>

                  {/* nom */}
                  <h2 style={{
                    fontFamily: 'var(--f-display)',
                    fontSize: 'clamp(40px,4vw,60px)',
                    fontWeight: 800,
                    lineHeight: 0.95,
                    letterSpacing: -2,
                    color: '#F1F0FF',
                    marginBottom: 20,
                  }}>
                    SAMIH<br />HABBANI
                  </h2>

                  {/* rôles */}
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                    {['Full Stack Developer', 'Formateur Digital & Web', 'Créateur de contenu'].map(r => (
                      <li key={r} style={{ fontFamily: 'Courier New, monospace', fontSize: 13, color: '#A09DC0', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#A78BFA', fontSize: 18 }}>·</span> {r}
                      </li>
                    ))}
                  </ul>

                  {/* divider */}
                  <div style={{ width: 48, height: 2, background: 'linear-gradient(90deg,#7C3AED,#22D3EE)', borderRadius: 2, marginBottom: 24 }} />

                  {/* bio */}
                  <p style={{ fontSize: 15, color: '#A09DC0', lineHeight: 1.8, maxWidth: 460 }}>
                    Ma passion ? Rendre l&apos;apprentissage du développement web <strong style={{ color: '#F1F0FF' }}>accessible à tous</strong>.
                    Je conçois des formations vidéo claires, directes et applicables immédiatement en entreprise — du HTML au back-end, en passant par le design et le digital.
                  </p>
                  <p style={{ fontSize: 15, color: '#A09DC0', lineHeight: 1.8, maxWidth: 460, marginTop: 12 }}>
                    L&apos;Académie WS est ma façon de partager ce que j&apos;aurais voulu trouver quand j&apos;apprenais.
                    Tout est <strong style={{ color: '#10B981' }}>gratuit</strong>, sans barrière, sans inscription.
                  </p>

                  {/* socials */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
                    <a href="https://samihhabbani.com" target="_blank" rel="noopener noreferrer" className="social-pill social-pill-purple">Portfolio</a>
                    <a href="https://linkedin.com/in/samihhabbani" target="_blank" rel="noopener noreferrer" className="social-pill social-pill-blue">LinkedIn</a>
                    <a href="https://github.com/samihhabbani" target="_blank" rel="noopener noreferrer" className="social-pill social-pill-white">GitHub</a>
                    <a href="https://youtube.com/@samihhabbani" target="_blank" rel="noopener noreferrer" className="social-pill social-pill-red">YouTube</a>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* FORMATIONS PAR CATÉGORIE */}
          <section id="formations" style={{ padding: '64px 0' }}>
            <div className="container">
              {categories.filter(c => c.courses.length > 0).map((cat) => (
                <div key={cat.id} style={{ marginBottom: 64 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'rgba(124,58,237,.15)',
                      border: '1px solid rgba(124,58,237,.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {cat.logo ? (
                        <Image
                          src={`/uploads/images/categories/${cat.logo}`}
                          alt=""
                          width={28}
                          height={28}
                          quality={70}
                          style={{ width: 28, height: 28, objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: 20 }}>📚</span>
                      )}
                    </div>
                    <div>
                      <h2 className="section-title" style={{ marginBottom: 2 }}>{cat.title}</h2>
                      {cat.description && (
                        <p style={{ fontSize: 14, color: 'var(--text-d)' }}>{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="courses-grid">
                    {groupByTheme(cat.courses).map((entry) =>
                      entry.kind === 'theme' ? (
                        <ThemeCard
                          key={`theme-${entry.theme.id}`}
                          theme={{
                            id: entry.theme.id,
                            title: entry.theme.title,
                            description: entry.theme.description,
                            img: entry.theme.img,
                            courseCount: entry.courses.length,
                          }}
                        />
                      ) : (
                        <CourseCard key={entry.course.id} course={entry.course} />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>


        </main>

        <Footer />
      </div>
    </>
  )
}
