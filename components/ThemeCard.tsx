import Link from 'next/link'

type ThemeCardProps = {
  id: number
  title: string
  description: string
  img: string
  courseCount: number
}

export default function ThemeCard({ theme }: { theme: ThemeCardProps }) {
  return (
    <Link href={`/thematique/${theme.id}`} className="course-card">
      <div className="course-thumb">
        {theme.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/uploads/images/themes/${theme.img}`}
            alt={theme.title}
          />
        ) : (
          <span className="course-thumb-placeholder">🗂️</span>
        )}
        <span className="tag tag-cyan" style={{ position: 'absolute', top: 10, right: 10 }}>
          {theme.courseCount} cours
        </span>
      </div>
      <div className="course-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="tag tag-purple">Thématique</span>
        </div>
        <div className="course-title">{theme.title}</div>
        {theme.description && (
          <div className="course-excerpt">{theme.description}</div>
        )}
        <div className="course-footer">
          <span style={{ marginLeft: 'auto', color: 'var(--purple-l)', fontWeight: 600 }}>Voir les cours →</span>
        </div>
      </div>
    </Link>
  )
}
