import Link from 'next/link'
import { Difficulty } from '@prisma/client'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
}

type CourseCardProps = {
  id: number
  title: string
  logo: string
  difficulty: Difficulty | null
  description: string | null
  chapterCount: number | null
  duration: string
  theme?: { title: string } | null
}

export default function CourseCard({ course }: { course: CourseCardProps }) {
  return (
    <Link href={`/cours/${course.id}`} className="course-card">
      <div className="course-thumb">
        {course.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/uploads/images/courses/${course.logo}`}
            alt={course.title}
          />
        ) : (
          <span className="course-thumb-placeholder">🎬</span>
        )}
        {course.difficulty && (
          <span className="tag-overlay tag-overlay-purple">
            {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
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
            <span>▶ {course.chapterCount} chapitres</span>
          )}
          {course.duration && <span>⏱ {course.duration}</span>}
          <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 600 }}>Gratuit</span>
        </div>
      </div>
    </Link>
  )
}
