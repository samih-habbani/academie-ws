import Image from 'next/image'
import Link from 'next/link'
import { mediaSrc } from '@/lib/media'
import { themeUrl } from '@/lib/urls'
import { getDict } from '@/lib/i18n/dictionaries'
import { fmt, type Lang } from '@/lib/i18n/config'

type ThemeCardProps = {
  id: number
  slug: string
  title: string
  description: string
  img: string
  courseCount: number
}

export default function ThemeCard({ theme, lang }: { theme: ThemeCardProps; lang: Lang }) {
  const t = getDict(lang)
  return (
    // prefetch={false} : préchargement au survol plutôt qu'au scroll.
    <Link href={themeUrl(theme.slug, lang)} className="course-card" prefetch={false}>
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
          {fmt(t.theme.courseCount, { n: theme.courseCount })}
        </span>
      </div>
      <div className="course-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="tag tag-purple">{t.theme.tag}</span>
        </div>
        <div className="course-title">{theme.title}</div>
        {theme.description && (
          <div className="course-excerpt">{theme.description}</div>
        )}
        <div className="course-footer">
          <span style={{ marginLeft: 'auto', color: 'var(--purple-l)', fontWeight: 600 }}>{t.theme.seeCourses}</span>
        </div>
      </div>
    </Link>
  )
}
