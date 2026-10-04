import Image from 'next/image'
import Link from 'next/link'
import { mediaSrc } from '@/lib/media'

type ThemeCardProps = {
  id: number
  title: string
  description: string
  img: string
  courseCount: number
}

export default function ThemeCard({ theme }: { theme: ThemeCardProps }) {
  return (
    // prefetch={false} : préchargement au survol plutôt qu'au scroll.
    <Link href={`/thematique/${theme.id}`} className="course-card" prefetch={false}>
      <div className="course-thumb">
        {theme.img ? (
          <Image
            src={mediaSrc('themes', theme.img)}
            alt={theme.title}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            quality={70}
          />
        ) : (
          <span className="course-thumb-placeholder">🗂️</span>
        )}
        <span className="tag-overlay tag-overlay-cyan">
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
