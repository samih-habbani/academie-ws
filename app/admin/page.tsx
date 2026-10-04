import Link from 'next/link'
import { getDownloadUrl } from '@vercel/blob'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { logout } from './actions'
import SupportUploader from './SupportUploader'

export default async function AdminPage() {
  const admin = await requireAdmin()

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      available: true,
      supportUrl: true,
      supportName: true,
      category: { select: { id: true, title: true } },
    },
    orderBy: [{ category: { orderCategory: 'asc' } }, { title: 'asc' }],
  })

  const groups: { category: string; courses: typeof courses }[] = []
  for (const course of courses) {
    const last = groups[groups.length - 1]
    if (last && last.category === course.category.title) last.courses.push(course)
    else groups.push({ category: course.category.title, courses: [course] })
  }

  const storageReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  const withSupport = courses.filter((c) => c.supportUrl).length

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
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', margin: '48px 0 8px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800 }}>
                  Supports de cours
                </h1>
                <p style={{ color: 'var(--text-m)', marginTop: 6 }}>
                  {withSupport} cours sur {courses.length} ont un support · connecté : {admin.email}
                </p>
              </div>
              <form action={logout}>
                <button type="submit" className="btn btn-ghost btn-sm">Se déconnecter</button>
              </form>
            </div>

            {!storageReady && (
              <div className="admin-msg admin-msg-error" style={{ margin: '20px 0' }}>
                Stockage de fichiers non configuré : la variable <code>BLOB_READ_WRITE_TOKEN</code> est absente.
                Crée un store Vercel Blob et relie-le au projet, puis redéploie (ou ajoute la variable dans .env en local).
              </div>
            )}

            <p style={{ color: 'var(--text-d)', fontSize: 13, margin: '12px 0 28px' }}>
              Formats : PDF, ZIP, Word, PowerPoint, Excel… (100 Mo maximum). Le fichier apparaît sur la page du cours
              et sur chaque page de vidéo du cours.
            </p>

            <div style={{ paddingBottom: 64 }}>
              {groups.map((group) => (
                <section key={group.category} style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--purple-l)' }}>
                    {group.category}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.courses.map((course) => (
                      <div key={course.id} className="admin-row">
                        <div className="admin-row-title">
                          <Link href={`/cours/${course.id}`} target="_blank">{course.title.trim()}</Link>
                          {!course.available && <span className="tag tag-amber" style={{ marginLeft: 8 }}>masqué</span>}
                        </div>
                        <SupportUploader
                          courseId={course.id}
                          supportName={course.supportName}
                          downloadUrl={course.supportUrl ? getDownloadUrl(course.supportUrl) : null}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
