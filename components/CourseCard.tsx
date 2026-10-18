import Image from 'next/image'
import Link from 'next/link'
import { mediaSrc } from '@/lib/media'
import { courseUrl } from '@/lib/urls'
import { getDict } from '@/lib/i18n/dictionaries'
import { fmt, type Lang } from '@/lib/i18n/config'
import { Difficulty } from '@prisma/client'

type CourseCardProps = {
  id: number
  slug: string
  title: string
  logo: string
  difficulty: Difficulty | null
  description: string | null
  chapterCount: number | null
  duration: string
  theme?: { title: string } | null
}

export default function CourseCard({ course, lang }: { course: CourseCardProps; lang: Lang }) {
  const t = getDict(lang)
  const chaptersLabel = course.chapterCount === 1 ? t.course.chapters_one : t.course.chapters_other
  return (
    // prefetch={false} : pas de préchargement au scroll (une page entière par carte visible),
    // il se fait au survol de la carte.
    <Link href={courseUrl(course.slug, lang)} className="course-card" prefetch={false}>
      <div className="course-thumb">
        {course.logo ? (
          // Carte ≈ 280–362px de large dès 640px, pleine largeur (moins la marge) en dessous.
          <Image
            src={mediaSrc('courses', course.logo)}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            quality={70}
          />
        ) : (
          <span className="course-thumb-placeholder">🎬</span>
        )}
        {course.difficulty && (
          <span className="tag-overlay tag-overlay-purple">
            {t.course.difficulty[course.difficulty] ?? course.difficulty}
          </span>
        )}
      </div>
      <div className="course-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {course.theme && <span className="tag tag-cyan">{course.theme.title}</span>}
        </div>
        <div className="course-title">{course.title}</div>
        {course.description && (
          <div className="course-excerpt">{course.description}</div>
        )}
        <div className="course-footer">
          {course.chapterCount && (
            <span>▶ {fmt(chaptersLabel, { n: course.chapterCount })}</span>
          )}
          {course.duration && <span>⏱ {course.duration}</span>}
          <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 600 }}>{t.common.free}</span>
        </div>
      </div>
    </Link>
  )
}
